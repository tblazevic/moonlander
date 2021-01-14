window.onload = function() {
	init();
    animate();

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    document.addEventListener('visibilitychange', onLoseFocus);
}

function onLoseFocus() {
    if(document.hidden) {
        lastTime = -1;
        accelerating = false;
        rotatingLeft = false;
        rotatingRight = false;
        rocketSound.stop();
    }
}

function init() {
    initTHREE();

    initColliders();
    loadTerrain();
    createBorders();
    createStars();
    initSound();
    initHud();
    initParticles();

    playComms();
}

function initTHREE() {
    scene = new THREE.Scene();

    camera = new THREE.OrthographicCamera(
        -halfWidth, 
        halfWidth, 
        halfHeight, 
        -halfHeight, 
        0.1, 
        1000 );
    scene.add(camera);
    cameraPositionReset();

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    document.body.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(landerScale, landerScale);
    const texture = new THREE.TextureLoader().load('textures/lander.png');
    const material = new THREE.MeshBasicMaterial({map: texture});
    material.transparent = true;
    lander = new THREE.Mesh(geometry, material);
    scene.add(lander);
    lander.visible = false;
}

function initColliders() {
    colliders = new THREE.Group();

    const mainGeometry = new THREE.SphereGeometry(mainScale);
    const smallGeometry = new THREE.SphereGeometry(smallScale);

    const material = new THREE.MeshBasicMaterial({color: 0xffffff});

    let mainCollider = new THREE.Mesh(mainGeometry, material);
    let leftCollider = new THREE.Mesh(smallGeometry, material);
    let rightCollider = new THREE.Mesh(smallGeometry, material);

    colliders.add(mainCollider);
    colliders.add(leftCollider);
    colliders.add(rightCollider);

    const verticalOffset = -mainScale + smallScale;
    leftCollider.position.y = verticalOffset;
    rightCollider.position.y = verticalOffset;

    const horizontalOffset = mainScale - smallScale;
    leftCollider.position.x = -horizontalOffset;
    rightCollider.position.x = horizontalOffset;

    lander.add(colliders);
    colliders.visible = false;
}

function createBorders() {
    let borders = new THREE.Group();
    scene.add(borders);

    const verticalGeometry = new THREE.PlaneGeometry(lineWidth, gameHeight);
    const horizontalGeometry = new THREE.PlaneGeometry(gameWidth, lineWidth);
    const material = new THREE.MeshBasicMaterial({color: 0xffffff});
    let leftBorder = new THREE.Mesh(verticalGeometry, material);
    let rightBorder = new THREE.Mesh(verticalGeometry, material);
    let topBorder = new THREE.Mesh(horizontalGeometry, material);
    let botBorder = new THREE.Mesh(horizontalGeometry, material);
    borders.add(leftBorder);
    borders.add(rightBorder);
    borders.add(topBorder);
    borders.add(botBorder);

    let verticalOffset = halfWidth + lineWidth/2;
    let horizontalOffset = halfHeight + lineWidth/2;
    leftBorder.position.x = -verticalOffset;
    rightBorder.position.x = verticalOffset;
    topBorder.position.y = horizontalOffset;
    botBorder.position.y = -horizontalOffset;
}

function loadTerrain() {
    cubeColliders = new THREE.Group();
    scene.add(cubeColliders);

    let i;
    for(i=0; i<points.length-1; i++) {
        placeCube(points[i], points[i+1]);
        heightDifferences.push(Math.abs(points[i][1]-points[i+1][1]));
    }
}

function placeCube(leftPoint, rightPoint) {
    let leftVector = new THREE.Vector2(leftPoint[0] - halfWidth, leftPoint[1] - halfHeight);
    let rightVector = new THREE.Vector2(rightPoint[0] - halfWidth, rightPoint[1] - halfHeight);

    lineSegments.push([leftVector.clone(), rightVector.clone()]);

    let center = leftVector.add(rightVector).divideScalar(2);
    let distance = leftVector.distanceTo(rightVector);

    const geometry = new THREE.PlaneGeometry(distance*2 + lineWidth/2, lineWidth);
    const material = new THREE.MeshBasicMaterial({color: 0xffffff});
    let cube = new THREE.Mesh(geometry, material);
    cube.position.x = center.x;
    cube.position.y = center.y;

    let direction = rightVector.sub(leftVector);
    let angle = direction.angle();

    cube.rotation.z = angle;

    cubeColliders.add(cube);
}

function createStars() {
    let stars = new THREE.Group();
    scene.add(stars);

    let i,j;
    for(i = 0; i < numOfStars; i++) {
        let randomX, randomY;
        randomX = (Math.random() - 0.5) * gameWidth;
        randomY = (Math.random() - 0.5) * gameHeight;

        const geometry = new THREE.PlaneGeometry(landerScale/10, landerScale/5);
        const material = new THREE.MeshBasicMaterial({color: 0xffffff});
        let mesh = new THREE.Mesh(geometry, material);
        stars.add(mesh);

        mesh.position.x = randomX;
        mesh.position.y = randomY;
        mesh.position.z = -5;

        for(j = 0; j < lineSegments.length; j++) {
            let leftVector = lineSegments[j][0];
            let rightVector = lineSegments[j][1];

            if(randomX > leftVector.x && randomX < rightVector.x) {
                if(randomY < Math.max(leftVector.y, rightVector.y)) {
                    mesh.visible = false;
                }
                break;
            }
        }
    }
}

function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);

    initHud();
}

function animate() {
    requestAnimationFrame(animate);

    if (lastTime == -1) lastTime = performance.now();
    let t1 = performance.now();

    deltaTime = (t1-lastTime)/1000;
    lastTime = t1;

    update();
    render();
}

function render() {
    renderer.render(scene, camera);
    renderHud();
}

function update() {
    if(isGameOver || isBetweenRounds) {
        updateParticles();
        rocketSound.stop();
        return;
    }
    if(isPaused) {
        rocketSound.stop();
        return;
    }

    updateTimer();
    handleMovement();
    checkCollision();
    checkZoom();
    updateParticles();
}

function updateTimer() {
    currentTime += deltaTime;
}

function handleMovement() {
    let rotationDelta = 0;
    
    if(rotatingLeft) rotationDelta += angularVelocity * deltaTime;
    if(rotatingRight) rotationDelta += -angularVelocity * deltaTime;

    lander.rotation.z += rotationDelta;

    if(lander.rotation.z > Math.PI / 2) lander.rotation.z = Math.PI / 2;
    if(lander.rotation.z < -Math.PI / 2) lander.rotation.z = -Math.PI / 2;

    let velocityDeltaY = 0;
    let velocityDeltaX = 0;

    velocityDeltaY += -gravity * deltaTime;

    if(accelerating && currentFuel > 0) {
        rocketSound.play();

        currentAcceleration += thrusterJerk * deltaTime;
        if(currentAcceleration > thrusterAccelerationMax) currentAcceleration = thrusterAccelerationMax;

        currentAccelerationRatio = currentAcceleration / thrusterAccelerationMax;
        let fuelBurned = currentAccelerationRatio * (fuelConsumptionRateMax - fuelConsumptionRateMin) + fuelConsumptionRateMin;
        currentFuel -= fuelBurned * deltaTime;
        fuelCheck();
        fuelAlertCheck();
    }
    else {
        rocketSound.stop();

        currentAcceleration -= thrusterJerk * deltaTime * accelerationFalloffMultiplier;
        if(currentAcceleration < 0) currentAcceleration = 0;
    }

    let forward = new THREE.Vector2(0,1);
    forward.rotateAround(new THREE.Vector2(0,0), lander.rotation.z);
    landerBackDirection = forward.clone().negate();

    velocityDeltaX += -velocityX * horizontalDragCoef * deltaTime;

    velocityDeltaX += forward.x * currentAcceleration * deltaTime;
    velocityDeltaY += forward.y * currentAcceleration * deltaTime;

    velocityY += velocityDeltaY;
    velocityX += velocityDeltaX;
    
    let positionDeltaY = velocityY * deltaTime
    lander.position.y += positionDeltaY;

    let positionDeltaX = velocityX * deltaTime;
    lander.position.x += positionDeltaX;
}

function checkCollision() {
    borderCheck();
    terrainCheck();
}

function borderCheck() {
    if(lander.position.x < -halfWidth - lineWidth || lander.position.x > halfWidth + lineWidth || lander.position.y < -halfHeight - lineWidth || lander.position.y > halfHeight + lineWidth){
        crashInfo = "OUT OF BOUNDS";
        crashed();
    }
}

function terrainCheck() {
    let i,j;
    let spheres = colliders.children;
    for(i = 0; i < spheres.length; i++) {
        let worldPosition = new THREE.Vector3();
        spheres[i].getWorldPosition(worldPosition);

        for(j = 0; j < lineSegments.length; j++) {
            let leftVector = lineSegments[j][0];
            let rightVector = lineSegments[j][1];

            if(i == 0 && worldPosition.x > leftVector.x && worldPosition.x < rightVector.x){
                const k = (rightVector.y-leftVector.y)/(rightVector.x-leftVector.x);
                const terrainHeight = leftVector.y + k * (worldPosition.x - leftVector.x);
                altitude = worldPosition.y - mainScale - smallScale - terrainHeight;
                altitude = Math.max(0, altitude);
            }

            let dot = ((worldPosition.x-leftVector.x)*(rightVector.x-leftVector.x) + (worldPosition.y-leftVector.y)*(rightVector.y-leftVector.y)) / leftVector.distanceToSquared(rightVector);
            let closestX, closestY, distanceX, distanceY, distanceSquared;

            closestX = leftVector.x + (dot * (rightVector.x - leftVector.x));
            closestY = leftVector.y + (dot * (rightVector.y - leftVector.y));

            if(closestX < leftVector.x || closestX > rightVector.x || closestY > Math.max(leftVector.y, rightVector.y) || closestY < Math.min(leftVector.y, rightVector.y)) continue;

            distanceX = closestX - worldPosition.x;
            distanceY = closestY - worldPosition.y;
            distanceSquared = distanceX*distanceX + distanceY*distanceY;

            let radius=mainScale;
            if(i>0) radius=smallScale;

            let hitDistance = radius + lineWidth;        

            if(distanceSquared <= hitDistance*hitDistance) {
                hasLanded = true;
                if(Math.min(lander.position.x - leftVector.x, rightVector.x - lander.position.x) < (landerScale*0.38)) {
                    crashInfo = "TOO CLOSE TO EDGE OF TERRAIN";
                    hasLanded = false;
                }
                if(heightDifferences[j] > 0.0001 ) {
                    crashInfo = "CRASHED ON UNEVEN TERRAIN";
                    hasLanded = false;
                }
                if(Math.abs(lander.rotation.z) > landingAngleTolerance) {
                    crashInfo = "LANDING ANGLE WAS TOO HIGH";
                    hasLanded = false;
                }
                if(velocityX*velocityX + velocityY*velocityY > landingVelocityTolerance*landingVelocityTolerance) {
                    crashInfo = "LANDING VELOCITY WAS TOO HIGH";
                    hasLanded = false;
                }
                
                if(hasLanded) {
                    landed(j);
                }
                else {
                    crashed();
                }
                return;
            }
        }
    }
}

function fuelCheck() {
    if(currentFuel < 0.0001) {
        currentFuel = 0;
        hasFuel = false;
    }
    else {
        hasFuel = true;
    }
}

function landed(segmentIndex) {
    let mul = scoreMultipliers[segmentIndex];
    scoreChange = scorePerLanding * mul
    currentScore += scoreChange;

    fuelChange = Math.random() * (fuelGainMax - fuelGainMin) + fuelGainMin;
    fuelChange += fuelGainExtra * mul;

    let fuelCap = startingFuel - currentFuel;
    fuelChange = Math.min(fuelChange, fuelCap);
    currentFuel += fuelChange;

    nextRound();
}

function crashed() {
    crashSound.play();
    explosionPS.emit();
    
    fuelChange = Math.random() * (fuelPenaltyMax - fuelPenaltyMin) + fuelPenaltyMin;
    fuelChange = Math.min(fuelChange, currentFuel);
    currentFuel -= fuelChange;

    scoreChange = 0;

    nextRound();
}

function endGame() {
    isGameOver = true;
    isPaused = true;
    lander.visible = false;
}

function nextRound() {
    isBetweenRounds = true;
    lander.visible = hasLanded;

    fuelCheck();
    fuelAlertCheck();    

    setTimeout(continueRound, betweenRoundPause * 1000);
}

function continueRound() {
    isBetweenRounds = false;
    lander.visible = true;

    if(!hasFuel) {
        endGame();
        return;
    }

    respawn();
}

function resetGame() {
    currentFuel = startingFuel;
    hasFuel = true;
    lander.visible = true;
    isAlerted = false;

    currentScore = 0;
    currentTime = 0;

    respawn();
}

function respawn() {
    velocityX = 0;
    velocityY = 0;
    currentAcceleration = 0;

    rotatingLeft = false;
    rotatingRight = false;
    accelerating = false;

    isGameOver = false;
    isPaused = false;

    randomSpawn();
    randomizeScoreMultipliers();
}

function randomSpawn() {
    let randomPositionX;
    let randomPositionY;

    let minX = -halfWidth + horizontalSpawnOffset;
    let maxX = halfWidth - horizontalSpawnOffset;

    if(Math.random() > 0.5) {
        minX = -halfWidth + horizontalSpawnOffset;
        maxX = -middleSpawnOffset;
    }
    else{
        minX = middleSpawnOffset;
        maxX = halfWidth - horizontalSpawnOffset;
    }

    randomPositionX = Math.random() * (maxX - minX) + minX;

    const minY = verticalMiddleSpawnOffset;
    const maxY = halfHeight - verticalTopSpawnOffset;

    randomPositionY = Math.random() * (maxY - minY) + minY;

    let randomRotation;

    randomRotation = (Math.random() - 0.5) * Math.PI; 

    let initialVelocity = Math.random() * (velocityXSpawnMax - velocityXSpawnMin) + velocityXSpawnMin;
    if(randomPositionX > 0) {
        initialVelocity = -initialVelocity;
    }

    lander.position.x = randomPositionX;
    lander.position.y = randomPositionY;
    lander.rotation.z = randomRotation;
    velocityX = initialVelocity;
}

function randomizeScoreMultipliers() {
    let i,j;
    for(i=0; i < heightDifferences.length; i++) {
        if(heightDifferences[i] > 0.0001) {
            scoreMultipliers[i] = 0;
            continue;
        }

        let p = Math.random();
        let cumulative = 0;
        for(j = 0; j < scoreMultiplierChances.length; j++) {
            cumulative += scoreMultiplierChances[j];
            if(p < cumulative) {
                scoreMultipliers[i] = j+1;
                break;
            }
        }
    }
}

function onKeyDown(event) {
    if(isGameOver && isPaused) {
        resetGame();
    }

    if(event.key=="ArrowUp"){
        accelerating = true;
    }
    if(event.key=="ArrowLeft"){
        rotatingLeft = true;
    }
    if(event.key=="ArrowRight"){
        rotatingRight = true;
    }

    if(event.key=="p"){
        if(!isGameOver) isPaused = !isPaused;
    }

    if(event.key=="d"){
        toggleDebug();
    }
}

function onKeyUp(event) {
    if(event.key=="ArrowUp"){
        accelerating = false;
    }
    if(event.key=="ArrowLeft"){
        rotatingLeft = false;
    }
    if(event.key=="ArrowRight"){
        rotatingRight = false;
    }
}

function toggleDebug() {
    isDebugOn = !isDebugOn;
    colliders.visible = isDebugOn;
}

function cameraPositionReset() {
    camera.position.set(cameraPositionDefault.x, cameraPositionDefault.y, cameraPositionDefault.z);
}

function checkZoom() {
    if(altitude <= cameraZoomAltitude || (isZoomed && altitude <= cameraZoomOutAltitude)) {
        zoomIn();
    }
    else if(isZoomed && altitude >= cameraZoomOutAltitude) {
        zoomOut();
    }
}

function zoomIn() {
    isZoomed = true;
    camera.position.set(lander.position.x, lander.position.y - altitude/2, cameraPositionDefault.z);
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
}

function zoomOut() {
    if(!isZoomed) return;

    isZoomed = false;
    cameraPositionReset();
    camera.zoom = 1;
    camera.updateProjectionMatrix();
}

function initParticles() {
    thrusterParticleEmitPoint = new THREE.Group();
    lander.add(thrusterParticleEmitPoint);
    thrusterParticleEmitPoint.position.copy(particleEmitPointOffset);
    thrusterPS = new ParticleSystemCone(
        scene, 
        thrusterParticleEmitPoint,
        coneMaxParticles, 
        conePSPerSecondMin, 
        conePSPerSecondMax, 
        conePSLifetimeMin, 
        conePSLifetimeMax, 
        gravity, 
        conePSDragCoefMin, 
        conePSDragCoefMax, 
        landerBackDirection, 
        conePSStartingWidth, 
        conePSAngle, 
        conePSSize,
        conePSMinVelocityMagnitude,
        conePSMaxVelocityMagnitude,
        conePSStartOpacity,
        conePSEndOpacity,
        conePSStartColor,
        conePSEndColor,
        conePSStartScale,
        conePSEndScale
    );
    explosionPS = new ParticleSystemExplosion(
        scene,
        lander,
        explosionPSParticlesMax,
        explosionPSLifetimeMin,
        explosionPSLifetimeMax,
        gravity,
        explosionPSDragCoefMin,
        explosionPSDragCoefMax,
        explosionPSSize,
        explosionPSMinVelocityMagnitude,
        explosionPSMaxVelocityMagnitude,
        explosionPSOpacityStart,
        explosionPSOpacityEnd,
        explosionPSColorStart,
        explosionPSColorEnd,
        explosionPSScaleStart,
        explosionPSScaleEnd
    );
}

function updateParticles() {
    thrusterPS.emitting = (accelerating && hasFuel && !isBetweenRounds);
    thrusterPS.initialVelocityX = velocityX;
    thrusterPS.initialVelocityY = velocityY;
    thrusterPS.direction = landerBackDirection;
    thrusterPS.update(deltaTime);

    explosionPS.initialVelocityX = velocityX;
    explosionPS.initialVelocityY = velocityY;
    explosionPS.update(deltaTime);
}