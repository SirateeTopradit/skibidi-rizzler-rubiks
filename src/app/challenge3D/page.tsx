"use client";
import React, { useEffect, useRef, useState } from "react";
import Rubiks from "../rubiks3D";
import { useRouter } from "next/navigation";

/**
 * Defines the structure for an entry in the leaderboard.
 * @typedef {object} LeaderboardEntry
 * @property {number} time - The time taken to solve the cube in seconds.
 * @property {string} date - The date the record was set (ISO string format).
 * @property {string} image - The URL of the image used on the cube face for this record.
 */
type LeaderboardEntry = { time: number; date: string; image: string };

/**
 * Renders the main Rubik's cube challenge page.
 * This component initializes the Rubik's cube visualization, manages game state (timer, image),
 * handles user interaction (back button), and displays the leaderboard specific to the selected image.
 *
 * @component
 * @returns {React.ReactElement} The rendered challenge page component.
 */
export default function Page() {
    // Ref to the container element where the Rubik's cube canvas will be mounted.
    const containerRef = useRef<HTMLDivElement>(null);
    // State to hold the Rubik's cube instance. Initialized to null until the component mounts.
    const [rubik, setRubik] = useState<Rubiks | null>(null);
    // State to store the leaderboard entries, loaded from localStorage.
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    // State to store the URL of the currently selected image for the cube face, persisted in localStorage.
    const [selectedImage, setSelectedImage] = useState<string>("");

    // Effect hook to load the leaderboard data from localStorage when the component mounts.
    // If no data is found, it initializes with an empty array.
    useEffect(() => {
        const data = localStorage.getItem("rubiksLeaderboard") || "[]";
        setLeaderboard(JSON.parse(data));
    }, []); // Empty dependency array ensures this runs only once on mount.

    // Effect hook to initialize the Rubik's cube instance when the container ref is available.
    // It ensures that the Rubik's instance is created only once.
    useEffect(() => {
        // Check if the container element exists and if the rubik instance hasn't been created yet.
        if (containerRef.current && !rubik) {
            const instance = new Rubiks(containerRef.current);
            setRubik(instance); // Store the created instance in state.
        }
        // Dependency array includes 'rubik' to prevent re-running if the instance already exists.
    }, [rubik]);

    // Effect hook to load the previously selected image from localStorage and apply it to the cube.
    // This runs whenever the 'rubik' instance becomes available.
    useEffect(() => {
        if (rubik) {
            // Retrieve the saved image URL from localStorage, defaulting to an empty string if not found.
            const saved = localStorage.getItem("rubiksImage") || "";
            if (saved) {
                setSelectedImage(saved); // Update the state with the loaded image URL.
                rubik.setImage(saved); // Apply the image to the Rubik's cube instance.
            }
        }
        // Dependency array includes 'rubik' to ensure this runs after the instance is ready.
    }, [rubik]);

    // Filters the leaderboard to show only entries matching the currently selected image.
    // This provides context-specific high scores.
    const filteredLeaderboard = leaderboard.filter(
        (entry) => entry.image === selectedImage
    );

    // useRouter hook from Next.js for programmatic navigation.
    const router = useRouter();

    return (
        // Main container for the challenge page, using flexbox for layout.
        <div
            className="w-screen h-screen relative flex"
            // Sets a specific background color for the page.
            style={{ backgroundColor: "#9e7a68" }}
        >
            {/* Container for the timer display. Positioned absolutely at the top center, behind the cube. */}
            <div className="absolute inset-0 z-0 flex items-start justify-center text-white">
                {/* Timer display element. Its content is likely updated by the Rubiks instance. */}
                <span id="timer" className="text-[7vw]">
                    00:00
                </span>
            </div>
            {/* The div element where the Rubik's cube canvas is rendered. Takes up available space. */}
            <div ref={containerRef} className="flex-grow z-1" />
            {/* Container for the 'Back' button, positioned at the top-left. */}
            <div className="absolute top-4 left-4 z-10 flex space-x-2">
                <button
                    // Navigates the user back to the image selection page.
                    onClick={() => router.push("/select-image")}
                    className="px-3 py-1 bg-gray-500 text-white rounded"
                >
                    Back
                </button>
            </div>
            {/* Conditional rendering: Display the leaderboard only if there are entries for the selected image. */}
            {filteredLeaderboard.length > 0 && (
                // Leaderboard container, positioned at the bottom-left with a semi-transparent background.
                <div className="absolute bottom-4 left-4 z-10 bg-black bg-opacity-10 text-white p-4 rounded max-h-64 overflow-auto">
                    {/* Table structure for displaying leaderboard data. */}
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-1">#</th>
                                <th className="px-1">Time</th>
                                <th className="px-1">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Map through the filtered leaderboard entries to create table rows. */}
                            {filteredLeaderboard.map((entry, i) => {
                                // Calculate minutes and seconds from the total time in seconds.
                                const mins = Math.floor(entry.time / 60);
                                const secs = Math.floor(entry.time % 60);
                                // Format the time string as MM:SS.
                                const timeStr = `${String(mins).padStart(
                                    2,
                                    "0"
                                )}:${String(secs).padStart(2, "0")}`;
                                // Format the date string using the locale's default date format.
                                const dateStr = new Date(
                                    entry.date
                                ).toLocaleDateString();

                                return (
                                    // Table row for each leaderboard entry.
                                    <tr
                                        key={i} // Using index as key, assuming the list order is stable for rendering.
                                        className="border-t border-gray-600"
                                    >
                                        {/* Display rank, formatted time, and formatted date. */}
                                        <td className="px-1">{i + 1}</td>
                                        <td className="px-1">{timeStr}</td>
                                        <td className="px-1">{dateStr}</td>
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
