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

// mouse position tracking

function getPointerPos(event: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

// drawing function

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const stroke of strokes) {
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (stroke.points.length === 0) {
      continue;
    }

    const firstPoint = stroke.points[0];
    ctx.moveTo(firstPoint.x, firstPoint.y);

    for (let i = 1; i < stroke.points.length; i++) {
      const point = stroke.points[i];
      ctx.lineTo(point.x, point.y);
    }

    ctx.stroke();
  }
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

  strokes.push(currentStroke);

  canvas.setPointerCapture(event.pointerId);
  render();
});

canvas.addEventListener("pointermove", (event) => {
  if (currentStroke === null) {
    return;
  }

  currentStroke.points.push(getPointerPos(event));
  render();
});

canvas.addEventListener("pointerup", () => {
  currentStroke = null;
  render();
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
  currentStroke = null;
  render();
});

app.append(clearButton);
