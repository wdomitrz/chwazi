let players = new Map();
let chosenPlayer;
let started_timeout = false;
let timeout_start_time = undefined;

const REQUIRED_PLAYER_COUNT = 2;
const INNER_RADIUS = 36;
const OUTER_RADIUS = 16;
const OUTER_CIRCLE_WIDTH = 12;
const MAX_PULSE_SCALE = 0.125;
const DRAWING_TIME_MS = 2500;
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

  let start_time = undefined;

  function animationFrame(timestamp) {
    if (start_time === undefined) start_time = timestamp;
    if (started_timeout && timeout_start_time === undefined)
      timeout_start_time = timestamp;
    const pulseScale =
      1 +
      MAX_PULSE_SCALE *
        Math.sin(
          (((timestamp - start_time) % SCALING_PERIOD_MS) / SCALING_PERIOD_MS) *
            2 *
            Math.PI
        );

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (chosenPlayer !== undefined) {
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
      chosenPlayer.drawPlayerCircle(ctx, pulseScale, 1.0);
    } else {
      const loadingScale =
        timeout_start_time === undefined
          ? 0.0
          : Math.min(
              1 -
                (DRAWING_TIME_MS - (timestamp - timeout_start_time)) /
                  DRAWING_TIME_MS,
              1.0
            );
      players
        .values()
        .forEach((player) =>
          player.drawPlayerCircle(ctx, pulseScale, loadingScale)
        );
    }

    requestAnimationFrame(animationFrame);
  }

  requestAnimationFrame(animationFrame);
})();

const startTimer = (function () {
  let timeout;

  function clearTimer() {
    if (timeout !== undefined) {
      window.clearTimeout(timeout);
      timeout = undefined;
      started_timeout = false;
      timeout_start_time = undefined;
    }
  }

  function startTimer() {
    started_timeout = true;
    timeout = window.setTimeout(Player.drawPlayer, DRAWING_TIME_MS);
  }

  function restartAndStartTimer() {
    clearTimer();
    if (players.size < REQUIRED_PLAYER_COUNT) return;
    if (chosenPlayer !== undefined) return;
    startTimer();
  }

  return restartAndStartTimer;
})();

class Player {
  static get_color(id) {
    return `hsl(${id * 223 + 263}, 100%, 40%)`;
  }
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.color = Player.get_color(id);
    this.isChosen = false;
    this.chosenTime = undefined;
  }

  update_pos(x, y) {
    this.x = x;
    this.y = y;
  }

  del() {
    players.delete(this.id);
  }

  drawPlayerCircle(ctx, pulseScale, loadingScale) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, INNER_RADIUS * pulseScale, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
      this.x,
      this.y,
      (INNER_RADIUS + OUTER_RADIUS) * pulseScale,
      0,
      Math.PI * 2
    );
    ctx.lineWidth = OUTER_CIRCLE_WIDTH * pulseScale;
    ctx.strokeStyle = this.color;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(
      this.x,
      this.y,
      (INNER_RADIUS + OUTER_RADIUS) * pulseScale,
      (Math.PI * 2 * (1 - loadingScale)) / 2,
      (Math.PI * 2 * (1 - loadingScale) * 3) / 2
    );
    ctx.lineWidth = OUTER_CIRCLE_WIDTH * pulseScale;
    ctx.strokeStyle = `rgba(255, 255, 255, 0.34)`;
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
    if (chosenPlayer === undefined) {
      players.set(
        data.pointerId,
        new Player(data.pointerId, data.clientX, data.clientY)
      );
      startTimer();
    }
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
        chosenPlayer = undefined;
      }, RESTART_DELAY);
      players.clear();
    } else {
      player.del();
      startTimer();
    }
  }
}

document.addEventListener("pointerdown", Player.newPlayer);
document.addEventListener("pointermove", Player.playerUpdatePos);
document.addEventListener("pointercancel", Player.playerDel);
document.addEventListener("pointerup", Player.playerDel);

document.addEventListener("touchmove", (e) => e.preventDefault(), {
  passive: false,
});

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
