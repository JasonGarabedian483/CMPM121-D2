// canvas and text at top
const app = document.querySelector<HTMLDivElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "D2 Drawing Project";

const message = document.createElement("p");
message.textContent =
  "To start drawing, click on the canvas below and use your mouse to draw.";

const canvas = document.createElement("canvas");
canvas.width = 800;
canvas.height = 600;
canvas.style.border = "2px solid black";
canvas.style.backgroundColor = "white";
canvas.style.touchAction = "none";

const ctx = canvas.getContext("2d")!;

app.append(heading, message, canvas);

// data saved for drawing strokes

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  points: Point[];
  color: string;
  width: number;
};

const strokes: Stroke[] = [];
let currentStroke: Stroke | null = null;
let currentPointerId: number | null = null;

// mouse position tracking

function getPointerPos(event: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

// drawing function
function drawStroke(stroke: Stroke) {
  if (stroke.points.length === 0) return;

  ctx.save(); //keep this stroke's styles from leaking into the next one
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  const firstPoint = stroke.points[0];
  ctx.moveTo(firstPoint.x, firstPoint.y);
  if (stroke.points.length === 1) {
    ctx.lineTo(firstPoint.x, firstPoint.y); //single click leaves a dot
  }
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const stroke of strokes) {
    drawStroke(stroke);
  }
  if (currentStroke !== null) {
    drawStroke(currentStroke);
  }
}

//gesture handling
//cancelled pointer, lost capture, or esc discard it
function endGesture() {
  const pointerId = currentPointerId;
  currentStroke = null;
  currentPointerId = null;
  if (pointerId !== null && canvas.hasPointerCapture(pointerId)) {
    canvas.releasePointerCapture(pointerId);
  }
}

function cancelGesture() {
  if (currentStroke === null) return;
  endGesture();
  render();
}

// drawing event listeners

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || currentStroke !== null) {
    return;
  }

  currentStroke = {
    points: [getPointerPos(event)],
    color: "black",
    width: 4,
  };

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
  if (currentStroke === null || event.pointerId !== currentPointerId) return;
  strokes.push(currentStroke);
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
// redraw button

const redrawButton = document.createElement("button");
redrawButton.textContent = "Redraw";

redrawButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  setTimeout(render, 500);
});

app.append(redrawButton);

// clear button

const clearButton = document.createElement("button");
clearButton.textContent = "Clear";

clearButton.addEventListener("click", () => {
  strokes.length = 0;
  cancelGesture();
  render();
});

app.append(clearButton);
