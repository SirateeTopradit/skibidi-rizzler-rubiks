"use client";
import React from "react";
import { useRouter } from "next/navigation"; // Import useRouter

/**
 * Settings page component.
 * Provides options to clear data stored in localStorage, such as uploaded images and leaderboard scores.
 */
export default function SettingsPage() {
    const router = useRouter(); // Initialize router

    /**
     * Handles the action to clear the list of user-uploaded images from localStorage.
     * Displays an alert message upon completion.
     */
    const handleClearUploadedImages = () => {
        // Remove the item associated with uploaded images from localStorage.
        localStorage.removeItem("rubiksUploadedImages");
        // Notify the user that the data has been cleared.
        alert("Uploaded images data cleared");
    };

    /**
     * Handles the action to clear the leaderboard data from localStorage.
     * Displays an alert message upon completion.
     */
    const handleClearLeaderboard = () => {
        // Remove the item associated with the leaderboard from localStorage.
        localStorage.removeItem("rubiksLeaderboard");
        // Notify the user that the data has been cleared.
        alert("Leaderboard data cleared");
    };

    return (
        // Main container: Full screen, centered content, gradient background.
        <div className="flex items-center justify-center w-screen h-screen bg-gradient-to-r from-black to-blue-950 text-white">
            {/* Back button positioned at the top-left */}
            <div className="absolute top-4 left-4 z-10">
                <button
                    onClick={() => router.push("/")} // Navigate back to home page
                    className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded"
                >
                    Back
                </button>
            </div>
            {/* Settings card container: Gray background, padding, rounded corners, shadow. */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-md text-center">
                {/* Settings title */}
                <h1 className="text-2xl font-bold mb-4">Settings</h1>
                {/* Container for action buttons, centered with spacing */}
                <div className="flex justify-center space-x-4">
                    {/* Button to clear uploaded images */}
                    <button
                        onClick={handleClearUploadedImages}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
                    >
                        Clear Uploaded Images
                    </button>
                    {/* Button to clear leaderboard data */}
                    <button
                        onClick={handleClearLeaderboard}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
                    >
                        Clear Leaderboard
                    </button>
                </div>
            </div>
        </div>
    );
}
