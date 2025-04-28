"use client";
import React from "react";
import Link from "next/link";
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
        <div className="flex flex-col md:flex-row h-screen bg-gradient-to-r from-black to-blue-900">
            {/* Sidebar navigation */}
            <nav className=" text-white p-6 md:w-1/4">
                <ul className="flex flex-row md:flex-col justify-around md:justify-start space-x-4 md:space-x-0 md:space-y-4">
                    <li>
                        <Link href="/challenge" className="hover:text-blue-300">
                            Challenge
                        </Link>
                    </li>
                    <li>
                        <Link href="/sandbox" className="hover:text-blue-300">
                            Sandbox
                        </Link>
                    </li>
                    <li>
                        <Link href="/settings" className="hover:text-blue-300">
                            Settings
                        </Link>
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
