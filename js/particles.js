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

class ParticleSystemCone{
    constructor(scene, target, maxParticles, frequencyMin, frequencyMax, lifeTimeMin, lifeTimeMax, gravity, dragCoefMin, dragCoefMax, direction, initialWidth, angle, particleSize, 
        velocityMinMagnitude, velocityMaxMagnitude, startOpacity, endOpacity, startColor, endColor, startScale, endScale) 
        {
        this.maxParticles = maxParticles;
        this.frequencyMin = frequencyMin;
        this.frequencyMax = frequencyMax;
        this.lifeTimeMin = lifeTimeMin;
        this.lifeTimeMax = lifeTimeMax;
        this.gravity = gravity;
        this.dragCoefMin = dragCoefMin;
        this.dragCoefMax = dragCoefMax;
        this.direction = direction;
        this.initialWidth = initialWidth;
        this.angle = angle;
        this.tan = Math.tan(angle);

        this.velocityMinMagnitude = velocityMinMagnitude;
        this.velocityMaxMagnitude = velocityMaxMagnitude;
        this.startOpacity = startOpacity;
        this.endOpacity = endOpacity;
        this.startColor = startColor;
        this.endColor = endColor;
        this.startScale = startScale;
        this.endScale = endScale;
        
        this.emitting = false;
        this.frequencyOverflow = 0; 
        this.initialVelocityX = 0;
        this.initialVelocityY = 0;

        this.vector2Zero = new THREE.Vector2(0,0);

        this.target = target;

        this.particles = [];
        this.group = new THREE.Group();
        scene.add(this.group);
        this.group.position.z = -5;

        let i;
        for(i = 0; i < maxParticles; i++) {
            this.particles[i] = new Particle(particleSize);
            this.group.add(this.particles[i].mesh);
        }
    }

    update(deltaTime) {
        this.thrustFactor = currentAcceleration / thrusterAccelerationMax;
        this.updateValues(deltaTime);
        this.emit(deltaTime);
    }

    updateValues(deltaTime) {
        let i;
        for(i = 0; i < this.maxParticles; i++) {
            let particle = this.particles[i];
            if(!particle.isAlive) continue;

            particle.lifeTime -= deltaTime;
            if(particle.lifeTime <= 0) {
                particle.isAlive = false;
                particle.mesh.visible = false;
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
            particle.mesh.scale.set(newScale, newScale);

            particle.mesh.material.opacity = (1-t) * this.endOpacity + t * this.startOpacity;
            lerpColor(this.startColor, this.endColor, particle.mesh.material.color, t);
        }
    }

    emit(deltaTime) {
        if(this.emitting) {
            let targetParticles = deltaTime * (this.frequencyMin + Math.random() * (this.frequencyMax - this.frequencyMin));
            let newParticleCount = targetParticles + this.frequencyOverflow;
            this.frequencyOverflow = newParticleCount % 1;
            if(newParticleCount < 1) {
                return;
            }
            let i;
            for(i = 0; i < this.maxParticles; i++) {
                let particle = this.particles[i];
                if(!particle.isAlive) {
                    this.resetParticle(particle);
                    newParticleCount--;
                    if(newParticleCount < 1) {
                        break;
                    }
                }
            }
        }
    }

    resetParticle(particle) {
        particle.isAlive = true;
        particle.setTime(this.lifeTimeMin + Math.random() * (this.lifeTimeMax - this.lifeTimeMin));
        particle.mesh.visible = true;
        this.target.getWorldPosition(particle.mesh.position);
        const offset = this.generateRandomOffset();
        particle.mesh.position.x += offset.x;
        particle.mesh.position.y += offset.y;
        const velocity = this.generateRandomVelocity();
        particle.velocity.set(this.initialVelocityX+velocity.x, this.initialVelocityY+velocity.y, 0);
        particle.dragCoef = Math.random() * (this.dragCoefMax - this.dragCoefMin) + this.dragCoefMin;
        particle.mesh.scale.set(this.startScale, this.startScale);
        particle.mesh.material.opacity = this.startOpacity;
        particle.mesh.material.color.setHex(this.startColor.getHex());
    }

    generateRandomOffset() {
        let offset = new THREE.Vector2(this.direction.x, this.direction.y);
        offset.rotateAround(this.vector2Zero, Math.PI/2);
        offset.normalize();
        offset.multiplyScalar((Math.random()-0.5)*2*this.initialWidth);
        return offset;
    }

    generateRandomVelocity() {
        let offset = new THREE.Vector2(this.direction.x, this.direction.y);
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


class ParticleSystemExplosion{
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
        this.target = target;

        this.particles = [];
        this.group = new THREE.Group();
        scene.add(this.group);
        this.group.position.z = -5;

        let i;
        for(i = 0; i < maxParticles; i++) {
            this.particles[i] = new Particle(particleSize);
            this.group.add(this.particles[i].mesh);
        }
    }

    update(deltaTime) {
        this.updateValues(deltaTime);
    }

    updateValues(deltaTime) {
        let i;
        for(i = 0; i < this.maxParticles; i++) {
            let particle = this.particles[i];
            if(!particle.isAlive) continue;

            particle.lifeTime -= deltaTime;
            if(particle.lifeTime <= 0) {
                particle.isAlive = false;
                particle.mesh.visible = false;
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
            particle.mesh.scale.set(newScale, newScale);

            particle.mesh.material.opacity = (1-t) * this.endOpacity + t * this.startOpacity;
            lerpColor(this.startColor, this.endColor, particle.mesh.material.color, t);
        }
    }

    emit() {
        let i;
        for(i = 0; i < this.maxParticles; i++) {
            let particle = this.particles[i];
            this.resetParticle(particle);
        }
    }

    resetParticle(particle) {
        particle.isAlive = true;
        particle.setTime(this.lifeTimeMin + Math.random() * (this.lifeTimeMax - this.lifeTimeMin));
        particle.mesh.visible = true;
        particle.mesh.position.set(lander.position.x, lander.position.y, -5); 
        const velocity = this.generateRandomVelocity();
        particle.velocity.set(this.initialVelocityX+velocity.x, this.initialVelocityY+velocity.y, 0);
        particle.dragCoef = Math.random() * (this.dragCoefMax - this.dragCoefMin) + this.dragCoefMin;
        particle.mesh.scale.set(this.startScale, this.startScale);
        particle.mesh.material.opacity = this.startOpacity;
        particle.mesh.material.color.setHex(this.startColor.getHex());
    }

    generateRandomVelocity() {
        let offset = new THREE.Vector2(0, 1);
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