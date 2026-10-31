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

// Page layout

app.style.backgroundColor = "#a8e7bb";
app.style.color = "#103b12";
app.style.fontFamily = "Arial, sans-serif";
app.style.padding = "30px";
app.style.minHeight = "100vh";

document.body.style.margin = "0";
document.body.style.backgroundColor = "#a8e7bb";

// styling for the work space
const workSpace = document.createElement("div");
workSpace.style.display = "flex";
workSpace.style.alignItems = "flex-start";
workSpace.style.gap = "15px";
workSpace.style.width = "max-content";

// styling for the canvas area
const canvasArea = document.createElement("div");
canvasArea.style.backgroundColor = "#3b793e";
canvasArea.style.padding = "5px";
canvasArea.style.borderRadius = "5px";
canvasArea.style.flexShrink = "0";

canvas.style.display = "block";
canvas.style.borderRadius = "4px";
canvasArea.append(canvas);

// styling for the sidebar
const sideBar = document.createElement("div");
sideBar.style.width = "500px";
sideBar.style.flexShrink = "0";
sideBar.style.padding = "20px";
sideBar.style.backgroundColor = "#3b793e";
sideBar.style.borderRadius = "5px";
sideBar.style.boxSizing = "border-box";

workSpace.append(canvasArea, sideBar);
app.append(heading, message, workSpace);

function styleButton(button: HTMLButtonElement) {
  button.style.backgroundColor = "#62a866";
  button.style.color = "#103b12";
  button.style.border = "2px solid #103b12";
  button.style.padding = "10px 15px";
  button.style.margin = "4px";
  button.style.borderRadius = "6px";
  button.style.cursor = "pointer";
  button.style.fontWeight = "bold";
}

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
  draw: (target: CanvasRenderingContext2D) => void;
};

type Tool = {
  name: string;
  kind: "marker" | "sticker";
  color?: string;
  width?: number;
  text?: string;
  size?: number;
};

let currentStroke: Stroke | null = null;
let currentPointerId: number | null = null;
const commands: DrawCommand[] = [];
const redoStack: DrawCommand[] = [];

const tools: Tool[] = [
  { name: "Marker", kind: "marker", color: "black", width: 4 },
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
    command.draw(target);
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
    addCommand({
      draw(target) {
        drawStroke(stroke, target);
      },
    });
  }

  if (currentSticker !== null) {
    const sticker = currentSticker;
    addCommand({
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
    styleButton(button);

    if (tool === selectedTool) {
      button.style.backgroundColor = "#80cf89";
      button.style.border = "2px solid #d9f5df";
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
sideBar.append(toolHeading, toolButtons);

// marker thickness slider
const thicknessLabel = document.createElement("label");
thicknessLabel.textContent = "Marker Thickness: 4px";

const thicknessSlider = document.createElement("input");
thicknessSlider.type = "range";
thicknessSlider.min = "1";
thicknessSlider.max = "30";
thicknessSlider.value = "4";

thicknessSlider.addEventListener("input", () => {
  const thickness = Number(thicknessSlider.value);

  tools[0].width = thickness;
  thicknessLabel.textContent = `Marker Thickness: ${thickness}px`;
});

sideBar.append(thicknessLabel, thicknessSlider);

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

sideBar.append(customHeading, nameInput, stickerInput, createButton);

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

sideBar.append(redrawButton);

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

sideBar.append(undoButton);

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

sideBar.append(redoButton);

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

sideBar.append(clearButton);

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

// sidebar styling function
function styleSidebar() {
  const headings = sideBar.querySelectorAll("h3");

  for (const heading of headings) {
    heading.style.color = "#d9f5df";
    heading.style.marginTop = "15px";
    heading.style.marginBottom = "10px";
  }

  const buttons = sideBar.querySelectorAll("button");
  for (const button of buttons) {
    if (!toolButtons.contains(button)) {
      styleButton(button);
    }
  }

  const inputs = sideBar.querySelectorAll("input");
  for (const input of inputs) {
    input.style.backgroundColor = "#d9f5df";
    input.style.color = "#103b12";
    input.style.padding = "10px";
    input.style.marginBottom = "10px";
    input.style.border = "2px solid #62a866";
    input.style.borderRadius = "6px";
    input.style.boxSizing = "border-box";
    input.style.width = "100%";
  }

  // thickness slider styling
  thicknessSlider.style.accentColor = "#80cf89";
  thicknessSlider.style.cursor = "pointer";
  thicknessSlider.style.padding = "0";
  thicknessSlider.style.border = "none";
  thicknessLabel.style.color = "#d9f5df";
  thicknessLabel.style.fontWeight = "bold";
  thicknessLabel.style.display = "block";
  thicknessLabel.style.marginTop = "15px";

  // Export button
  exportButton.style.backgroundColor = "#80cf89";
  exportButton.style.color = "#103b12";
  exportButton.style.width = "100%";
  exportButton.style.fontWeight = "bold";
}

sideBar.append(exportButton);
styleSidebar();
updateHistoryButtons();
