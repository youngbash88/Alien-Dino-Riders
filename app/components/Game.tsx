'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Environment } from './Environment';
import { Vehicles } from './Vehicles';
import { Player } from './Player';

export default function Game() {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const loadingManagerRef = useRef<THREE.LoadingManager | null>(null);
    const playerRef = useRef<Player | null>(null);
    const vehiclesRef = useRef<Vehicles | null>(null);
    const environmentRef = useRef<Environment | null>(null);
    const lastTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize Three.js scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB); // Sky blue background
        sceneRef.current = scene;

        // Initialize camera
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        camera.position.set(0, 100, 200); // Higher initial position
        cameraRef.current = camera;

        // Initialize renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Add OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 10;
        controls.maxDistance = 500;
        controls.maxPolarAngle = Math.PI / 2;

        // Initialize loading manager
        const loadingManager = new THREE.LoadingManager(
            // onLoad
            () => {
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) {
                    loadingScreen.style.display = 'none';
                }
            },
            // onProgress
            (url, itemsLoaded, itemsTotal) => {
                const progressBar = document.querySelector('.progress-bar-fill');
                if (progressBar) {
                    const progress = (itemsLoaded / itemsTotal) * 100;
                    progressBar.setAttribute('style', `width: ${progress}%`);
                }
            }
        );
        loadingManagerRef.current = loadingManager;

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -200;
        directionalLight.shadow.camera.right = 200;
        directionalLight.shadow.camera.top = 200;
        directionalLight.shadow.camera.bottom = -200;
        scene.add(directionalLight);

        // Initialize environment
        const environment = new Environment(scene, loadingManager);
        environmentRef.current = environment;

        // Initialize vehicles
        const vehicles = new Vehicles(scene, loadingManager);
        vehiclesRef.current = vehicles;

        // Initialize player
        const player = new Player(scene, camera, vehicles);
        playerRef.current = player;

        // Animation loop
        const animate = (time: number) => {
            animationFrameRef.current = requestAnimationFrame(animate);

            const delta = (time - lastTimeRef.current) / 1000;
            lastTimeRef.current = time;

            if (playerRef.current) {
                playerRef.current.update(delta);
            }

            if (vehiclesRef.current) {
                vehiclesRef.current.update(delta);
            }

            renderer.render(scene, camera);
        };
        animate(0);

        // Handle window resize
        const handleResize = () => {
            if (!cameraRef.current || !rendererRef.current) return;
            
            cameraRef.current.aspect = window.innerWidth / window.innerHeight;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            containerRef.current?.removeChild(renderer.domElement);
            renderer.dispose();
        };
    }, []);

    return (
        <div>
            <div id="loading-screen">
                <div className="loading-content">
                    <h1>Pyramids of Egypt: Aliens & Dinosaurs</h1>
                    <div className="progress-bar">
                        <div className="progress-bar-fill"></div>
                    </div>
                    <p className="loading-text">Loading game assets...</p>
                </div>
            </div>
            <div id="game-ui">
                <div id="vehicle-selection">
                    <button id="select-dinosaur">Ride Dinosaur</button>
                    <button id="select-spaceship">Pilot Spaceship</button>
                    <button id="select-none">Walk</button>
                </div>
            </div>
            <div ref={containerRef} id="game-container" />
        </div>
    );
} 