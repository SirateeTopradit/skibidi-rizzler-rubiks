"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface ImageOption {
    label: string;
    url: string;
}

const defaultImages: ImageOption[] = [
    { label: "default", url: "" },
    { label: "Brr Brr Patapim", url: "/Brr_Brr_Patapim.jpg" },
    { label: "Ballerina Cappuccina", url: "/BallerinaCappuccina.jpg" },
    { label: "Cappuccino Assassino", url: "/CappuccinoAssassino.png" },
    { label: "Trippi Troppi", url: "/TrippiTroppi.jpg" },
    { label: "Tung Tung Tung Sahur", url: "/tungtungtungsahur.png" },
];

export default function SelectImagePage() {
    const router = useRouter();
    const [uploadedImages, setUploadedImages] = useState<ImageOption[]>([]);
    const [allImages, setAllImages] = useState<ImageOption[]>(defaultImages);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [newImageName, setNewImageName] = useState("");
    const [newImageDataUrl, setNewImageDataUrl] = useState("");

    // Load uploaded images from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("rubiksUploadedImages") || "[]";
        try {
            const parsedImages: ImageOption[] = JSON.parse(saved);
            setUploadedImages(parsedImages);
        } catch (error) {
            console.error(
                "Failed to parse uploaded images from localStorage:",
                error
            );
            setUploadedImages([]); // Reset if parsing fails
            localStorage.setItem("rubiksUploadedImages", "[]"); // Clear invalid data
        }
    }, []);

    // Combine default and uploaded images
    useEffect(() => {
        setAllImages([...defaultImages, ...uploadedImages]);
    }, [uploadedImages]); // Remove defaultImages from dependency array

    const handleImageSelect = (imageUrl: string) => {
        console.log("Image card clicked:", imageUrl);
        localStorage.setItem("rubiksImage", imageUrl);
        // Read the intended destination from localStorage
        const destination =
            localStorage.getItem("rubiksDestination") || "/challenge"; // Default to challenge if not set
        console.log("Navigating to:", destination);
        router.push(destination);
    };

    const handleUploadClick = () => setShowUploadModal(true);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = () => setNewImageDataUrl(reader.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    const handleModalCancel = () => {
        setShowUploadModal(false);
        setNewImageName("");
        setNewImageDataUrl("");
    };
    const handleModalOk = () => {
        if (!newImageName || !newImageDataUrl) return;
        const newImage = { label: newImageName, url: newImageDataUrl };
        const updatedUploaded = [...uploadedImages, newImage];
        setUploadedImages(updatedUploaded);
        localStorage.setItem(
            "rubiksUploadedImages",
            JSON.stringify(updatedUploaded)
        );
        handleModalCancel();
    };

    

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white p-8">
            <div className="absolute top-4 left-4 z-10 flex space-x-2">
                <button
                    onClick={() => router.push('/')}
                    className="px-3 py-1 bg-gray-500 text-white rounded"
                >
                    Back
                </button>
            </div>
            <h1 className="text-4xl font-bold text-center mb-12 lilita-one-regular">
                Select Your Cube Image
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div
                    className="bg-gray-700 rounded-lg shadow-lg flex items-center justify-center h-48 sm:h-56 cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-xl"
                    onClick={handleUploadClick}
                >
                    <span className="text-xl">+ Upload</span>
                </div>
                {allImages.map((image) => (
                    <div
                        key={image.url + image.label}
                        className="bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-xl flex flex-col"
                        onClick={() => handleImageSelect(image.url)}
                    >
                        {image.url ? (
                            <div className="relative w-full h-60 sm:h-56">
                                <Image
                                    src={
                                        image.url.startsWith("data:")
                                            ? image.url
                                            : image.url
                                    }
                                    alt={image.label}
                                    layout="fill"
                                    objectFit="cover"
                                    className="rounded-t-lg"
                                    unoptimized={image.url.startsWith("data:")}
                                />
                            </div>
                        ) : (
                            <div className="w-full h-48 sm:h-56 bg-gray-600 flex items-center justify-center">
                                <span className="text-white text-xl">No Image</span>
                            </div>
                        )}
                        <div className="p-4 text-center flex-grow flex items-center justify-center">
                            <span className="text-lg font-semibold">
                                {image.label}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-gray-700 p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-2xl mb-4 text-white">
                            Upload Image
                        </h2>
                        <input
                            type="text"
                            placeholder="Name"
                            value={newImageName}
                            onChange={(e) => setNewImageName(e.target.value)}
                            className="w-full mb-4 px-3 py-2 border rounded"
                        />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="w-full mb-4"
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={handleModalCancel}
                                className="px-4 py-2 bg-gray-500 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleModalOk}
                                disabled={!newImageName || !newImageDataUrl}
                                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
