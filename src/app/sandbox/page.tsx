"use client";
import React, { useEffect, useRef, useState } from "react";
import Rubiks from "../rubiks";
import { useRouter } from "next/navigation";

/**
 * Defines the structure for an entry in the leaderboard.
 * @typedef {object} LeaderboardEntry
 * @property {number} time - The time taken to solve the cube in seconds.
 * @property {string} date - The ISO string representation of the date when the record was set.
 * @property {string} image - The URL of the image used on the cube face for this record.
 */
type LeaderboardEntry = { time: number; date: string; image: string };

/**
 * Array of default images available for the cube face.
 * Moved outside the component to prevent re-creation on every render.
 */
const defaultImages = [
    { label: "Brr Brr Patapim", url: "/Brr_Brr_Patapim.jpg" },
    { label: "Ballerina Cappuccina", url: "/BallerinaCappuccina.jpg" },
    { label: "Cappuccino Assassino", url: "/CappuccinoAssassino.png" },
    { label: "Trippi Troppi", url: "/TrippiTroppi.jpg" },
];

/**
 * The main page component for the Rubik's Cube sandbox.
 * Handles rendering the cube, controls, image selection, uploading, and leaderboard display.
 */
export default function Page() {
    /** Ref for the container element where the Rubik's Cube canvas will be mounted. */
    const containerRef = useRef<HTMLDivElement>(null);
    /** State holding the Rubiks class instance. */
    const [rubik, setRubik] = useState<Rubiks | null>(null);
    /** State holding the leaderboard data, loaded from localStorage. */
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    /** State holding the URL of the currently selected image for the cube face, persisted in localStorage. */
    const [selectedImage, setSelectedImage] = useState<string>("");
    /** State holding images uploaded by the user, persisted in localStorage. */
    const [uploadedImages, setUploadedImages] = useState<
        { label: string; url: string }[]
    >([]);
    /** State holding the combined list of default and uploaded images for the dropdown. */
    const [images, setImages] = useState(defaultImages);
    /** Ref for the hidden file input element used for image uploads. */
    const fileInputRef = useRef<HTMLInputElement>(null);
    /** State to control the visibility of the hamburger menu. */
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    /** Next.js router instance for navigation. */
    const router = useRouter();

    /**
     * Effect hook to load the leaderboard data from localStorage when the component mounts.
     */
    useEffect(() => {
        const data = localStorage.getItem("rubiksLeaderboard") || "[]";
        setLeaderboard(JSON.parse(data));
    }, []);

    /**
     * Effect hook to load previously uploaded images from localStorage when the component mounts.
     */
    useEffect(() => {
        const saved = localStorage.getItem("rubiksUploadedImages") || "[]";
        setUploadedImages(JSON.parse(saved));
    }, []);

    /**
     * Effect hook to update the combined image list whenever uploadedImages changes.
     */
    useEffect(() => {
        setImages([...defaultImages, ...uploadedImages]);
    }, [uploadedImages]); // Removed defaultImages from dependency array as it's now constant

    /** Triggers a click on the hidden file input element. */
    const handleUploadClick = () => fileInputRef.current?.click();

    /**
     * Handles the file selection event when a user uploads an image.
     * Reads the file, converts it to a data URL, updates state, saves to localStorage,
     * and applies the image to the Rubik's cube instance.
     * @param {React.ChangeEvent<HTMLInputElement>} e - The file input change event.
     */
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return; // Exit if no file is selected
        const reader = new FileReader();
        reader.onload = () => {
            const url = reader.result as string; // Get the data URL
            const newImg = { label: file.name, url }; // Create image object
            const updated = [...uploadedImages, newImg]; // Add to uploaded images list
            setUploadedImages(updated); // Update state
            // Persist the updated list of uploaded images
            localStorage.setItem(
                "rubiksUploadedImages",
                JSON.stringify(updated)
            );
            setSelectedImage(url); // Set the newly uploaded image as selected
            localStorage.setItem("rubiksImage", url); // Persist the selected image URL
            rubik?.setImage(url); // Apply the image to the cube instance
        };
        reader.readAsDataURL(file); // Read the file as a data URL
    };

    /**
     * Effect hook to initialize the Rubiks instance when the container ref is available
     * and the instance hasn't been created yet.
     */
    useEffect(() => {
        // Ensure the container exists and the Rubik instance is not already set
        if (containerRef.current && !rubik) {
            const instance = new Rubiks(containerRef.current);
            setRubik(instance);
        }
    }, [rubik]);
    // initialize selected image from localStorage and apply to rubik
    useEffect(() => {
        if (rubik) {
            const saved = localStorage.getItem("rubiksImage") || ""; // Get saved image URL
            if (saved) {
                setSelectedImage(saved); // Set state
                rubik.setImage(saved); // Apply to cube
            }
        }
    }, [rubik]); // Run this effect when the rubik instance becomes available

    /** Filters the leaderboard to show only entries matching the currently selected image. */
    const filteredLeaderboard = leaderboard.filter(
        (entry) => entry.image === selectedImage
    );

    return (
        <div className="w-screen h-screen relative flex" style={{ backgroundColor: '#9e7a68' }}>
            {/* Changed div to center the timer and place it behind other elements */}
            <div className="absolute inset-0 z-0 flex justify-center text-white">
                <span
                    id="timer" // ID used by Rubiks class to update time
                    className="text-5xl"
                >
                    00:00 {/* Initial timer display */}
                </span>
            </div>
            {/* Container for the Rubik's cube canvas, takes up remaining space */}
            <div ref={containerRef} className="flex-grow z-1" />
            {/* Hamburger Menu Button */}
            <div className="absolute top-4 right-4 z-20">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 bg-gray-700 text-white rounded focus:outline-none"
                >
                    {/* Simple hamburger icon */}
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                    </svg>
                </button>
            </div>

            {/* Menu Panel - Conditionally rendered */}
            {isMenuOpen && (
                <div className="absolute top-16 right-4 z-10 bg-black bg-opacity-75 text-white p-4 rounded shadow-lg flex flex-col space-y-2">
                    <button
                        onClick={() => { rubik?.disorder2(); setIsMenuOpen(false); }}
                        className="px-3 py-1 bg-yellow-600 text-white rounded text-left"
                    >
                        Scramble
                    </button>
                    <button
                        onClick={() => { rubik?.disorder(); setIsMenuOpen(false); }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-left"
                    >
                        Instant Scramble
                    </button>
                    <button
                        onClick={() => { rubik?.restore(); setIsMenuOpen(false); }}
                        className="px-3 py-1 bg-green-600 text-white rounded text-left"
                    >
                        Reset
                    </button>
                    <button
                        onClick={() => { handleUploadClick(); setIsMenuOpen(false); }}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-left"
                    >
                        Upload Image
                    </button>
                    <select
                        value={selectedImage}
                        onChange={(e) => {
                            const url = e.target.value;
                            setSelectedImage(url);
                            localStorage.setItem("rubiksImage", url);
                            rubik?.setImage(url);
                            // Optionally close menu on selection: setIsMenuOpen(false);
                        }}
                        className="px-2 py-1 bg-gray-800 text-white rounded"
                    >
                        <option value="">Select Image</option>{" "}
                        {/* Default option */}
                        {/* Map through available images (default + uploaded) */}
                        {images.map((img) => (
                            <option key={img.url} value={img.url}>
                                {img.label} {/* Display image label */}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Hidden file input element - remains unchanged */}
            <input
                type="file"
                accept="image/*" // Accept only image files
                className="hidden" // Hide the default input UI
                ref={fileInputRef} // Assign ref
                onChange={handleFileChange} // Attach change handler
            />
            {/* Back button container positioned absolutely at the top-left */}
            <div className="absolute top-4 left-4 z-10 flex space-x-2">
                {/* Button to navigate back to the home page */}
                <button
                    onClick={() => router.push("/")}
                    className="px-3 py-1 bg-gray-500 text-white rounded"
                >
                    Back
                </button>
            </div>
            {/* Leaderboard table container, positioned absolutely at the bottom-left */}
            {/* Only rendered if there are entries for the selected image */}
            {filteredLeaderboard.length > 0 && (
                <div className="absolute bottom-4 left-4 z-10 bg-black bg-opacity-50 text-white p-4 rounded max-h-64 overflow-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-1">#</th>{/* Rank */}
                                <th className="px-1">Time</th>
                                <th className="px-1">Date</th>
                                <th className="px-1">Image</th>{/* Image name */}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Map through filtered leaderboard entries */}
                            {filteredLeaderboard.map((entry, i) => {
                                // Format time (MM:SS)
                                const mins = Math.floor(entry.time / 60);
                                const secs = Math.floor(entry.time % 60);
                                const timeStr = `${String(mins).padStart(
                                    2,
                                    "0"
                                )}:${String(secs).padStart(2, "0")}`;
                                // Format date (locale specific)
                                const dateStr = new Date(
                                    entry.date
                                ).toLocaleDateString();
                                // Extract image name from URL or use "Default"
                                const name =
                                    entry.image.split("/").pop() || "Default";
                                return (
                                    <tr key={i} className="border-t border-gray-600">
                                        <td className="px-1">{i + 1}</td>{/* Rank */}
                                        <td className="px-1">{timeStr}</td>
                                        <td className="px-1">{dateStr}</td>
                                        <td className="px-1">{name}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
