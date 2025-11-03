let players = new Map();
let chosenPlayer;

const REQUIRED_PLAYER_COUNT = 1;
const INNER_RADIUS = 36;
const OUTER_RADIUS = 16;
const OUTER_CIRCLE_WIDTH = 12;
const MAX_PULSE_SCALE = 0.125;
const DRAWING_TIME_MS = 2000;
const CHOSEN_PLAYER_ANIMATION_TIME_MS = 1000;
const SCALING_PERIOD_MS = 1500;
const CHOSEN_SEPARATION = 8;
const RESTART_DELAY = 2000;
const MIN_WINNER_RADIUS =
  (INNER_RADIUS + OUTER_RADIUS + OUTER_CIRCLE_WIDTH / 2 + CHOSEN_SEPARATION) *
  (1 + MAX_PULSE_SCALE);

const _animation = (function () {
  const [canvas, ctx] = (function () {
    const canvas = document.getElementById("main");
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth);
      canvas.height = Math.floor(window.innerHeight);
    };
    window.addEventListener("resize", resize);
    resize();

    return [canvas, ctx];
  })();

  let start;

  function animationFrame(timestamp) {
    if (start === undefined) start = timestamp;
    const scalePeriod =
      ((timestamp - start) % SCALING_PERIOD_MS) / SCALING_PERIOD_MS;
    const scale = 1 + MAX_PULSE_SCALE * Math.sin(scalePeriod * 2 * Math.PI);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (chosenPlayer !== undefined) {
      chosenPlayer.drawPlayerCircle(ctx, scale);
      const winnerScale = Math.min(
        (timestamp - chosenPlayer.getChosenTime(timestamp)) /
          CHOSEN_PLAYER_ANIMATION_TIME_MS,
        1.0
      );
      chosenPlayer.drawWinnerCircle(
        ctx,
        winnerScale,
        canvas.width,
        canvas.height
      );
    } else {
      players.values().forEach((player) => player.drawPlayerCircle(ctx, scale));
    }

    requestAnimationFrame(animationFrame);
  }

  requestAnimationFrame(animationFrame);
})();

const startTimer = (function () {
  let timeout;

  function _startTimer() {
    if (timeout !== undefined) {
      window.clearTimeout(timeout);
      timeout = undefined;
    }

    if (players.size < REQUIRED_PLAYER_COUNT) return;
    if (chosenPlayer !== undefined) return;
    timeout = window.setTimeout(Player.drawPlayer, DRAWING_TIME_MS);
  }

  return _startTimer;
})();

class Player {
  _get_color() {
    return `hsl(${Math.random() * 360}, 100%, 50%)`;
  }
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.color = this._get_color();
    this.isChosen = false;
    this.chosenTime = undefined;
    console.log(`Player #${this.id} placed finger at (${this.x}, ${this.y})\n`);
  }

  update_pos(x, y) {
    this.x = x;
    this.y = y;
  }

  del() {
    players.delete(this.id);

    console.log(
      `Player #${this.id} lifted finger from (${this.x}, ${this.y})\n`
    );
  }

  drawPlayerCircle(ctx, scale) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, INNER_RADIUS * scale, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
      this.x,
      this.y,
      (INNER_RADIUS + OUTER_RADIUS) * scale,
      0,
      Math.PI * 2
    );
    ctx.lineWidth = OUTER_CIRCLE_WIDTH * scale;
    ctx.strokeStyle = this.color;
    ctx.stroke();
  }

  drawWinnerCircle(ctx, animation_completion_part, fullWidth, fullHeight) {
    const winnerRadius =
      animation_completion_part * MIN_WINNER_RADIUS +
      (1 - animation_completion_part) *
        Math.max(fullHeight, fullHeight, MIN_WINNER_RADIUS);

    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.rect(0, 0, fullWidth, fullHeight);
    ctx.arc(this.x, this.y, winnerRadius, 0, Math.PI * 2);
    ctx.fill("evenodd");
  }

  getChosenTime(timestamp) {
    if (!this.isChosen) return;
    if (this.chosenTime === undefined) this.chosenTime = timestamp;
    return this.chosenTime;
  }

  static drawPlayer() {
    if (players.size < REQUIRED_PLAYER_COUNT) return;
    if (chosenPlayer !== undefined) return;
    chosenPlayer = Array.from(players.values())[
      Math.floor(Math.random() * players.size)
    ];
    chosenPlayer.isChosen = true;
    players.clear();
    players.set(chosenPlayer.id, chosenPlayer);
  }

  static newPlayer(data) {
    players.set(
      data.pointerId,
      new Player(data.pointerId, data.clientX, data.clientY)
    );
    startTimer();
  }
  static playerUpdatePos(data) {
    const player = players.get(data.pointerId);
    if (player === undefined) return;
    player.update_pos(data.clientX, data.clientY);
  }
  static playerDel(data) {
    const player = players.get(data.pointerId);
    if (player === undefined) return;

    if (player.isChosen) {
      window.setTimeout(() => {
        console.log("zxcv");
        chosenPlayer = undefined;
      }, RESTART_DELAY);
      console.log("asdf");
    }

    player.del();
    players.clear();
    startTimer();
  }
}

document.addEventListener("pointerdown", Player.newPlayer);
document.addEventListener("pointermove", Player.playerUpdatePos);
document.addEventListener("pointercancel", Player.playerDel);
document.addEventListener("pointerup", Player.playerDel);

document.addEventListener("touchmove", (e) => e.preventDefault(), {
  passive: false,
});

// if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
