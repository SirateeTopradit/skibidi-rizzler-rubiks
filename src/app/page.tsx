"use client";
import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";

function StylizedPlanet() {
    const gltf = useGLTF("/stylized_planet/scene.gltf");
    gltf.scene.scale.set(2, 2, 2);
    useFrame((state, delta) => {
        gltf.scene.rotation.y += delta * 0.2;
    });
    return <primitive object={gltf.scene} />;
}

export default function LandingPage() {
    return (
        <div className="flex flex-col md:flex-row h-screen bg-gradient-to-r from-black to-blue-950">
            {/* Sidebar navigation - Center content */}
            <nav className="text-white p-6 md:w-1/2 flex flex-col items-center justify-center h-full">
                <h1 className="text-6xl font-bold mb-8 [text-shadow:_-3px_-3px_0_#2563eb,_3px_-3px_0_#2563eb,_-3px_3px_0_#2563eb,_3px_3px_0_#2563eb]">
                    Skibidi Rizzler Rubiks
                </h1>
                <ul className="flex flex-col items-center space-y-4 text-4xl">
                    <li>
                        <a
                            href="/select-image"
                            className=" hover:text-blue-300"
                        >
                            Challenge
                        </a>
                    </li>
                    <li>
                        <a
                            href="/sandbox"
                            className=" hover:text-blue-300"
                        >
                            Sandbox
                        </a>
                    </li>
                    <li>
                        <a
                            href="/settings"
                            className=" hover:text-blue-300"
                        >
                            Settings
                        </a>
                    </li>
                </ul>
            </nav>

            {/* 3D scene, hidden on small screens */}
            <div className="flex-grow hidden md:block">
                <Canvas camera={{ fov: 45, position: [0, 0, 5] }}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 5, 5]} />
                    <StylizedPlanet />
                    <OrbitControls
                        enablePan={false}
                        minDistance={2}
                        maxDistance={10}
                    />
                </Canvas>
            </div>
        </div>
    );
}
