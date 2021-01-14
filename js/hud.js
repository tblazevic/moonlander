function initHud() {
    hudWidth = window.innerWidth;
    hudHeight = window.innerHeight;

    cameraHud = new THREE.OrthographicCamera(
        -halfWidth, 
        halfWidth, 
        halfHeight, 
        -halfHeight, 
        0, 
        1000 );
    sceneHud = new THREE.Scene();
    hudCanvas = document.createElement('canvas');
    hudContext = hudCanvas.getContext('2d');
    hudCanvas.width = hudWidth;
    hudCanvas.height = hudHeight;

    hudTexture = new THREE.Texture(hudCanvas);
    const hudMaterial = new THREE.MeshBasicMaterial( {map: hudTexture} );
    hudMaterial.transparent = true;

    const planeGeometry = new THREE.PlaneGeometry(gameWidth, gameHeight);
    const hudPlane = new THREE.Mesh(planeGeometry, hudMaterial);
    sceneHud.add(hudPlane);
}

function renderHud() {
    hudContext.clearRect(0, 0, hudWidth, hudHeight);

    fillLeftInfoPanel();
    fillRightInfoPanel();
    fillMainPanel();

    drawMultipliers();

    hudTexture.needsUpdate = true;
    renderer.render(sceneHud, cameraHud);
}

function fillLeftInfoPanel() {
    hudContext.textAlign = 'left';
    hudContext.fillStyle = infoPanelTextColor;
    hudContext.font = "Normal "+infoPanelFontSize+"px Courier New";
    hudContext.fillText(
        "SCORE".padEnd(7, " ") + currentScore.toString().padStart(4, "0"), 
        hudWidth*infoPanelRelativeOffsetX, 
        hudHeight*(infoPanelRelativeOffsetY+0*infoPanelRelativeOffsetYStep));
    hudContext.fillText(
        "TIME".padEnd(7, " ") + (currentTime/59 | 0).toString().padStart(1, "0")+":"+(currentTime%59).toFixed(0).padStart(2, "0"), 
        hudWidth*infoPanelRelativeOffsetX, 
        hudHeight*(infoPanelRelativeOffsetY+1*infoPanelRelativeOffsetYStep));
    hudContext.fillText(
        "FUEL".padEnd(7, " ") + currentFuel.toFixed(0).padStart(4, "0"), 
        hudWidth*infoPanelRelativeOffsetX, 
        hudHeight*(infoPanelRelativeOffsetY+2*infoPanelRelativeOffsetYStep));
    if(isAlerted) {
        let fuelAlertText;
        if(hasFuel) {
            fuelAlertText = "LOW ON FUEL";
        }
        else{
            fuelAlertText = "OUT OF FUEL";
        }
        hudContext.fillText(
            fuelAlertText, 
            hudWidth*infoPanelRelativeOffsetX, 
            hudHeight*(infoPanelRelativeOffsetY+3*infoPanelRelativeOffsetYStep));
    }
}

function fillRightInfoPanel() {
    hudContext.textAlign = 'right';
    hudContext.fillStyle = infoPanelTextColor;
    hudContext.font = "Normal "+infoPanelFontSize+"px Courier New";
    hudContext.fillText(
        "ALTITUDE".padEnd(20, " ") + altitude.toFixed(0).padStart(4, "0"), 
        hudWidth*(1-infoPanelRelativeOffsetX), 
        hudHeight*(infoPanelRelativeOffsetY+0*infoPanelRelativeOffsetYStep));
    hudContext.fillText(
        "HORIZONTAL SPEED".padEnd(18, " ") + velocityX.toFixed(1).padStart(6, " "), 
        hudWidth*(1-infoPanelRelativeOffsetX), 
        hudHeight*(infoPanelRelativeOffsetY+1*infoPanelRelativeOffsetYStep));
    hudContext.fillText(
        "VERTICAL SPEED".padEnd(18, " ") + (-velocityY).toFixed(1).padStart(6, " "), 
        hudWidth*(1-infoPanelRelativeOffsetX), 
        hudHeight*(infoPanelRelativeOffsetY+2*infoPanelRelativeOffsetYStep));
    hudContext.fillText(
        "ROTATION ANGLE".padEnd(18, " ") + (-lander.rotation.z * (180/Math.PI)).toFixed(1).padStart(6, " "), 
        hudWidth*(1-infoPanelRelativeOffsetX), 
        hudHeight*(infoPanelRelativeOffsetY+3*infoPanelRelativeOffsetYStep));
}

function fillMainPanel() {
    hudContext.textAlign = 'center';

    if(isGameOver) {
        hudContext.font = "Normal "+mainPanelFontSize+"px Courier New";
        hudContext.fillStyle = mainPanelTextColor;

        hudContext.fillText(
            "PRESS ANY KEY TO PLAY", 
            hudWidth*mainPanelRelativeOffsetX, 
            hudHeight*(mainPanelRelativeOffsetY+0*mainPanelRelativeOffsetYStep));
        hudContext.fillText(
            "ARROW KEYS TO MOVE", 
            hudWidth*mainPanelRelativeOffsetX, 
            hudHeight*(mainPanelRelativeOffsetY+1*mainPanelRelativeOffsetYStep));
    }
    else if(isBetweenRounds) {
        hudContext.font = "Normal "+statsPanelFontSize+"px Courier New";
        hudContext.fillStyle = statsPanelTextColor;

        let landingText, scoreText, fuelText, gameOverText;

        gameOverText = "";
        if(hasLanded) {
            landingText = "SUCCESSFULLY LANDED";
            fuelText = fuelChange.toFixed(0) + " FUEL UNITS GAINED";
            scoreText = scoreChange + " POINTS GAINED";
        }
        else {
            landingText = "LANDER DESTROYED";
            fuelText = fuelChange.toFixed(0) + " FUEL UNITS LOST";
            scoreText = crashInfo;
            if(!hasFuel) {
                fuelText = "OUT OF FUEL";
                gameOverText = "GAME OVER";
            }
        }

        hudContext.fillText(
            landingText, 
            hudWidth*statsPanelRelativeOffsetX, 
            hudHeight*(statsPanelRelativeOffsetY+0*statsPanelRelativeOffsetYStep));
        hudContext.fillText(
            scoreText, 
            hudWidth*statsPanelRelativeOffsetX, 
            hudHeight*(statsPanelRelativeOffsetY+1*statsPanelRelativeOffsetYStep));
        hudContext.fillText(
            fuelText, 
            hudWidth*statsPanelRelativeOffsetX, 
            hudHeight*(statsPanelRelativeOffsetY+2*statsPanelRelativeOffsetYStep));
        hudContext.fillText(
            gameOverText, 
            hudWidth*statsPanelRelativeOffsetX, 
            hudHeight*(statsPanelRelativeOffsetY+3*statsPanelRelativeOffsetYStep));        
    }
}

function drawMultipliers() {
    if(isGameOver) return;

    hudContext.textAlign = 'center';
    hudContext.fillStyle = multiplierFontColor;

    let fontSize = multiplierFontSize;
    if(isZoomed) fontSize *= zoom;
    hudContext.font = "Normal "+fontSize+"px Courier New";
    var i;
    for(i = 0; i < scoreMultipliers.length; i++) {
        let mul = scoreMultipliers[i];
        if(mul < 2) continue;

        let leftVector = lineSegments[i][0];
        let rightVector = lineSegments[i][1];
        let pointX, pointY;
        pointX = (leftVector.x + rightVector.x) / 2;
        pointY = leftVector.y;

        let hudPoint = worldToHudCoord(pointX, pointY);
        hudContext.fillText("X"+mul, hudPoint[0], hudPoint[1] + fontSize);
    }
}

function worldToHudCoord(wx, wy) {
    let hx, hy;

    if(isZoomed) {
        wx -= camera.position.x;
        wy -= camera.position.y;
        wx *= zoom;
        wy *= zoom;
    }

    hx = (wx / gameWidth + 0.5) * hudWidth;
    hy = (1 - (wy / gameHeight + 0.5)) * hudHeight;

    return [hx, hy];
}