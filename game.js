// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Load images
const characterImg = new Image();
characterImg.src = "assets/images/character.png";

const candidateImg = new Image();
candidateImg.src = "assets/images/candidate.png";

const offerImg = new Image();
offerImg.src = "assets/images/offer.png";

// Game objects
let character = { x: 50, y: 300, width: 50, height: 50, speed: 5, dx: 0 };
let candidates = [];
let offers = [];
let score = 0;

// Controls
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") character.dx = character.speed;
  if (e.key === "ArrowLeft") character.dx = -character.speed;
  if (e.key === " ") {
    offers.push({ x: character.x + 30, y: character.y + 10, width: 20, height: 20 });
  }
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") character.dx = 0;
});

// Spawn candidates
function spawnCandidate() {
  candidates.push({ x: canvas.width, y: 300, width: 50, height: 50, speed: 2 });
}
setInterval(spawnCandidate, 2000);

// Update
function update() {
  character.x += character.dx;
  if (character.x < 0) character.x = 0;
  if (character.x + character.width > canvas.width) character.x = canvas.width - character.width;

  candidates.forEach((c) => (c.x -= c.speed));
  offers.forEach((o) => (o.x += 5));

  // Collision detection
  offers.forEach((o, oi) => {
    candidates.forEach((c, ci) => {
      if (
        o.x < c.x + c.width &&
        o.x + o.width > c.x &&
        o.y < c.y + c.height &&
        o.y + o.height > c.y
      ) {
        candidates.splice(ci, 1);
        offers.splice(oi, 1);
        score++;
      }
    });
  });
}

// Draw
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(characterImg, character.x, character.y, character.width, character.height);

  candidates.forEach((c) => ctx.drawImage(candidateImg, c.x, c.y, c.width, c.height));
  offers.forEach((o) => ctx.drawImage(offerImg, o.x, o.y, o.width, o.height));

  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 20);
}

// Game loop
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// ✅ Only start after images load
let loaded = 0;
[characterImg, candidateImg, offerImg].forEach((img) => {
  img.onload = () => {
    loaded++;
    if (loaded === 3) {
      loop();
    }
  };
});
