"use client";
import React from "react";

export default function SettingsPage() {
    const handleClearUploadedImages = () => {
        localStorage.removeItem("rubiksUploadedImages");
        alert("Uploaded images data cleared");
    };
    const handleClearLeaderboard = () => {
        localStorage.removeItem("rubiksLeaderboard");
        alert("Leaderboard data cleared");
    };
    return (
        <div className="flex items-center justify-center w-screen h-screen bg-gradient-to-r from-black to-blue-950 text-white">
            <div className="bg-gray-800 p-6 rounded-lg shadow-md text-center">
                <h1 className="text-2xl font-bold mb-4">Settings</h1>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={handleClearUploadedImages}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
                    >
                        Clear Uploaded Images
                    </button>
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
