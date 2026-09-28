class Particle{
    constructor(scale) {
        this.isAlive = false;
        this.startLifeTime = 0;
        this.lifeTime = 0;
        this.velocity = new THREE.Vector3();
        this.dragCoef = 0;
        
        const geometry = new THREE.PlaneGeometry(scale,scale);
        const material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
        material.transparent = true;
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.visible = false;
    }

    setTime(time) {
        this.lifeTime = time;
        this.startLifeTime = time;
    }
}

class ParticleSystem{
    constructor(scene, target, maxParticles, lifeTimeMin, lifeTimeMax, gravity, dragCoefMin, dragCoefMax, particleSize,
        velocityMinMagnitude, velocityMaxMagnitude, startOpacity, endOpacity, startColor, endColor, startScale, endScale) 
        {
        this.maxParticles = maxParticles;
        this.lifeTimeMin = lifeTimeMin;
        this.lifeTimeMax = lifeTimeMax;
        this.gravity = gravity;
        this.dragCoefMin = dragCoefMin;
        this.dragCoefMax = dragCoefMax;

        this.velocityMinMagnitude = velocityMinMagnitude;
        this.velocityMaxMagnitude = velocityMaxMagnitude;
        this.startOpacity = startOpacity;
        this.endOpacity = endOpacity;
        this.startColor = startColor;
        this.endColor = endColor;
        this.startScale = startScale;
        this.endScale = endScale;
        
        this.initialVelocityX = 0;
        this.initialVelocityY = 0;

        this.vector2Zero = new THREE.Vector2(0,0);
        this.randomVelocity = new THREE.Vector2();

        this.target = target;

        this.particles = [];
        this.availableParticles = [];
        this.activeParticles = [];
        this.group = new THREE.Group();
        scene.add(this.group);
        this.group.position.z = -5;

        for(let i = 0; i < maxParticles; i++) {
            const particle = new Particle(particleSize);
            this.particles.push(particle);
            this.availableParticles.push(particle);
            this.group.add(particle.mesh);
        }
    }

    update(deltaTime) {
        this.updateValues(deltaTime);
    }

    updateValues(deltaTime) {
        for(let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];

            particle.lifeTime -= deltaTime;
            if(particle.lifeTime <= 0) {
                this.releaseParticle(i);
                continue;
            }

            let velocityDeltaX, velocityDeltaY, positionDeltaX, positionDeltaY;
            velocityDeltaX = -particle.velocity.x*particle.dragCoef * deltaTime;
            velocityDeltaY = -(this.gravity+particle.velocity.y*particle.dragCoef) * deltaTime;
            particle.velocity.x += velocityDeltaX;
            particle.velocity.y += velocityDeltaY;
            positionDeltaX = particle.velocity.x * deltaTime;
            positionDeltaY = particle.velocity.y * deltaTime;
            particle.mesh.position.x += positionDeltaX;
            particle.mesh.position.y += positionDeltaY;

            const t = particle.lifeTime / particle.startLifeTime;

            const newScale = (1-t)*this.endScale + t * this.startScale;
            particle.mesh.scale.set(newScale, newScale, 1);

            particle.mesh.material.opacity = (1-t) * this.endOpacity + t * this.startOpacity;
            lerpColor(this.startColor, this.endColor, particle.mesh.material.color, t);
        }
    }

    emit(count) {
        const particleCount = Math.min(Math.floor(count), this.availableParticles.length);
        for(let i = 0; i < particleCount; i++) {
            const particle = this.availableParticles.pop();
            this.resetParticle(particle);
            this.activeParticles.push(particle);
        }
    }

    releaseParticle(index) {
        const particle = this.activeParticles[index];
        particle.isAlive = false;
        particle.mesh.visible = false;

        const lastParticle = this.activeParticles.pop();
        if(index < this.activeParticles.length) {
            this.activeParticles[index] = lastParticle;
        }
        this.availableParticles.push(particle);
    }

    clear() {
        while(this.activeParticles.length > 0) {
            this.releaseParticle(this.activeParticles.length - 1);
        }
    }

    resetParticle(particle) {
        particle.isAlive = true;
        particle.setTime(this.lifeTimeMin + Math.random() * (this.lifeTimeMax - this.lifeTimeMin));
        particle.mesh.visible = true;
        this.setParticlePosition(particle);
        const velocity = this.generateRandomVelocity();
        particle.velocity.set(this.initialVelocityX+velocity.x, this.initialVelocityY+velocity.y, 0);
        particle.dragCoef = Math.random() * (this.dragCoefMax - this.dragCoefMin) + this.dragCoefMin;
        particle.mesh.scale.set(this.startScale, this.startScale, 1);
        particle.mesh.material.opacity = this.startOpacity;
        particle.mesh.material.color.setHex(this.startColor.getHex());
    }

    setParticlePosition(particle) {
        this.target.getWorldPosition(particle.mesh.position);
    }

    generateRandomVelocity() {
        return this.randomVelocity.set(0, 0);
    }
}

class ParticleSystemCone extends ParticleSystem{
    constructor(scene, target, maxParticles, frequencyMin, frequencyMax, lifeTimeMin, lifeTimeMax, gravity, dragCoefMin, dragCoefMax, direction, initialWidth, angle, particleSize,
        velocityMinMagnitude, velocityMaxMagnitude, startOpacity, endOpacity, startColor, endColor, startScale, endScale)
        {
        super(scene, target, maxParticles, lifeTimeMin, lifeTimeMax, gravity, dragCoefMin, dragCoefMax, particleSize,
            velocityMinMagnitude, velocityMaxMagnitude, startOpacity, endOpacity, startColor, endColor, startScale, endScale);

        this.frequencyMin = frequencyMin;
        this.frequencyMax = frequencyMax;
        this.direction = direction;
        this.initialWidth = initialWidth;
        this.angle = angle;
        this.tan = Math.tan(angle);
        this.emitting = false;
        this.frequencyOverflow = 0;
        this.thrustFactor = 0;
        this.randomOffset = new THREE.Vector2();
    }

    update(deltaTime) {
        this.thrustFactor = currentAcceleration / thrusterAccelerationMax;
        super.update(deltaTime);
        this.emit(deltaTime);
    }

    emit(deltaTime) {
        if(!this.emitting) return;

        const targetParticles = deltaTime * (this.frequencyMin + Math.random() * (this.frequencyMax - this.frequencyMin));
        const newParticleCount = targetParticles + this.frequencyOverflow;
        this.frequencyOverflow = newParticleCount % 1;
        super.emit(newParticleCount);
    }

    setParticlePosition(particle) {
        super.setParticlePosition(particle);
        const offset = this.generateRandomOffset();
        particle.mesh.position.x += offset.x;
        particle.mesh.position.y += offset.y;
    }

    generateRandomOffset() {
        const offset = this.randomOffset.copy(this.direction);
        offset.rotateAround(this.vector2Zero, Math.PI/2);
        offset.normalize();
        offset.multiplyScalar((Math.random()-0.5)*2*this.initialWidth);
        return offset;
    }

    generateRandomVelocity() {
        const offset = this.randomVelocity.copy(this.direction);
        offset.rotateAround(this.vector2Zero, Math.PI/2);
        offset.normalize();
        offset.multiplyScalar((Math.random()-0.5)*2*this.tan);

        offset.x += this.direction.x;
        offset.y += this.direction.y;
        offset.normalize();
        offset.multiplyScalar((this.thrustFactor/2 + 0.5) * (Math.random() * (this.velocityMaxMagnitude - this.velocityMinMagnitude) + this.velocityMinMagnitude));
        return offset;
    }
}


class ParticleSystemExplosion extends ParticleSystem{
    emit() {
        this.clear();
        super.emit(this.maxParticles);
    }

    setParticlePosition(particle) {
        super.setParticlePosition(particle);
        particle.mesh.position.z = -5;
    }

    generateRandomVelocity() {
        const offset = this.randomVelocity.set(0, 1);
        offset.rotateAround(this.vector2Zero, Math.random() * 2*Math.PI);
        offset.normalize();
        offset.multiplyScalar(Math.random() * (this.velocityMaxMagnitude - this.velocityMinMagnitude) + this.velocityMinMagnitude);
        return offset;
    }
}

function lerpColor(startColor, endColor, outColor, t) {
    outColor.r = (1-t)*endColor.r + t*startColor.r;
    outColor.g = (1-t)*endColor.g + t*startColor.g;
    outColor.b = (1-t)*endColor.b + t*startColor.b;
}
