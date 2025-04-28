"use client";
import React, { useEffect, useRef, useState } from "react";
import Rubiks from "../rubiks";
import { useRouter } from "next/navigation";
// leaderboard entry type
type LeaderboardEntry = { time: number; date: string; image: string };

// Moved defaultImages outside the component to prevent re-creation on every render
// const defaultImages = [
//     { label: "Brr Brr Patapim", url: "/Brr_Brr_Patapim.jpg" },
//     { label: "Ballerina Cappuccina", url: "/BallerinaCappuccina.jpg" },
//     { label: "Cappuccino Assassino", url: "/CappuccinoAssassino.png" },
//     { label: "Trippi Troppi", url: "/TrippiTroppi.jpg" },
// ];

export default function Page() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [rubik, setRubik] = useState<Rubiks | null>(null);
    // leaderboard state
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    // selected image URL, persisted in localStorage
    const [selectedImage, setSelectedImage] = useState<string>("");
    // const [uploadedImages, setUploadedImages] = useState<
    //     { label: string; url: string }[]
    // >([]);
    // const [images, setImages] = useState(defaultImages);
    // const fileInputRef = useRef<HTMLInputElement>(null);

    // load leaderboard on mount
    useEffect(() => {
        const data = localStorage.getItem("rubiksLeaderboard") || "[]";
        setLeaderboard(JSON.parse(data));
    }, []);

    // load any previously uploaded images
    // useEffect(() => {
    //     const saved = localStorage.getItem("rubiksUploadedImages") || "[]";
    //     setUploadedImages(JSON.parse(saved));
    // }, []);
    // useEffect(() => {
    //     setImages([...defaultImages, ...uploadedImages]);
    // }, [uploadedImages]); // Removed defaultImages from dependency array as it's now constant


    useEffect(() => {
        if (containerRef.current && !rubik) {
            const instance = new Rubiks(containerRef.current);
            setRubik(instance);
        }
    }, [rubik]);
    // initialize selected image from localStorage and apply to rubik
    useEffect(() => {
        if (rubik) {
            const saved = localStorage.getItem("rubiksImage") || "";
            if (saved) {
                setSelectedImage(saved);
                rubik.setImage(saved);
            }
        }
    }, [rubik]);

    // only show entries for selected image
    const filteredLeaderboard = leaderboard.filter(
        (entry) => entry.image === selectedImage
    );

    const router = useRouter();

    return (
        <div
            className="w-screen h-screen relative flex"
            style={{ backgroundColor: "#9e7a68" }}
        >
            {/* Changed div to center the timer and place it behind other elements */}
            <div className="absolute inset-0 z-0 flex items-start justify-center text-white">
                <span id="timer" className="text-[7vw]">
                    00:00
                </span>
            </div>
            <div ref={containerRef} className="flex-grow z-1" />
            <div className="absolute top-4 left-4 z-10 flex space-x-2">
                <button
                    onClick={() => router.push('/select-image')} // Add Back button functionality
                    className="px-3 py-1 bg-gray-500 text-white rounded"
                >
                    Back
                </button>
            </div>
            {filteredLeaderboard.length > 0 && (
                <div className="absolute bottom-4 left-4 z-10 bg-black bg-opacity-10 text-white p-4 rounded max-h-64 overflow-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-1">#</th>
                                <th className="px-1">Time</th>
                                <th className="px-1">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeaderboard.map((entry, i) => {
                                const mins = Math.floor(entry.time / 60);
                                const secs = Math.floor(entry.time % 60);
                                const timeStr = `${String(mins).padStart(
                                    2,
                                    "0"
                                )}:${String(secs).padStart(2, "0")}`;
                                const dateStr = new Date(
                                    entry.date
                                ).toLocaleDateString();

                                return (
                                    <tr
                                        key={i}
                                        className="border-t border-gray-600"
                                    >
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
