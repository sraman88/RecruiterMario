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
  y: 350,
  width: 80,   // bigger size
  height: 100, // bigger size
  dy: 0,
  gravity: 0.8,
  grounded: false,
  state: "idle", // idle, walk, jump
};

// Offers thrown
const offers = [];

// Candidates
const candidates = [
  { x: 600, y: 380, width: 60, height: 80, hit: false },
  { x: 800, y: 380, width: 60, height: 80, hit: false },
];

// Enemies
const enemies = [
  { x: 500, y: 380, width: 70, height: 80 },
  { x: 750, y: 380, width: 70, height: 80 },
];

// Input
const keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.code] = true;

  if (e.code === "ArrowUp" && player.grounded) {
    player.dy = -18;
    player.grounded = false;
    player.state = "jump";
  }

  if (e.code === "Space") {
    offers.push({
      x: player.x + player.width,
      y: player.y + player.height / 2,
      width: 40,
      height: 40,
      dx: 6,
    });
  }
});
document.addEventListener("keyup", (e) => (keys[e.code] = false));

// Update
function update() {
  // Movement
  if (keys["ArrowRight"]) {
    player.x += 5;
    if (player.grounded) player.state = "walk";
  } else if (keys["ArrowLeft"]) {
    player.x -= 5;
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
  offers.forEach((offer)
