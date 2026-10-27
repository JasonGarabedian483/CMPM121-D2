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

  const allStrokes = [...strokes];

  if (currentStroke !== null) {
    allStrokes.push(currentStroke);
  }

  for (const stroke of allStrokes) {
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const firstPoint = stroke.points[0];

    if (!firstPoint) {
      continue;
    }

    ctx.moveTo(firstPoint.x, firstPoint.y);

    if (stroke.points.length === 1) {
      ctx.lineTo(firstPoint.x, firstPoint.y);
    }

    for (const point of stroke.points.slice(1)) {
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
  if (currentStroke === null) {
    return;
  }
  strokes.push(currentStroke);
  currentStroke = null;
  render();
});

// redraw button

const redrawButton = document.createElement("button");
redrawButton.textContent = "Redraw";

redrawButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  setTimeout(() => {
    render();
  }, 500);
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
