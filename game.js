const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 400;

// Load Images
const characterIdle = new Image();
characterIdle.src = "assets/images/character_idle.png";

const characterWalk = new Image();
characterWalk.src = "assets/images/character_walk.png";

const characterJump = new Image();
characterJump.src = "assets/images/character_jump.png";

// Character object
let character = {
  x: 100,
  y: 300,
  width: 50,
  height: 70,
  vy: 0,
  gravity: 0.8,
  jumpPower: -12,
  grounded: true,
  speed: 4,
  moving: false,
  jumping: false,
  sprite: characterIdle
};

// Controls
let keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.code] = true;

  if (e.code === "Space" && character.grounded) {
    character.vy = character.jumpPower;
    character.grounded = false;
    character.jumping = true;
    character.sprite = characterJump;
  }
});
document.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

// Update loop
function update() {
  character.moving = false;

  if (keys["ArrowRight"]) {
    character.x += character.speed;
    character.moving = true;
  }
  if (keys["ArrowLeft"]) {
    character.x -= character.speed;
    character.moving = true;
  }

  // Apply gravity
  character.y += character.vy;
  character.vy += character.gravity;

  // Ground check
  if (character.y + character.height >= canvas.height - 20) {
    character.y = canvas.height - 20 - character.height;
    character.vy = 0;
    character.grounded = true;
    character.jumping = false;
  }

  // Sprite state
  if (character.jumping) {
    character.sprite = characterJump;
  } else if (character.moving) {
    character.sprite = characterWalk;
  } else {
    character.sprite = characterIdle;
  }
}

// Draw loop
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw ground
  ctx.fillStyle = "#6ab04c";
  ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

  // Draw character
  ctx.drawImage(character.sprite, character.x, character.y, character.width, character.height);
}

// Game loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();
