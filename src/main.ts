// canvas and text at top
const app = document.querySelector<HTMLDivElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "D2 Drawing Project";

const message = document.createElement("p");
message.textContent =
  "Pick a marker and drag on the canvas, or pick a sticker and click to place it. " +
  "Press Esc mid-stroke to cancel. Export PNG saves a 1600×1200 image with a white background.";

const canvas = document.createElement("canvas");
canvas.width = 800;
canvas.height = 600;
canvas.style.border = "2px solid black";
canvas.style.backgroundColor = "white";
canvas.style.touchAction = "none";

const ctx = canvas.getContext("2d")!;

app.append(heading, message, canvas);

// data for drawing strokes

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  points: Point[];
  color: string;
  width: number;
};

type Sticker = {
  position: Point;
  text: string;
  size: number;
};

type DrawCommand = {
  kind: "stroke" | "sticker";
  draw: (target: CanvasRenderingContext2D) => void;
  stroke?: Stroke;
};

type Tool = {
  name: string;
  kind: "marker" | "sticker";
  color?: string;
  width?: number;
  text?: string;
  size?: number;
};

const strokes: Stroke[] = [];
let currentStroke: Stroke | null = null;
let currentPointerId: number | null = null;
const commands: DrawCommand[] = [];
const redoStack: DrawCommand[] = [];

const tools: Tool[] = [
  { name: "Normal", kind: "marker", color: "black", width: 4 },
  { name: "Thin", kind: "marker", color: "black", width: 2 },
  { name: "Thick", kind: "marker", color: "black", width: 8 },
  { name: "Smily Face", kind: "sticker", text: ":)", size: 40 },
  { name: "Dinosaur", kind: "sticker", text: "🦕", size: 40 },
  { name: "Star", kind: "sticker", text: "⭐️", size: 40 },
];

let selectedTool = tools[0];
let currentSticker: Sticker | null = null;

// mouse position tracking

function getPointerPos(event: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

// line drawing function
function drawStroke(stroke: Stroke, target: CanvasRenderingContext2D = ctx) {
  if (stroke.points.length === 0) return;

  target.save(); //keep this stroke's styles from leaking into the next one
  target.strokeStyle = stroke.color;
  target.lineWidth = stroke.width;
  target.lineCap = "round";
  target.lineJoin = "round";

  target.beginPath();
  const firstPoint = stroke.points[0];
  target.moveTo(firstPoint.x, firstPoint.y);
  if (stroke.points.length === 1) {
    target.lineTo(firstPoint.x, firstPoint.y); //single click leaves a dot
  }
  for (let i = 1; i < stroke.points.length; i++) {
    target.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  target.stroke();
  target.restore();
}

// sticker drawing function

function drawSticker(sticker: Sticker, target: CanvasRenderingContext2D) {
  target.save();
  target.font = `${sticker.size}px sans-serif`;
  target.textAlign = "center";
  target.textBaseline = "middle";
  target.fillStyle = "black";
  target.fillText(
    sticker.text,
    sticker.position.x,
    sticker.position.y,
  );
  target.restore();
}

function addCommand(command: DrawCommand) {
  commands.push(command);
  redoStack.length = 0;
  updateHistoryButtons();
}

function replay(target: CanvasRenderingContext2D) {
  for (const command of commands) {
    target.save();
    command.draw(target);
    target.restore();
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  replay(ctx);

  if (currentStroke !== null) {
    drawStroke(currentStroke);
  }
}

// gesture handling
// cancelled pointer, lost capture, or esc discard it
function endGesture() {
  const pointerId = currentPointerId;
  currentStroke = null;
  currentPointerId = null;
  currentSticker = null;
  if (pointerId !== null && canvas.hasPointerCapture(pointerId)) {
    canvas.releasePointerCapture(pointerId);
  }
}

function cancelGesture() {
  if (currentPointerId === null) return;
  endGesture();
  render();
}

// drawing event listeners

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || currentPointerId !== null) {
    return;
  }

  if (selectedTool.kind === "marker") {
    currentStroke = {
      points: [getPointerPos(event)],
      color: selectedTool.color ?? "black",
      width: selectedTool.width ?? 4,
    };
  } else {
    currentSticker = {
      position: getPointerPos(event),
      text: selectedTool.text ?? "",
      size: selectedTool.size ?? 40,
    };
  }

  currentPointerId = event.pointerId;

  canvas.setPointerCapture(event.pointerId);
  render();
});

//==========================================================//
// Currently doesn't handle stickers at all, will fix later //
//==========================================================//
canvas.addEventListener("pointermove", (event) => {
  if (currentStroke === null || event.pointerId !== currentPointerId) {
    return;
  }

  currentStroke.points.push(getPointerPos(event));
  render();
});

canvas.addEventListener("pointerup", (event) => {
  if (event.pointerId !== currentPointerId) return;

  if (currentStroke !== null) {
    const stroke = currentStroke;
    strokes.push(stroke);
    addCommand({
      kind: "stroke",
      stroke: stroke,
      draw(target) {
        drawStroke(stroke, target);
      },
    });
  }

  if (currentSticker !== null) {
    const sticker = currentSticker;

    addCommand({
      kind: "sticker",
      draw(target) {
        drawSticker(sticker, target);
      },
    });
  }
  endGesture();
  render();
});

canvas.addEventListener("pointercancel", (event) => {
  if (event.pointerId === currentPointerId) cancelGesture();
});

canvas.addEventListener("lostpointercapture", (event) => {
  if (event.pointerId === currentPointerId) cancelGesture();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") cancelGesture();
});

const toolHeading = document.createElement("h3");
toolHeading.textContent = "Drawing Tools";

const toolButtons = document.createElement("div");

function showTools() {
  toolButtons.replaceChildren();

  for (const tool of tools) {
    const button = document.createElement("button");
    button.textContent = tool.name;

    if (tool === selectedTool) {
      button.style.fontWeight = "bold";
      button.style.border = "2px solid blue";
    }

    button.addEventListener("click", () => {
      cancelGesture();
      selectedTool = tool;
      showTools();
    });
    toolButtons.append(button);
  }
}

showTools();
app.append(toolHeading, toolButtons);

const customHeading = document.createElement("h3");
customHeading.textContent = "Create a custom sticker";

const nameInput = document.createElement("input");
nameInput.placeholder = "Sticker name";

const stickerInput = document.createElement("input");
stickerInput.placeholder = "Emoji or text";

const createButton = document.createElement("button");
createButton.textContent = "Create Sticker";

createButton.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const text = stickerInput.value.trim();

  if (name === "" || text === "") {
    return;
  }

  tools.push({
    name: name,
    kind: "sticker",
    text: text,
    size: 40,
  });

  nameInput.value = "";
  stickerInput.value = "";
  showTools();
});

app.append(customHeading, nameInput, stickerInput, createButton);

function updateHistoryButtons() {
  undoButton.disabled = commands.length === 0;
  redoButton.disabled = redoStack.length === 0;
}

// redraw button

const redrawButton = document.createElement("button");
redrawButton.textContent = "Redraw";

redrawButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  setTimeout(render, 500);
});

app.append(redrawButton);

//Undo Button

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";

undoButton.addEventListener("click", () => {
  const command = commands.pop();
  if (command) {
    redoStack.push(command);
    updateHistoryButtons();
    render();
  }
});

app.append(undoButton);

//Redo Button

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";

redoButton.addEventListener("click", () => {
  const command = redoStack.pop();
  if (command) {
    commands.push(command);
    updateHistoryButtons();
    render();
  }
});

app.append(redoButton);

// clear button

const clearButton = document.createElement("button");
clearButton.textContent = "Clear";

clearButton.addEventListener("click", () => {
  const ok = confirm(
    "Clear the whole drawing? This also erases undo/redo history and cannot be undone.",
  );
  if (!ok) return;
  cancelGesture();
  redoStack.length = 0;
  commands.length = 0;
  updateHistoryButtons();
  render();
});

app.append(clearButton);

// export button

const exportButton = document.createElement("button");
exportButton.textContent = "Export PNG";

exportButton.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width * 2;
  exportCanvas.height = canvas.height * 2;

  const exportCtx = exportCanvas.getContext("2d");
  if (!exportCtx) return;

  exportCtx.fillStyle = "White";
  exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  exportCtx.scale(2, 2);
  replay(exportCtx);

  exportCanvas.toBlob((blob) => {
    if (!blob) return;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "myDrawing.png";
    link.click();

    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }, "image/png");
});

app.append(exportButton);
updateHistoryButtons();
