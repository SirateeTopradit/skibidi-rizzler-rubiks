"use client";
import React, { useState, useEffect } from "react";

export default function SettingsPage() {
    const [isGyroEnabled, setIsGyroEnabled] = useState(false);

    // Load gyro setting on mount
    useEffect(() => {
        const savedGyroSetting = localStorage.getItem("rubiksGyroEnabled");
        setIsGyroEnabled(savedGyroSetting === "true");
    }, []);

    const handleClearUploadedImages = () => {
        localStorage.removeItem("rubiksUploadedImages");
        alert("Uploaded images data cleared");
    };
    const handleClearLeaderboard = () => {
        localStorage.removeItem("rubiksLeaderboard");
        alert("Leaderboard data cleared");
    };

    const handleToggleGyro = () => {
        const newState = !isGyroEnabled;
        setIsGyroEnabled(newState);
        localStorage.setItem("rubiksGyroEnabled", String(newState));
        // Optional: Provide feedback, maybe not an alert for a toggle
        // console.log(`Gyroscope control ${newState ? "enabled" : "disabled"}`);
    };

    return (
        <div className="flex items-center justify-center w-screen h-screen bg-gradient-to-r from-black to-blue-950 text-white">
            <div className="bg-gray-800 p-6 rounded-lg shadow-md text-center">
                <h1 className="text-2xl font-bold mb-4">Settings</h1>
                <div className="flex flex-col space-y-4">
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


                    <div className="flex items-center justify-center space-x-3">
                        <span className="text-sm font-medium">
                            Gyroscope Control
                        </span>
                        <button
                            onClick={handleToggleGyro}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none ${
                                isGyroEnabled ? "bg-green-500" : "bg-gray-600"
                            }`}
                            aria-pressed={isGyroEnabled}
                        >
                            <span className="sr-only">Enable Gyroscope</span>
                            <span
                                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                                    isGyroEnabled
                                        ? "translate-x-6"
                                        : "translate-x-1"
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
