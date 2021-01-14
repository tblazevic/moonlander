function initSound() {
    crashSound = new sound("audio/crash.mp3");
    rocketSound = new sound("audio/rocket.mp3");
    lowFuelSound = new sound("audio/alarm.mp3");
    commSound = new sound("audio/morse.mp3");

    rocketSound.loop();
}

class sound{
    constructor(src) {
        this.sound = document.createElement("audio");
        this.sound.src = src;
        this.sound.setAttribute("preload", "auto");
        this.sound.setAttribute("controls", "none");
        this.sound.style.display = "none";
        document.body.appendChild(this.sound);
    }

    play() {
        this.sound.play();
    }

    stop() {
        this.sound.pause();
    }

    loop() {
        this.sound.addEventListener('timeupdate', function(){
            var buffer = 0.42;
            if(this.currentTime > this.duration - buffer){
                this.currentTime = 0;
                this.play();
            }
        });
    }
}

function fuelAlertCheck() {
    if(!isAlerted && currentFuel < fuelAlertThreshold) {
        isAlerted = true;
        fuelAlert();
    }
    else if(isAlerted && currentFuel > fuelAlertThreshold) {
        isAlerted = false;
    }
}

function fuelAlert() {
    if(isGameOver || !isAlerted) {
        return;
    }
    lowFuelSound.play();
    setTimeout(fuelAlert, alertInterval * 1000);
}

function playComms() {
    if(!isGameOver) {    
        commSound.play();
    }
    setTimeout(playComms, (Math.random() * (commsIntervalMax - commsIntervalMin) + commsIntervalMin) * 1000)
}