const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 900;
canvas.height = 500;

// Load images
const images = {};
const imageSources = {
  idle: "assets/images/character_idle.png",
  walk: "assets/images/character_walk.png",
  jump: "assets/images/character_jump.png",
  candidate: "assets/images/candidate.png",
  offer: "assets/images/offer.png",
  pillar: "assets/images/pillar.png",
  enemy: "assets/images/enemy_demon.png",
};

for (let key in imageSources) {
  images[key] = new Image();
  images[key].src = imageSources[key];
}

// Character
const player = {
  x: 100,
  y: 400,
  width: 50,
  height: 50,
  dy: 0,
  gravity: 0.8,
  grounded: false,
  state: "idle", // idle, walk, jump
};

// Offers thrown
const offers = [];

// Candidates
const candidates = [
  { x: 600, y: 420, width: 40, height: 40, hit: false },
  { x: 800, y: 420, width: 40, height: 40, hit: false },
];

// Enemies
const enemies = [
  { x: 500, y: 420, width: 40, height: 40 },
  { x: 750, y: 420, width: 40, height: 40 },
];

// Input
const keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.code] = true;

  if (e.code === "Space" && player.grounded) {
    player.dy = -15;
    player.grounded = false;
    player.state = "jump";
  }

  if (e.code === "KeyF") {
    offers.push({ x: player.x + player.width, y: player.y + 20, width: 20, height: 20, dx: 6 });
  }
});
document.addEventListener("keyup", (e) => (keys[e.code] = false));

// Update
function update() {
  // Movement
  if (keys["ArrowRight"]) {
    player.x += 4;
    if (player.grounded) player.state = "walk";
  } else if (keys["ArrowLeft"]) {
    player.x -= 4;
    if (player.grounded) player.state = "walk";
  } else if (player.grounded) {
    player.state = "idle";
  }

  // Gravity
  player.y += player.dy;
  if (player.y + player.height < canvas.height) {
    player.dy += player.gravity;
    player.grounded = false;
  } else {
    player.y = canvas.height - player.height;
    player.dy = 0;
    player.grounded = true;
    if (player.state === "jump") player.state = "idle";
  }

  // Move offers
  offers.forEach((offer, index) => {
    offer.x += offer.dx;
    if (offer.x > canvas.width) offers.splice(index, 1);
  });

  // Collisions with candidates
  offers.forEach((offer) => {
    candidates.forEach((c) => {
      if (!c.hit && isColliding(offer, c)) {
        c.hit = true;
      }
    });
  });

  // Collisions with enemies
  offers.forEach((offer, index) => {
    enemies.forEach((enemy, eIndex) => {
      if (isColliding(offer, enemy)) {
        enemies.splice(eIndex, 1);
        offers.splice(index, 1);
      }
    });
  });
}

// Draw
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player
  ctx.drawImage(images[player.state], player.x, player.y, player.width, player.height);

  // Candidates
  candidates.forEach((c) => {
    if (!c.hit) ctx.drawImage(images.candidate, c.x, c.y, c.width, c.height);
  });

  // Enemies
  enemies.forEach((enemy) => {
    ctx.drawImage(images.enemy, enemy.x, enemy.y, enemy.width, enemy.height);
  });

  // Offers
  offers.forEach((offer) => {
    ctx.drawImage(images.offer, offer.x, offer.y, offer.width, offer.height);
  });
}

// Collision check
function isColliding(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

// Game loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
