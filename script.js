const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let recruiter = { x: 50, y: 300, width: 40, height: 40, dy: 0, jumping: false };
let gravity = 0.5;
let cvs = [{ x: 400, y: 300, width: 20, height: 20 }];
let dropouts = [{ x: 700, y: 320, width: 40, height: 40 }];
let score = 0;

function drawRecruiter() {
  ctx.fillStyle = "blue";
  ctx.fillRect(recruiter.x, recruiter.y, recruiter.width, recruiter.height);
}

function drawCVs() {
  ctx.fillStyle = "gold";
  cvs.forEach(cv => ctx.fillRect(cv.x, cv.y, cv.width, cv.height));
}

function drawDropouts() {
  ctx.fillStyle = "red";
  dropouts.forEach(d => ctx.fillRect(d.x, d.y, d.width, d.height));
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  recruiter.y += recruiter.dy;
  if (recruiter.y + recruiter.height < 340) recruiter.dy += gravity;
  else {
    recruiter.y = 300;
    recruiter.jumping = false;
  }

  cvs.forEach((cv, i) => {
    cv.x -= 3;
    if (collision(recruiter, cv)) {
      cvs.splice(i, 1);
      score++;
    }
  });

  dropouts.forEach((d, i) => {
    d.x -= 3;
    if (collision(recruiter, d)) {
      alert("Game Over! Score: " + score);
      document.location.reload();
    }
  });

  drawRecruiter();
  drawCVs();
  drawDropouts();

  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 20);

  requestAnimationFrame(update);
}

function collision(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

document.addEventListener("keydown", e => {
  if (e.code === "Space" && !recruiter.jumping) {
    recruiter.dy = -10;
    recruiter.jumping = true;
  }
});

update();
