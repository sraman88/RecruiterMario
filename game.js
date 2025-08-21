const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Character setup
let charX = 100, charY = 350;
let charWidth = 50, charHeight = 50;
let velocityY = 0, gravity = 1;
let isJumping = false;

const character = new Image();
character.src = "assets/character.png";

// Candidate setup
let candidateX = 800, candidateY = 350;
const candidate = new Image();
candidate.src = "assets/candidate.png";

// Offers (projectiles)
let offers = [];
const offerImg = new Image();
offerImg.src = "assets/offer.png";

// Keys
let keys = {};

// Listen to keys
document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "Space") {
    shootOffer();
  }
});
document.addEventListener("keyup", (e) => keys[e.code] = false);

// Shoot function
function shootOffer() {
  offers.push({ x: charX + 40, y: charY + 20, width: 20, height: 20 });
}

// Game loop
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Recruiter movement
  if (keys["ArrowRight"] && charX < canvas.width - charWidth) charX += 5;
  if (keys["ArrowLeft"] && charX > 0) charX -= 5;

  // Jump
  if (keys["ArrowUp"] && !isJumping) {
    velocityY = -15;
    isJumping = true;
  }

  charY += velocityY;
  velocityY += gravity;

  if (charY >= 350) {
    charY = 350;
    isJumping = false;
  }

  ctx.drawImage(character, charX, charY, charWidth, charHeight);

  // Candidate movement
  candidateX -= 2;
  if (candidateX < -50) candidateX = canvas.width;
  ctx.drawImage(candidate, candidateX, candidateY, 50, 50);

  // Offers
  for (let i = 0; i < offers.length; i++) {
    let offer = offers[i];
    offer.x += 7;
    ctx.drawImage(offerImg, offer.x, offer.y, offer.width, offer.height);

    // Collision detection
    if (
      offer.x < candidateX + 50 &&
      offer.x + offer.width > candidateX &&
      offer.y < candidateY + 50 &&
      offer.y + offer.height > candidateY
    ) {
      candidateX = canvas.width; // reset candidate
      offers.splice(i, 1); // remove offer
    }
  }

  requestAnimationFrame(update);
}

update();

