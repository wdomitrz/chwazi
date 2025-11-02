console.log("version 2");
// Get the main canvas and set up the context
const canvas = document.getElementById("gameCanvas");

// Set the canvas size to match the window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Set the radius of the inner circle
const innerRadius = 36;
const outerRadius = 16;
const outerCircleWidth = 12;

// Initialize player data and debug info
let players = {};

// Helper function to create a circle on a new canvas
function createCircleCanvas(color) {
  // Create a new canvas for each touch
  const circleCanvas = document.createElement("canvas");
  circleCanvas.width = innerRadius * 2 + outerRadius * 2 + outerCircleWidth * 2;
  circleCanvas.height =
    innerRadius * 2 + outerRadius * 2 + outerCircleWidth * 2;
  const circleCtx = circleCanvas.getContext("2d");

  // Draw the inner circle (solid color)
  circleCtx.beginPath();
  circleCtx.arc(
    circleCanvas.width / 2,
    circleCanvas.height / 2,
    innerRadius,
    0,
    Math.PI * 2
  );
  circleCtx.fillStyle = color;
  circleCtx.fill();

  // Draw the outer circle (halo)
  circleCtx.beginPath();
  circleCtx.arc(
    circleCanvas.width / 2,
    circleCanvas.height / 2,
    innerRadius + outerRadius,
    0,
    Math.PI * 2
  );
  circleCtx.lineWidth = outerCircleWidth;
  circleCtx.strokeStyle = color;
  circleCtx.stroke();

  return circleCanvas;
}
function player_get_canvas_x_y(self) {
  const offset = innerRadius + outerRadius + outerCircleWidth;
  return [self.x - offset, self.y - offset];
}
function playser_set_canvas_pos(self) {
  const [x, y] = player_get_canvas_x_y(self);
  self.canvas.style.position = "absolute";
  self.canvas.style.left = `${x}px`;
  self.canvas.style.top = `${y}px`;
}
function player_update_pos(self, update) {
  self.x = update.clientX;
  self.y = update.clientY;
  playser_set_canvas_pos(self);
}

function player_init(data) {
  const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
  const player = {
    id: data.identifier,
    x: data.clientX,
    y: data.clientY,
    color: color,
    canvas: createCircleCanvas(color),
  };

  playser_set_canvas_pos(player);
  document.body.appendChild(player.canvas);

  players[player.id] = player;

  console.log(
    `Player #${player.id} placed finger at (${player.x}, ${player.y})\n`
  );
}
function player_del(id) {
  const player = players[id];
  document.body.removeChild(players[id].canvas);
  delete players[id];
  console.log(
    `Player #${player.id} lifted finger from (${player.x}, ${player.y})\n`
  );
}

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();

  Array.from(e.changedTouches).forEach((touch) => {
    player_init(touch);
  });
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();

  Array.from(e.changedTouches).forEach((touch) => {
    if (touch.identifier in players)
      player_update_pos(players[touch.identifier], touch);
  });
});

canvas.addEventListener("touchend", (e) => {
  e.preventDefault();

  Array.from(e.changedTouches).forEach((touch) => {
    player_del(touch.identifier);
  });
});

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
