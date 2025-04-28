"use client";
import React, { useEffect, useRef, useState } from "react";
import Rubiks from "../rubiks"
// leaderboard entry type
type LeaderboardEntry = { time: number; date: string; image: string };
export default function Page() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [rubik, setRubik] = useState<Rubiks | null>(null);
    // leaderboard state
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    // selected image URL, persisted in localStorage
    const [selectedImage, setSelectedImage] = useState<string>("");
    // default dropdown images

    // load leaderboard on mount
    useEffect(() => {
        const data = localStorage.getItem("rubiksLeaderboard") || "[]";
        setLeaderboard(JSON.parse(data));
    }, []);
    const defaultImages = [
        { label: "Brr Brr Patapim", url: "/Brr_Brr_Patapim.jpg" },
        { label: "Ballerina Cappuccina", url: "/BallerinaCappuccina.jpg" },
        { label: "Cappuccino Assassino", url: "/CappuccinoAssassino.png" },
        { label: "Trippi Troppi", url: "/TrippiTroppi.jpg" },
    ];
    const [uploadedImages, setUploadedImages] = useState<
        { label: string; url: string }[]
    >([]);
    const [images, setImages] = useState(defaultImages);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // load any previously uploaded images
    useEffect(() => {
        const saved = localStorage.getItem("rubiksUploadedImages") || "[]";
        setUploadedImages(JSON.parse(saved));
    }, []);
    useEffect(() => {
        setImages([...defaultImages, ...uploadedImages]);
    }, [uploadedImages]);

    const handleUploadClick = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const url = reader.result as string;
            const newImg = { label: file.name, url };
            const updated = [...uploadedImages, newImg];
            setUploadedImages(updated);
            localStorage.setItem(
                "rubiksUploadedImages",
                JSON.stringify(updated)
            );
            setSelectedImage(url);
            localStorage.setItem("rubiksImage", url);
            rubik?.setImage(url);
        };
        reader.readAsDataURL(file);
    };

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

    return (
        <div className="w-screen h-screen relative flex">
            <div className="absolute top-4 left-4 z-10 flex space-x-4 items-center text-white">
                <span
                    id="timer"
                    className="bg-black bg-opacity-50 px-2 rounded"
                >
                    00:00
                </span>
                <span
                    id="finish"
                    className="bg-black bg-opacity-50 px-2 rounded"
                >
                    😽
                </span>
            </div>
            <div ref={containerRef} className="flex-grow" />
            <div className="absolute top-4 right-4 z-10 flex space-x-2">
                <button
                    onClick={() => rubik?.disorder2()}
                    className="px-3 py-1 bg-yellow-600 text-white rounded"
                >
                    test
                </button>
                <button
                    onClick={() => rubik?.disorder()}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                >
                    tungtungtungsahurr
                </button>
                <button
                    onClick={() => rubik?.disorder()}
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                    Start
                </button>
                <button
                    onClick={() => rubik?.restore()}
                    className="px-3 py-1 bg-green-600 text-white rounded"
                >
                    Reset
                </button>
                <button
                    onClick={handleUploadClick}
                    className="px-3 py-1 bg-gray-600 text-white rounded"
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
                    }}
                    className="px-2 py-1 bg-black bg-opacity-50 text-white rounded"
                >
                    <option value="">Select Image</option>
                    {images.map((img) => (
                        <option key={img.url} value={img.url}>
                            {img.label}
                        </option>
                    ))}
                </select>
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
            </div>
            {/* leaderboard table */}
            {filteredLeaderboard.length > 0 && (
                <div className="absolute bottom-4 left-4 z-10 bg-black bg-opacity-50 text-white p-4 rounded max-h-64 overflow-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-1">#</th>
                                <th className="px-1">Time</th>
                                <th className="px-1">Date</th>
                                <th className="px-1">Image</th>
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
                                const name =
                                    entry.image.split("/").pop() || "Default";
                                return (
                                    <tr
                                        key={i}
                                        className="border-t border-gray-600"
                                    >
                                        <td className="px-1">{i + 1}</td>
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
