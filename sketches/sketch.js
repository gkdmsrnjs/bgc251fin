const { Responsive } = P5Template;

let engine, world;
let hourHand, minuteHand, secondHand;
let bigNumbers = [];
let circleBoundary = [];
let floor;
let mouseConstraint;

let dragging = false;
let revealCount = 0;
let textPool = [
  '< TODO LIST >',
  '1. 과제',
  '2. 과제',
  '3. 과제',
  '4. 과제',
  '5. 과제',
  'ㅠㅠ',
];

function setup() {
  new Responsive().createResponsiveCanvas(1440, 600, 'contain', true);
  textAlign(CENTER, CENTER);

  engine = Matter.Engine.create();
  world = engine.world;
  engine.gravity.y = 0.4;

  const centerX = width / 2 - 200;
  const centerY = height / 2 - 50;

  function createHand(length, thickness, color) {
    return Matter.Bodies.rectangle(centerX, centerY, length, thickness, {
      isStatic: true,
      render: { fillStyle: color },
      collisionFilter: { group: -1 },
    });
  }

  hourHand = createHand(120, 10, 'black');
  minuteHand = createHand(200, 6, 'black');
  secondHand = createHand(300, 2, 'red');
  Matter.World.add(world, [hourHand, minuteHand, secondHand]);

  const centerDot = Matter.Bodies.circle(centerX, centerY, 5, {
    isStatic: true,
    render: { fillStyle: 'red' },
  });
  Matter.World.add(world, centerDot);

  const wallCount = 120;
  const radius = 270;
  for (let i = 0; i < wallCount; i++) {
    let angle = (Math.PI * 2 * i) / wallCount;
    let x = centerX + radius * Math.cos(angle);
    let y = centerY + radius * Math.sin(angle);
    let wall = Matter.Bodies.rectangle(x, y, 15, 50, {
      isStatic: true,
      angle: angle,
      friction: 1,
      restitution: 0,
    });
    circleBoundary.push(wall);
  }
  Matter.World.add(world, circleBoundary);

  const numberRadius = 250;
  for (let i = 1; i <= 12; i++) {
    let angle = ((i - 3) * (Math.PI * 2)) / 12;
    let x = centerX + numberRadius * Math.cos(angle);
    let y = centerY + numberRadius * Math.sin(angle);
    let body = Matter.Bodies.circle(x, y, 35, {
      restitution: 0.8,
      frictionAir: 0.02,
      density: 0.001,
      friction: 0.05,
    });
    body.customLabel = i.toString();
    bigNumbers.push(body);
  }
  Matter.World.add(world, bigNumbers);

  floor = Matter.Bodies.rectangle(centerX, height + 100, width * 2, 200, {
    isStatic: true,
  });
  Matter.World.add(world, floor);

  const canvasElement = document.querySelector('canvas');
  const mouse = Matter.Mouse.create(canvasElement);
  mouse.pixelRatio = pixelDensity();

  mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.2,
      render: { visible: false },
    },
  });
  Matter.World.add(world, mouseConstraint);

  Matter.Runner.run(engine);
}

function draw() {
  background(255);
  drawMemo();

  textFont('Helvetica');
  fill(0);
  noStroke();
  textStyle(BOLD);
  textSize(120);
  bigNumbers.forEach((b) => {
    text(b.customLabel, b.position.x, b.position.y);
  });

  drawHand(hourHand, 120, 10, 'black');
  drawHand(minuteHand, 200, 6, 'black');
  drawHand(secondHand, 300, 2, 'red');

  updateClockHands();

  fill('black');
  noStroke();
  circle(width / 2 - 200, height / 2, 24);
  fill('red');
  circle(width / 2 - 200, height / 2, 16);

  Matter.Engine.update(engine);
}

function drawHand(hand, length, thickness, color) {
  const centerX = width / 2 - 200;
  const centerY = height / 2;
  const angle = hand.angle;

  push();
  translate(centerX, centerY);
  rotate(angle);
  fill(color);
  noStroke();
  rectMode(CORNER);

  if (color === 'red') {
    rect(-30, -thickness / 2, length, thickness, thickness / 2);
  } else {
    rect(0, -thickness / 2, length, thickness, thickness / 2);
  }

  pop();
}

function updateClockHands() {
  const now = new Date();
  const sec = now.getSeconds();
  const min = now.getMinutes();
  const hour = now.getHours() % 12;

  const secAngle = Math.PI * 2 * (sec / 60) - Math.PI / 2;
  const minAngle = Math.PI * 2 * (min / 60) - Math.PI / 2;
  const hourAngle = Math.PI * 2 * ((hour + min / 60) / 12) - Math.PI / 2;

  const centerX = width / 2 - 200;
  const centerY = height / 2;

  function setHandAngle(hand, angle) {
    Matter.Body.setAngle(hand, angle);
    Matter.Body.setPosition(hand, { x: centerX, y: centerY });
  }

  setHandAngle(secondHand, secAngle);
  setHandAngle(minuteHand, minAngle);
  setHandAngle(hourHand, hourAngle);
}

function drawMemo() {
  let memoX = width - 400;
  let memoY = 80;
  let memoW = 300;
  let memoH = 400;

  noStroke();
  fill(0, 30);
  rect(memoX + 10, memoY + 10, memoW, memoH, 10);

  fill(255, 250, 220);
  stroke(200, 180, 150);
  strokeWeight(2);
  rect(memoX, memoY, memoW, memoH, 10);

  fill(200, 50, 50);
  textSize(16);
  textAlign(CENTER, TOP);
  textFont('gothic');
  text('※ 절대 클릭하지 말 것', memoX + memoW / 2, memoY + 14);

  if (dragging) {
    let lineHeight = 35;
    let extraGap = 12;
    let currentY = memoY + 80;

    textAlign(CENTER, TOP);
    noStroke();
    textStyle(BOLD);
    textFont('Gungsuh');
    for (let i = 0; i < revealCount; i++) {
      if (i >= textPool.length) break;

      fill(50);
      if (i === 0) {
        textSize(24);
        text(textPool[i], memoX + 150, currentY);
        currentY += lineHeight + extraGap;
      } else {
        textSize(22);
        text(textPool[i], memoX + 150, currentY);
        currentY += lineHeight;
      }
    }
  }
}

function mousePressed() {
  let memoX = width - 400;
  let memoY = 80;
  let memoW = 300;
  let memoH = 400;

  if (
    mouseX >= memoX &&
    mouseX <= memoX + memoW &&
    mouseY >= memoY &&
    mouseY <= memoY + memoH
  ) {
    dragging = true;
    revealCount = textPool.length;
  }
}

function mouseReleased() {
  dragging = false;
  revealCount = 0;
}
let clickedOnMemo = false;

function draw() {
  // 기존 draw 유지
  originalDraw();

  drawMousePointer();
}

// 기존 draw 함수 백업 → 실제 내용 복사 없이 래핑
function originalDraw() {
  background(255);
  drawMemo();

  textFont('Helvetica');
  fill(0);
  noStroke();
  textStyle(BOLD);
  textSize(120);
  bigNumbers.forEach((b) => {
    text(b.customLabel, b.position.x, b.position.y);
  });

  drawHand(hourHand, 120, 10, 'black');
  drawHand(minuteHand, 200, 6, 'black');
  drawHand(secondHand, 300, 2, color(200, 50, 50));
  updateClockHands();

  fill('black');
  noStroke();
  circle(width / 2 - 200, height / 2, 24);
  fill(200, 50, 50);
  circle(width / 2 - 200, height / 2, 16);

  Matter.Engine.update(engine);
}

function drawMousePointer() {
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(20);
  noCursor(); // 시스템 커서 숨김

  if (clickedOnMemo) {
    textSize(50);
    text('😢', mouseX, mouseY);
  } else {
    fill(200, 50, 50);
    circle(mouseX, mouseY, 30);
  }
}

function mousePressed() {
  let memoX = width - 400;
  let memoY = 80;
  let memoW = 300;
  let memoH = 400;

  if (
    mouseX >= memoX &&
    mouseX <= memoX + memoW &&
    mouseY >= memoY &&
    mouseY <= memoY + memoH
  ) {
    dragging = true;
    revealCount = textPool.length;
    clickedOnMemo = true; // 슬픈 이모티콘 상태
  }
}

function mouseReleased() {
  dragging = false;
  revealCount = 0;
  clickedOnMemo = false; // 다시 원형 포인터로
}
