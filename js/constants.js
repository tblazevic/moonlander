const gameWidth = 800;
const gameHeight = 450;
const halfWidth = gameWidth/2;
const halfHeight = gameHeight/2;
const lineWidth = 0.5;

const zoom = 4;
const cameraZoomAltitude = 100;
const cameraZoomOutAltitude = 110;
const cameraPositionDefault = new THREE.Vector3(0, 0, 5);

const verticalTopSpawnOffset = 50;
const verticalMiddleSpawnOffset = 170;
const horizontalSpawnOffset = 80;
const middleSpawnOffset = 120;
const velocityXSpawnMin = 30;
const velocityXSpawnMax = 50;

const landerScale = 8;
const gravity = 1.62;
const thrusterAccelerationMax = 4;
const thrusterJerk = 4;
const accelerationFalloffMultiplier = 2;
const angularVelocity = 90 * (Math.PI / 180);
const horizontalDragCoef = 0.04;

const mainScale = landerScale/2;
const smallScale = landerScale/8;

const startingFuel = 1000;
const fuelConsumptionRateMin = 4;
const fuelConsumptionRateMax = 14;
const fuelPenaltyMin = 300;
const fuelPenaltyMax = 350;
const fuelGainMin = 50;
const fuelGainMax = 50;
const fuelGainExtra = 10;
const fuelAlertThreshold = fuelPenaltyMin;

const landingAngleTolerance = 6.7 * (Math.PI / 180);
const landingVelocityTolerance = 5.0;

const numOfStars = 100;

const betweenRoundPause = 5.1;

const alertInterval = 4;
const commsIntervalMin = 20;
const commsIntervalMax = 40;

const scorePerLanding = 100;
const scoreMultiplierChances = [0.4, 0.2, 0.15, 0.15, 0.1];

const infoPanelFontSize = 20;
const mainPanelFontSize = 30;
const statsPanelFontSize = 30;

const infoPanelTextColor = "rgba(255,255,255,1)";
const mainPanelTextColor = "rgba(255,255,255,1)";
const statsPanelTextColor = "rgba(255,255,255,1)";

const infoPanelRelativeOffsetX = 0.03;
const infoPanelRelativeOffsetY = 0.07;
const infoPanelRelativeOffsetYStep = 0.03;

const mainPanelRelativeOffsetX = 0.5;
const mainPanelRelativeOffsetY = 0.35;
const mainPanelRelativeOffsetYStep = 0.05;

const statsPanelRelativeOffsetX = 0.5;
const statsPanelRelativeOffsetY = 0.30;
const statsPanelRelativeOffsetYStep = 0.05;

const multiplierFontSize = 15;
const multiplierFontColor = "rgba(255,255,255,1)";

const particleEmitPointOffset = new THREE.Vector3(0, -landerScale/2.5, 3);

const coneMaxParticles = 1100;
const conePSPerSecondMin = 250;
const conePSPerSecondMax = 350;
const conePSLifetimeMin = 0.3;
const conePSLifetimeMax = 0.8;
const conePSDragCoefMin = 0.10;
const conePSDragCoefMax = 0.20;
const conePSStartingWidth = landerScale/6;
const conePSAngle = 10 * (Math.PI / 180);
const conePSSize = landerScale/4;
const conePSMinVelocityMagnitude = 20;
const conePSMaxVelocityMagnitude = 55;
const conePSStartOpacity = 0.8;
const conePSEndOpacity = 0.0;
const conePSStartColor = new THREE.Color("rgb(255,255,128)");
const conePSEndColor = new THREE.Color("rgb(255,0,0)");
const conePSStartScale = 0.4;
const conePSEndScale = 1;

const explosionPSParticlesMax = 350;
const explosionPSLifetimeMin = 0.8;
const explosionPSLifetimeMax = 5;
const explosionPSDragCoefMin = 0.6;
const explosionPSDragCoefMax = 0.8;
const explosionPSSize = 1;
const explosionPSMinVelocityMagnitude = 0.0;
const explosionPSMaxVelocityMagnitude = 50;
const explosionPSOpacityStart = 0.8;
const explosionPSOpacityEnd = 0.3;
const explosionPSColorStart = new THREE.Color("rgb(240,160,20)");
const explosionPSColorEnd = new THREE.Color("rgb(200,40,0)");
const explosionPSScaleStart = 2;
const explosionPSScaleEnd = 0.8;