let scene, camera, renderer;

let sceneHud, cameraHud;
let hudCanvas, hudContext, hudTexture;

let hudWidth, hudHeight;

let lander;
let colliders;

let deltaTime = 0;
let lastTime = -1;

let isZoomed = false;

let velocityX = 0;
let velocityY = 0;
let currentAcceleration = 0;
let currentAccelerationRatio = 0;
let altitude = 0;

let rotatingLeft = false;
let rotatingRight = false;
let accelerating = false;

let isPaused = true;
let isGameOver = true;
let isBetweenRounds = false;
let isDebugOn = false;
let hasLanded = false;

let currentFuel = 1000;
let hasFuel = true;

let cubeColliders;
let heightDifferences = [];
let lineSegments = [];

let crashSound, lowFuelSound, rocketSound, commSound;
let isAlerted = false;

let currentScore = 0;
let currentTime = 0;

let scoreMultipliers = [];

let thrusterParticleEmitPoint;
let thrusterPS, explosionPS;
let landerBackDirection;

let fuelChange, scoreChange;
let crashInfo;