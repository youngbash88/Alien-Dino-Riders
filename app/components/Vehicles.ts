import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

interface DinosaurType {
    name: string;
    color: number;
    scale: number;
    speed: number;
    turnSpeed: number;
    height: number;
    behaviors: string[];
}

export class Vehicles {
    scene: THREE.Scene;
    loadingManager: THREE.LoadingManager;
    dinosaurs: any[] = [];
    spaceships: any[] = [];
    loader: GLTFLoader;
    audioLoader: THREE.AudioLoader;
    listener: THREE.AudioListener;
    clock: THREE.Clock;

    constructor(scene: THREE.Scene, loadingManager: THREE.LoadingManager) {
        this.scene = scene;
        this.loadingManager = loadingManager;
        this.loader = new GLTFLoader(this.loadingManager);
        this.clock = new THREE.Clock();
        
        // Setup audio
        this.listener = new THREE.AudioListener();
        this.audioLoader = new THREE.AudioLoader(this.loadingManager);
        
        // Setup DRACO loader for compressed models
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/draco/');
        this.loader.setDRACOLoader(dracoLoader);
        
        this.init();
    }

    init() {
        this.createDinosaurs();
        this.createSpaceships();
    }

    getDinosaurTypes(): DinosaurType[] {
        return [
            {
                name: 'T-Rex',
                color: 0x8B4513,  // Rich brown
                scale: 2.0,
                speed: 30,
                turnSpeed: 2.0,
                height: 5.0,
                behaviors: ['hunt', 'patrol']
            },
            {
                name: 'Velociraptor',
                color: 0x556B2F,  // Dark olive green
                scale: 1.5,
                speed: 35,
                turnSpeed: 3.0,
                height: 2.0,
                behaviors: ['pack', 'stalk']
            },
            {
                name: 'Triceratops',
                color: 0x8B8B83,  // Gray
                scale: 1.8,
                speed: 25,
                turnSpeed: 1.5,
                height: 3.0,
                behaviors: ['graze', 'defend']
            }
        ];
    }

    createDinosaurModel(type: DinosaurType): THREE.Group {
        const dinosaur = new THREE.Group();
        
        // Create base material with better properties
        const material = new THREE.MeshStandardMaterial({
            color: type.color,
            roughness: 0.7,
            metalness: 0.1,
            bumpScale: 0.02,
            envMapIntensity: 1.0
        });

        // Add procedural textures for more realism
        const textureSize = 1024;
        const canvas = document.createElement('canvas');
        canvas.width = textureSize;
        canvas.height = textureSize;
        const ctx = canvas.getContext('2d')!;

        // Create scale pattern
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, textureSize, textureSize);
        
        // Draw scales
        const scaleSize = 16;
        const rows = textureSize / scaleSize;
        const cols = textureSize / scaleSize;
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const x = j * scaleSize;
                const y = i * scaleSize;
                const offset = (i % 2) * (scaleSize / 2);
                
                ctx.beginPath();
                ctx.moveTo(x + offset, y);
                ctx.lineTo(x + scaleSize/2 + offset, y + scaleSize/2);
                ctx.lineTo(x + offset, y + scaleSize);
                ctx.closePath();
                
                // Vary the scale colors slightly
                const brightness = 0.7 + Math.random() * 0.3;
                ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
                ctx.fill();
            }
        }

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        
        // Apply texture to material
        material.bumpMap = texture;
        material.displacementMap = texture;
        material.displacementScale = 0.1;
        material.needsUpdate = true;

        // Rest of the dinosaur creation code...
        switch(type.name) {
            case 'T-Rex':
                // Enhanced T-Rex geometry with more detail
                const bodyGeometry = new THREE.CapsuleGeometry(2 * type.scale, 4 * type.scale, 8, 16);
                const body = new THREE.Mesh(bodyGeometry, material);
                body.position.y = 3 * type.scale;
                body.rotation.x = Math.PI / 2;
                dinosaur.add(body);

                // More detailed head
                const headGeometry = new THREE.BoxGeometry(1.5 * type.scale, 2 * type.scale, 1.5 * type.scale, 4, 4, 4);
                const head = new THREE.Mesh(headGeometry, material);
                head.position.set(0, 4.5 * type.scale, 2 * type.scale);
                
                // Add teeth
                const teethMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFF0, roughness: 0.3, metalness: 0.2 });
                for (let i = 0; i < 6; i++) {
                    const tooth = new THREE.Mesh(
                        new THREE.ConeGeometry(0.1 * type.scale, 0.3 * type.scale, 4),
                        teethMaterial
                    );
                    tooth.position.set(
                        (i % 3 - 1) * 0.3 * type.scale,
                        -0.8 * type.scale,
                        0.7 * type.scale
                    );
                    head.add(tooth);
                }
                dinosaur.add(head);

                // Jaw
                const jaw = new THREE.Mesh(
                    new THREE.BoxGeometry(1.2 * type.scale, 1 * type.scale, 1.5 * type.scale),
                    material
                );
                jaw.position.set(0, 3.8 * type.scale, 2.5 * type.scale);
                dinosaur.add(jaw);

                // Legs
                const legGeometry = new THREE.CapsuleGeometry(0.5 * type.scale, 3 * type.scale, 4, 8);
                const leg1 = new THREE.Mesh(legGeometry, material);
                leg1.position.set(1 * type.scale, 2 * type.scale, 0);
                dinosaur.add(leg1);

                const leg2 = leg1.clone();
                leg2.position.set(-1 * type.scale, 2 * type.scale, 0);
                dinosaur.add(leg2);

                // Tail
                const tail = new THREE.Mesh(
                    new THREE.CapsuleGeometry(0.8 * type.scale, 4 * type.scale, 4, 8),
                    material
                );
                tail.position.set(0, 3 * type.scale, -2.5 * type.scale);
                tail.rotation.x = -Math.PI / 4;
                dinosaur.add(tail);
                break;

            case 'Velociraptor':
                // Sleeker body
                const raptorBody = new THREE.Mesh(
                    new THREE.CapsuleGeometry(1 * type.scale, 3 * type.scale, 4, 8),
                    material
                );
                raptorBody.position.y = 2 * type.scale;
                raptorBody.rotation.x = Math.PI / 3;
                dinosaur.add(raptorBody);

                // Raptor head
                const raptorHead = new THREE.Mesh(
                    new THREE.ConeGeometry(0.6 * type.scale, 1.5 * type.scale, 8),
                    material
                );
                raptorHead.position.set(0, 3 * type.scale, 1.5 * type.scale);
                raptorHead.rotation.x = -Math.PI / 3;
                dinosaur.add(raptorHead);

                // Legs
                const raptorLegGeometry = new THREE.CapsuleGeometry(0.3 * type.scale, 2 * type.scale, 4, 8);
                const raptorLeg1 = new THREE.Mesh(raptorLegGeometry, material);
                raptorLeg1.position.set(0.5 * type.scale, 1.5 * type.scale, 0);
                dinosaur.add(raptorLeg1);

                const raptorLeg2 = raptorLeg1.clone();
                raptorLeg2.position.set(-0.5 * type.scale, 1.5 * type.scale, 0);
                dinosaur.add(raptorLeg2);

                // Arms
                const armGeometry = new THREE.CapsuleGeometry(0.2 * type.scale, 1 * type.scale, 4, 8);
                const arm1 = new THREE.Mesh(armGeometry, material);
                arm1.position.set(0.8 * type.scale, 2.5 * type.scale, 0.5 * type.scale);
                arm1.rotation.z = Math.PI / 4;
                dinosaur.add(arm1);

                const arm2 = arm1.clone();
                arm2.position.set(-0.8 * type.scale, 2.5 * type.scale, 0.5 * type.scale);
                arm2.rotation.z = -Math.PI / 4;
                dinosaur.add(arm2);
                break;

            case 'Triceratops':
                // Wide body
                const triBody = new THREE.Mesh(
                    new THREE.CapsuleGeometry(2.5 * type.scale, 4 * type.scale, 4, 8),
                    material
                );
                triBody.position.y = 2.5 * type.scale;
                triBody.rotation.x = Math.PI / 2;
                dinosaur.add(triBody);

                // Head with frill
                const triHead = new THREE.Group();
                
                // Main head
                const mainHead = new THREE.Mesh(
                    new THREE.BoxGeometry(2 * type.scale, 1.5 * type.scale, 2 * type.scale),
                    material
                );
                triHead.add(mainHead);

                // Frill
                const frill = new THREE.Mesh(
                    new THREE.CylinderGeometry(2 * type.scale, 2 * type.scale, 0.3 * type.scale, 32, 1, false, 0, Math.PI),
                    material
                );
                frill.rotation.x = Math.PI / 2;
                frill.position.z = -1 * type.scale;
                triHead.add(frill);

                // Horns
                const hornGeometry = new THREE.ConeGeometry(0.3 * type.scale, 1.5 * type.scale, 8);
                const horn1 = new THREE.Mesh(hornGeometry, material);
                horn1.position.set(1 * type.scale, 0.5 * type.scale, 1 * type.scale);
                horn1.rotation.x = -Math.PI / 4;
                triHead.add(horn1);

                const horn2 = horn1.clone();
                horn2.position.set(-1 * type.scale, 0.5 * type.scale, 1 * type.scale);
                triHead.add(horn2);

                const horn3 = new THREE.Mesh(
                    new THREE.ConeGeometry(0.2 * type.scale, 1 * type.scale, 8),
                    material
                );
                horn3.position.set(0, 0.5 * type.scale, 1.5 * type.scale);
                horn3.rotation.x = -Math.PI / 4;
                triHead.add(horn3);

                triHead.position.set(0, 2.5 * type.scale, 2 * type.scale);
                dinosaur.add(triHead);

                // Legs
                const triLegGeometry = new THREE.CapsuleGeometry(0.6 * type.scale, 2.5 * type.scale, 4, 8);
                const positions = [
                    [1.5, 1.5, 1],
                    [-1.5, 1.5, 1],
                    [1.5, 1.5, -1],
                    [-1.5, 1.5, -1]
                ];

                positions.forEach(([x, y, z]) => {
                    const leg = new THREE.Mesh(triLegGeometry, material);
                    leg.position.set(x * type.scale, y * type.scale, z * type.scale);
                    dinosaur.add(leg);
                });
                break;
        }

        // Enable shadows and apply texture scaling
        dinosaur.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material instanceof THREE.MeshStandardMaterial) {
                    child.material.map = texture;
                    child.material.bumpMap = texture;
                    child.material.needsUpdate = true;
                }
            }
        });

        return dinosaur;
    }

    createRealisticTRex(position: THREE.Vector3, scale: number = 2.5) {
        const group = new THREE.Group();
        
        // Better materials with realistic colors
        const skinMaterial = new THREE.MeshStandardMaterial({
            color: 0x5A4A3A,  // Natural brown
            roughness: 0.9,
            metalness: 0.1,
        });

        // Main body - curved and muscular
        const bodyGeometry = new THREE.CapsuleGeometry(3 * scale, 8 * scale, 8, 16);
        const body = new THREE.Mesh(bodyGeometry, skinMaterial);
        body.rotation.x = Math.PI / 2;
        body.position.y = 6 * scale;

        // Muscular thighs for back legs
        const thighGeometry = new THREE.CapsuleGeometry(1.2 * scale, 4 * scale, 8, 8);
        const leftThigh = new THREE.Mesh(thighGeometry, skinMaterial);
        leftThigh.position.set(0, 4 * scale, 2 * scale);
        leftThigh.rotation.x = -Math.PI / 4;
        const rightThigh = leftThigh.clone();
        rightThigh.position.z = -2 * scale;

        // Lower legs with claws
        const shinGeometry = new THREE.CapsuleGeometry(0.8 * scale, 3.5 * scale, 8, 8);
        const leftShin = new THREE.Mesh(shinGeometry, skinMaterial);
        leftShin.position.set(0, 1.5 * scale, 2 * scale);
        leftShin.rotation.x = Math.PI / 6;
        const rightShin = leftShin.clone();
        rightShin.position.z = -2 * scale;

        // Detailed head with jaw
        const headGroup = new THREE.Group();
        
        // Skull shape
        const skullGeometry = new THREE.BoxGeometry(4 * scale, 2.5 * scale, 2 * scale);
        const skull = new THREE.Mesh(skullGeometry, skinMaterial);
        
        // Snout
        const snoutGeometry = new THREE.BoxGeometry(3 * scale, 1.5 * scale, 1.8 * scale);
        const snout = new THREE.Mesh(snoutGeometry, skinMaterial);
        snout.position.set(2 * scale, -0.2 * scale, 0);
        
        // Lower jaw
        const jawGeometry = new THREE.BoxGeometry(3.5 * scale, 0.8 * scale, 1.5 * scale);
        const jaw = new THREE.Mesh(jawGeometry, skinMaterial);
        jaw.position.set(1.8 * scale, -1 * scale, 0);
        
        // Teeth
        const teethMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFF0 });
        for (let i = 0; i < 6; i++) {
            const toothGeometry = new THREE.ConeGeometry(0.2 * scale, 0.6 * scale, 8);
            const tooth = new THREE.Mesh(toothGeometry, teethMaterial);
            tooth.rotation.x = Math.PI;
            tooth.position.set((i - 3) * 0.4 * scale, -0.8 * scale, 0.6 * scale);
            jaw.add(tooth.clone());
            tooth.position.z = -0.6 * scale;
            jaw.add(tooth);
        }

        // Eyes
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            emissive: 0x330000
        });
        const eyeGeometry = new THREE.SphereGeometry(0.3 * scale);
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(1 * scale, 0.5 * scale, 0.8 * scale);
        const rightEye = leftEye.clone();
        rightEye.position.z = -0.8 * scale;

        headGroup.add(skull, snout, jaw, leftEye, rightEye);
        headGroup.position.set(5 * scale, 8 * scale, 0);
        headGroup.rotation.y = Math.PI / 24;

        // Muscular neck
        const neckGeometry = new THREE.CapsuleGeometry(1.2 * scale, 2 * scale, 8, 8);
        const neck = new THREE.Mesh(neckGeometry, skinMaterial);
        neck.position.set(3 * scale, 7 * scale, 0);
        neck.rotation.z = -Math.PI / 4;

        // Long tail
        const tailGroup = new THREE.Group();
        const segments = 8;
        for (let i = 0; i < segments; i++) {
            const tailGeometry = new THREE.CapsuleGeometry(
                (1 - i/segments) * scale,
                2 * scale,
                8,
                8
            );
            const tailSegment = new THREE.Mesh(tailGeometry, skinMaterial);
            tailSegment.position.set(
                -3 * scale - (i * 2 * scale),
                6 * scale - (i * 0.5 * scale),
                0
            );
            tailSegment.rotation.z = Math.PI / 2 + (i * Math.PI / 16);
            tailGroup.add(tailSegment);
        }

        // Arms
        const armGeometry = new THREE.CapsuleGeometry(0.4 * scale, 2 * scale, 8, 8);
        const leftArm = new THREE.Mesh(armGeometry, skinMaterial);
        leftArm.position.set(2 * scale, 6 * scale, 1.5 * scale);
        leftArm.rotation.x = Math.PI / 6;
        const rightArm = leftArm.clone();
        rightArm.position.z = -1.5 * scale;

        // Assemble the T-Rex
        group.add(body, leftThigh, rightThigh, leftShin, rightShin, 
                  headGroup, neck, tailGroup, leftArm, rightArm);
        
        // Position the entire dinosaur
        group.position.copy(position);
        
        // Add shadows
        group.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });

        this.scene.add(group);
        this.dinosaurs.push({
            model: group,
            speed: 25,
            turnSpeed: 0.02
        });
    }

    createDinosaurs() {
        const positions = [
            new THREE.Vector3(150, 2, 100),
            new THREE.Vector3(-180, 2, -120),
            new THREE.Vector3(200, 2, -200),
            new THREE.Vector3(-150, 2, 150)
        ];

        positions.forEach(pos => {
            this.createRealisticTRex(pos, 1.8);
            // Add slight color variations
            if(Math.random() > 0.5) {
                pos.y += Math.random() * 2;
            }
        });
    }

    createSpaceships() {
        // Create spaceships hovering around the pyramids (not inside)
        const shipPositions = [
            new THREE.Vector3(200, 40, -200),   // Far right high
            new THREE.Vector3(-200, 50, -150),  // Far left high
            new THREE.Vector3(0, 60, -300),     // Far back high
            new THREE.Vector3(-250, 45, 200),   // Far front left
            new THREE.Vector3(250, 55, 150)     // Far front right
        ];
        
        const shipColors = [0x808080, 0x4682B4, 0x9370DB, 0x808080, 0x4682B4];
        const shipTypes = ['Scout', 'Fighter', 'Cruiser', 'Scout', 'Fighter'];
        
        shipPositions.forEach((position, i) => {
            // Create larger spaceship model
            const scale = 2; // Make spaceships larger
            const bodyGeometry = new THREE.CylinderGeometry(0, 3 * scale, 2 * scale, 8);
            const cockpitGeometry = new THREE.SphereGeometry(1.5 * scale, 16, 16);
            const wingGeometry = new THREE.BoxGeometry(6 * scale, 0.2 * scale, 2 * scale);
            const engineGeometry = new THREE.CylinderGeometry(0.5 * scale, 0.8 * scale, 1 * scale, 8);
            
            const shipMaterial = new THREE.MeshStandardMaterial({ 
                color: shipColors[i],
                metalness: 0.7,
                roughness: 0.3
            });
            
            const glowMaterial = new THREE.MeshStandardMaterial({
                color: 0x00FFFF,
                emissive: 0x00FFFF,
                emissiveIntensity: 1,
                transparent: true,
                opacity: 0.7
            });
            
            // Create spaceship parts
            const body = new THREE.Mesh(bodyGeometry, shipMaterial);
            const cockpit = new THREE.Mesh(cockpitGeometry, new THREE.MeshStandardMaterial({
                color: 0x87CEFA,
                metalness: 0.9,
                roughness: 0.1,
                transparent: true,
                opacity: 0.7
            }));
            cockpit.position.set(0, 1 * scale, 0);
            
            const wingL = new THREE.Mesh(wingGeometry, shipMaterial);
            wingL.position.set(-3 * scale, 0, 0);
            
            const wingR = new THREE.Mesh(wingGeometry, shipMaterial);
            wingR.position.set(3 * scale, 0, 0);
            
            const engineL = new THREE.Mesh(engineGeometry, shipMaterial);
            engineL.position.set(-2 * scale, -0.5 * scale, 1 * scale);
            
            const engineR = new THREE.Mesh(engineGeometry, shipMaterial);
            engineR.position.set(2 * scale, -0.5 * scale, 1 * scale);
            
            const engineGlowL = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 0.5 * scale, 8),
                glowMaterial
            );
            engineGlowL.position.set(-2 * scale, -1 * scale, 1 * scale);
            
            const engineGlowR = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 0.5 * scale, 8),
                glowMaterial
            );
            engineGlowR.position.set(2 * scale, -1 * scale, 1 * scale);
            
            // Create spaceship group
            const spaceship = new THREE.Group();
            spaceship.add(body, cockpit, wingL, wingR, engineL, engineR, engineGlowL, engineGlowR);
            
            // Position spaceship
            spaceship.position.copy(position);
            spaceship.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            this.scene.add(spaceship);
            
            // Add to spaceships array
            this.spaceships.push({
                object: spaceship,
                type: 'spaceship',
                name: shipTypes[i],
                speed: 30,
                turnSpeed: 3
            });
        });
    }

    update(delta: number) {
        // Update dinosaur animations and behaviors
        this.dinosaurs.forEach(dino => {
            if (dino.mixer) {
                dino.mixer.update(delta);
            }
            
            // Update behaviors
            const time = this.clock.getElapsedTime();
            if (time - dino.lastBehaviorChange > 10) { // Change behavior every 10 seconds
                dino.currentBehavior = dino.behaviors[Math.floor(Math.random() * dino.behaviors.length)];
                dino.lastBehaviorChange = time;
                
                // Play corresponding animation
                if (dino.animations[dino.currentBehavior]) {
                    const currentAnimations = Object.values(dino.animations);
                    currentAnimations.forEach((anim) => {
                        if (anim instanceof THREE.AnimationAction) {
                            anim.stop();
                        }
                    });
                    dino.animations[dino.currentBehavior].play();
                }
                
                // Play sound occasionally
                if (Math.random() < 0.3) {
                    dino.sound.play();
                }
            }
            
            // Update position based on behavior
            this.updateDinosaurBehavior(dino, delta);
        });
        
        // Update spaceships
        this.spaceships.forEach(ship => {
            if (ship.mixer) {
                ship.mixer.update(delta);
            }
        });
    }

    updateDinosaurBehavior(dino: any, delta: number) {
        switch (dino.currentBehavior) {
            case 'patrol':
                // Move in a circular pattern
                const time = this.clock.getElapsedTime();
                const radius = 50;
                const speed = 0.5;
                dino.object.position.x += Math.cos(time * speed) * delta * 10;
                dino.object.position.z += Math.sin(time * speed) * delta * 10;
                break;
                
            case 'hunt':
                // Move towards nearest other dinosaur
                const target = this.findNearestDinosaur(dino.object.position, dino);
                if (target) {
                    const direction = target.position.clone().sub(dino.object.position).normalize();
                    dino.object.position.add(direction.multiplyScalar(delta * dino.speed));
                    dino.object.lookAt(target.position);
                }
                break;
                
            case 'graze':
                // Slight random movement
                if (Math.random() < 0.05) {
                    dino.object.rotation.y += (Math.random() - 0.5) * Math.PI * 0.25;
                }
                dino.object.position.add(
                    new THREE.Vector3(0, 0, -1)
                        .applyQuaternion(dino.object.quaternion)
                        .multiplyScalar(delta * dino.speed * 0.2)
                );
                break;
        }
    }

    findNearestDinosaur(position: THREE.Vector3, excludeDino: any) {
        let nearest: THREE.Object3D | null = null;
        let minDistance = Infinity;
        
        this.dinosaurs.forEach(dino => {
            if (dino === excludeDino) return;
            
            const distance = position.distanceTo(dino.object.position);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = dino.object;
            }
        });
        
        return nearest;
    }

    getNearestVehicle(playerPosition: THREE.Vector3, type: 'dinosaur' | 'spaceship') {
        const vehicles = type === 'dinosaur' ? this.dinosaurs : this.spaceships;
        let nearestVehicle = null;
        let minDistance = 20; // Increased interaction distance
        
        vehicles.forEach(vehicle => {
            const distance = playerPosition.distanceTo(vehicle.object.position);
            if (distance < minDistance) {
                nearestVehicle = vehicle;
                minDistance = distance;
            }
        });
        
        return nearestVehicle;
    }
}