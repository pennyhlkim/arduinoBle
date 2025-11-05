// 소문자 (아두이노와 동일하게 입력)
const SERVICE_UUID = "19b10000-e8f2-537e-4f6c-d104768a1214"; 
const WRITE_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214"; 
let writeChar, statusP, connectBtn, send1Btn, send2Btn, send3Btn;
let circleColor = 'gray'; // 원의 색상 (기본값)

// 가속도 센서 관련 변수
let accelBtn, accelStatusP, accelTextP;
let accelX = 0, accelY = 0, accelZ = 0;
let isAccelActive = false;
let ballX, ballY; // 원의 위치
let ballVx = 0, ballVy = 0; // 원의 속도

function setup() {
  createCanvas(windowWidth, windowHeight);

  // BLE 연결
  connectBtn = createButton("Scan & Connect");
  connectBtn.mousePressed(connectAny);
  connectBtn.size(120, 30);
  connectBtn.position(20, 40);

  statusP = createP("Status: Not connected");
  statusP.position(22, 60);

  // 숫자 전송 버튼들
  send1Btn = createButton("send 1");
  send1Btn.mousePressed(() => {
    circleColor = 'red';
    sendNumber(1);
  });
  send1Btn.size(100, 30);
  send1Btn.position(20, 100);

  send2Btn = createButton("send 2");
  send2Btn.mousePressed(() => {
    circleColor = 'green';
    sendNumber(2);
  });
  send2Btn.size(100, 30);
  send2Btn.position(20, 140);

  send3Btn = createButton("send 3");
  send3Btn.mousePressed(() => {
    circleColor = 'blue';
    sendNumber(3);
  });
  send3Btn.size(100, 30);
  send3Btn.position(20, 180);

  // 가속도 센서 버튼
  accelBtn = createButton("Enable Accelerometer");
  accelBtn.mousePressed(requestAccelerometer);
  accelBtn.size(150, 30);
  accelBtn.position(20, 220);

  accelStatusP = createP("Accelerometer: Not enabled");
  accelStatusP.position(22, 250);

  accelTextP = createP("Accel: X: 0.00, Y: 0.00, Z: 0.00");
  accelTextP.position(22, 270);

  // 원의 초기 위치 (캔버스 중앙)
  ballX = width / 2;
  ballY = height / 2;
}

function draw() {
  background(240);
  
  // 중앙에 크기 200인 원 그리기 (기존 기능)
  fill(circleColor);
  noStroke();
  circle(width / 2, height / 2, 200);

  // 가속도 센서로 움직이는 작은 원
  if (isAccelActive) {
    // 가속도 값에 따라 원의 속도 업데이트
    // 가속도를 속도에 더함 (물리 시뮬레이션)
    // Y축 반전 (화면 좌표계와 센서 좌표계 차이)
    ballVx += accelX * 0.5;
    ballVy += -accelY * 0.5; // Y축 반전
    
    // 마찰 효과 (속도 감소)
    ballVx *= 0.98;
    ballVy *= 0.98;
    
    // 위치 업데이트
    ballX += ballVx;
    ballY += ballVy;
    
    // 캔버스 경계 체크 (튕기기)
    if (ballX < 10) {
      ballX = 10;
      ballVx *= -0.8;
    }
    if (ballX > width - 10) {
      ballX = width - 10;
      ballVx *= -0.8;
    }
    if (ballY < 10) {
      ballY = 10;
      ballVy *= -0.8;
    }
    if (ballY > height - 10) {
      ballY = height - 10;
      ballVy *= -0.8;
    }
    
    // 지름 20인 파란색 원 그리기
    fill('blue');
    noStroke();
    circle(ballX, ballY, 20);
  } else {
    // 가속도 센서가 활성화되지 않았을 때 중앙에 고정
    ballX = width / 2;
    ballY = height / 2;
    ballVx = 0;
    ballVy = 0;
    
    fill('blue');
    noStroke();
    circle(ballX, ballY, 20);
  }
}

// ---- BLE Connect ----
async function connectAny() {
  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [SERVICE_UUID],
    });
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    writeChar = await service.getCharacteristic(WRITE_UUID);
    statusP.html("Status: Connected to " + (device.name || "device"));
  } catch (e) {
    statusP.html("Status: Error - " + e);
    console.error(e);
  }
}

// ---- Write 1 byte to BLE ----
async function sendNumber(n) {
  if (!writeChar) {
    statusP.html("Status: Not connected");
    return;
  }
  try {
    await writeChar.writeValue(new Uint8Array([n & 0xff]));
    statusP.html("Status: Sent " + n);
  } catch (e) {
    statusP.html("Status: Write error - " + e);
  }
}

// ---- 가속도 센서 활성화/비활성화 토글 ----
function requestAccelerometer() {
  if (isAccelActive) {
    // 비활성화
    window.removeEventListener('devicemotion', handleMotion);
    isAccelActive = false;
    accelStatusP.html("Accelerometer: Disabled");
    accelBtn.html("Enable Accelerometer");
    accelX = 0;
    accelY = 0;
    accelZ = 0;
    accelTextP.html("Accel: X: 0.00, Y: 0.00, Z: 0.00");
    return;
  }

  // 활성화
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    // iOS 13+ 권한 요청
    DeviceMotionEvent.requestPermission()
      .then(response => {
        if (response == 'granted') {
          window.addEventListener('devicemotion', handleMotion);
          isAccelActive = true;
          accelStatusP.html("Accelerometer: Enabled");
          accelBtn.html("Disable Accelerometer");
        } else {
          accelStatusP.html("Accelerometer: Permission denied");
        }
      })
      .catch(console.error);
  } else {
    // iOS 12 이하 또는 다른 브라우저
    window.addEventListener('devicemotion', handleMotion);
    isAccelActive = true;
    accelStatusP.html("Accelerometer: Enabled");
    accelBtn.html("Disable Accelerometer");
  }
}

// ---- 가속도 센서 값 처리 ----
function handleMotion(event) {
  if (event.accelerationIncludingGravity) {
    // 가속도 값 (중력 포함)
    accelX = event.accelerationIncludingGravity.x || 0;
    accelY = event.accelerationIncludingGravity.y || 0;
    accelZ = event.accelerationIncludingGravity.z || 0;
    
    // 가속도 값을 텍스트로 출력
    accelTextP.html(`Accel: X: ${accelX.toFixed(2)}, Y: ${accelY.toFixed(2)}, Z: ${accelZ.toFixed(2)}`);
    
    // 중력 보정 (선택적 - 더 부드러운 움직임을 위해)
    // accelX -= 0; // X축 중력 보정 (필요시)
    // accelY -= 9.8; // Y축 중력 보정 (필요시)
  }
}

// ---- 창 크기 변경 시 원 위치 재조정 ----
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (!isAccelActive) {
    ballX = width / 2;
    ballY = height / 2;
  }
}
