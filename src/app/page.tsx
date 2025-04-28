"use client";
import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";

/**
 * Renders a stylized planet 3D model loaded from a GLTF file.
 * Applies a continuous rotation animation around the Y-axis.
 * @returns {JSX.Element} A primitive object containing the loaded 3D scene.
 */
function StylizedPlanet() {
    // Load the GLTF model for the planet.
    const gltf = useGLTF("/stylized_planet/scene.gltf");
    // Scale the planet model up.
    gltf.scene.scale.set(2, 2, 2);
    // useFrame hook runs on every frame, animating the planet's rotation.
    useFrame((state, delta) => {
        // Rotate the planet around the Y-axis based on the time delta.
        gltf.scene.rotation.y += delta * 0.2;
    });
    // Return the loaded and scaled scene as a primitive object.
    return <primitive object={gltf.scene} />;
}

/**
 * The main landing page component for the application.
 * Displays the application title, navigation links (Challenge, Sandbox, Settings),
 * and a 3D rendering of a stylized planet (visible on medium screens and larger).
 * @returns {JSX.Element} The JSX for the landing page.
 */
export default function LandingPage() {
    return (
        // Main container using flexbox, responsive direction, full height, and gradient background.
        <div className="flex flex-col md:flex-row h-screen bg-gradient-to-r from-black to-blue-950">
            {/* Navigation section: Takes half width on medium screens, centered content. */}
            <nav className="text-white p-6 md:w-1/2 flex flex-col items-center justify-center h-full text-center">
                {/* Application title with styling and text shadow. */}
                <h1 className="text-4xl md:text-6xl font-bold mb-8 [text-shadow:_-3px_-3px_0_#2563eb,_3px_-3px_0_#2563eb,_-3px_3px_0_#2563eb,_3px_3px_0_#2563eb]">
                    Skibidi Rizzler Rubiks
                </h1>
                {/* Navigation links list. */}
                <ul className="flex flex-col items-center space-y-4 text-4xl">
                    <li>
                        {/* Link to the image selection page (leading to Challenge mode). */}
                        <a
                            href="/select-image"
                            className=" hover:text-blue-300"
                        >
                            Challenge
                        </a>
                    </li>
                    <li>
                        {/* Link to the Sandbox mode page. */}
                        <a href="/sandbox" className=" hover:text-blue-300">
                            Sandbox
                        </a>
                    </li>
                    <li>
                        {/* Link to the Settings page. */}
                        <a href="/settings" className=" hover:text-blue-300">
                            Settings
                        </a>
                    </li>
                </ul>
            </nav>

            {/* 3D scene container: Takes remaining space, hidden on small screens (md:block). */}
            <div className="flex-grow hidden md:block">
                {/* React Three Fiber Canvas for rendering the 3D scene. */}
                <Canvas camera={{ fov: 45, position: [0, 0, 5] }}>
                    {/* Ambient light provides basic illumination. */}
                    <ambientLight intensity={0.5} />
                    {/* Directional light simulates a light source like the sun. */}
                    <directionalLight position={[5, 5, 5]} />
                    {/* Render the StylizedPlanet component. */}
                    <StylizedPlanet />
                    {/* OrbitControls allow the user to rotate and zoom the camera around the planet. */}
                    <OrbitControls
                        enablePan={false} // Disable panning.
                        minDistance={2} // Set minimum zoom distance.
                        maxDistance={10} // Set maximum zoom distance.
                    />
                </Canvas>
            </div>
        </div>
    );
}
