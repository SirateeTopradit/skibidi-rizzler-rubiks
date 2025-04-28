"use client";
import React, { useEffect, useRef, useState } from "react";
import Rubiks from "./rubiks";
export default function Page() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [rubik, setRubik] = useState<Rubiks | null>(null);
    // selected image URL, persisted in localStorage
    const [selectedImage, setSelectedImage] = useState<string>("");
    // default dropdown images
    const defaultImages = [
        { label: 'Brr Brr Patapim', url: '/Brr_Brr_Patapim.jpg' },
        { label: 'Ballerina Cappuccina', url: '/BallerinaCappuccina.jpg' },
        { label: 'Cappuccino Assassino', url: '/CappuccinoAssassino.png' },
        { label: 'Trippi Troppi', url: '/TrippiTroppi.jpg' }
    ];
    const [uploadedImages, setUploadedImages] = useState<{ label: string; url: string }[]>([]);
    const [images, setImages] = useState(defaultImages);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // load any previously uploaded images
    useEffect(() => {
        const saved = localStorage.getItem('rubiksUploadedImages') || '[]';
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
            localStorage.setItem('rubiksUploadedImages', JSON.stringify(updated));
            setSelectedImage(url);
            localStorage.setItem('rubiksImage', url);
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
            const saved = localStorage.getItem('rubiksImage') || '';
            if (saved) {
                setSelectedImage(saved);
                rubik.setImage(saved);
            }
        }
    }, [rubik]);
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
                <button onClick={handleUploadClick} className="px-3 py-1 bg-gray-600 text-white rounded">
                    Upload Image
                </button>
                <select
                    value={selectedImage}
                    onChange={e => {
                        const url = e.target.value;
                        setSelectedImage(url);
                        localStorage.setItem('rubiksImage', url);
                        rubik?.setImage(url);
                    }}
                    className="px-2 py-1 bg-black bg-opacity-50 text-white rounded"
                >
                    <option value="">Select Image</option>
                    {images.map(img => (
                        <option key={img.url} value={img.url}>{img.label}</option>
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
        </div>
    );
}
