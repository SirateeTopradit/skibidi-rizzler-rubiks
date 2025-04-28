"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

/**
 * Interface defining the structure for an image option.
 * @interface ImageOption
 * @property {string} label - The display name for the image.
 * @property {string} url - The URL or data URL of the image.
 */
interface ImageOption {
    label: string;
    url: string;
}

/**
 * Array of default image options available for selection.
 * Includes a "default" option with an empty URL representing no image.
 */
const defaultImages: ImageOption[] = [
    { label: "default", url: "" }, // Represents no image selected
    { label: "Brr Brr Patapim", url: "/Brr_Brr_Patapim.jpg" },
    { label: "Ballerina Cappuccina", url: "/BallerinaCappuccina.jpg" },
    { label: "Cappuccino Assassino", url: "/CappuccinoAssassino.png" },
    { label: "Trippi Troppi", url: "/TrippiTroppi.jpg" },
    { label: "Tung Tung Tung Sahur", url: "/tungtungtungsahur.png" },
];

/**
 * Page component for selecting or uploading an image to be used on the Rubik's Cube.
 * Displays default images and allows users to upload their own.
 * Persists uploaded images and the selected image choice in localStorage.
 * Navigates the user to the appropriate page (challenge or sandbox) after selection.
 */
export default function SelectImagePage() {
    /** Next.js router instance for navigation. */
    const router = useRouter();
    /** State holding the list of images uploaded by the user, loaded from localStorage. */
    const [uploadedImages, setUploadedImages] = useState<ImageOption[]>([]);
    /** State holding the combined list of default and uploaded images. */
    const [allImages, setAllImages] = useState<ImageOption[]>(defaultImages);
    /** State controlling the visibility of the image upload modal. */
    const [showUploadModal, setShowUploadModal] = useState(false);
    /** State holding the name entered for a new image being uploaded. */
    const [newImageName, setNewImageName] = useState("");
    /** State holding the data URL of the new image being uploaded. */
    const [newImageDataUrl, setNewImageDataUrl] = useState("");

    /**
     * Effect hook to load previously uploaded images from localStorage when the component mounts.
     * Includes error handling for potentially corrupted data.
     */
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
            setUploadedImages([]); // Reset to empty array if parsing fails
            localStorage.setItem("rubiksUploadedImages", "[]"); // Clear potentially invalid data
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    /**
     * Effect hook to combine the default images with the loaded uploaded images.
     * Updates the `allImages` state whenever `uploadedImages` changes.
     */
    useEffect(() => {
        setAllImages([...defaultImages, ...uploadedImages]);
    }, [uploadedImages]); // Dependency ensures this runs when uploaded images are loaded or updated

    /**
     * Handles the selection of an image card.
     * Saves the selected image URL to localStorage under "rubiksImage".
     * Reads the intended destination page ("rubiksDestination") from localStorage (defaulting to '/challenge').
     * Navigates the user to the destination page.
     * @param {string} imageUrl - The URL of the selected image.
     */
    const handleImageSelect = (imageUrl: string) => {
        console.log("Image card clicked:", imageUrl);
        localStorage.setItem("rubiksImage", imageUrl);
        // Determine the next page based on where the user came from (or default)
        const destination =
            localStorage.getItem("rubiksDestination") || "/challenge"; // Default to challenge mode
        console.log("Navigating to:", destination);
        router.push(destination); // Navigate to the determined page
    };

    /** Opens the image upload modal. */
    const handleUploadClick = () => setShowUploadModal(true);

    /**
     * Handles the file input change event for the upload modal.
     * Reads the selected file and converts it to a data URL.
     * @param {React.ChangeEvent<HTMLInputElement>} e - The file input change event.
     */
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            // Set the data URL in state once the file is read
            reader.onload = () => setNewImageDataUrl(reader.result as string);
            reader.readAsDataURL(e.target.files[0]); // Start reading the file
        }
    };

    /** Closes the upload modal and resets its state. */
    const handleModalCancel = () => {
        setShowUploadModal(false);
        setNewImageName(""); // Clear the name input
        setNewImageDataUrl(""); // Clear the image data
    };

    /**
     * Handles the confirmation ("OK") action in the upload modal.
     * Adds the new image (name and data URL) to the `uploadedImages` state.
     * Persists the updated list of uploaded images to localStorage.
     * Closes the modal.
     */
    const handleModalOk = () => {
        // Ensure both name and image data are present
        if (!newImageName || !newImageDataUrl) return;
        const newImage = { label: newImageName, url: newImageDataUrl };
        const updatedUploaded = [...uploadedImages, newImage]; // Create updated list
        setUploadedImages(updatedUploaded); // Update state
        // Save the updated list to localStorage
        localStorage.setItem(
            "rubiksUploadedImages",
            JSON.stringify(updatedUploaded)
        );
        handleModalCancel(); // Close the modal and reset state
    };

    

    return (
        // Main container with gradient background and padding
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white p-8">
            {/* Back button positioned at the top-left */}
            <div className="absolute top-4 left-4 z-10 flex space-x-2">
                <button
                    onClick={() => router.push('/')} // Navigate to home page
                    className="px-3 py-1 bg-gray-500 text-white rounded"
                >
                    Back
                </button>
            </div>
            {/* Page title */}
            <h1 className="text-4xl font-bold text-center mb-12 lilita-one-regular">
                Select Your Cube Image
            </h1>
            {/* Grid layout for image cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* Upload button card */}
                <div
                    className="bg-gray-700 rounded-lg shadow-lg flex items-center justify-center h-48 sm:h-56 cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-xl"
                    onClick={handleUploadClick} // Opens the upload modal
                >
                    <span className="text-xl">+ Upload</span>
                </div>
                {/* Map through all available images (default + uploaded) */}
                {allImages.map((image) => (
                    <div
                        key={image.url + image.label} // Unique key combining URL and label
                        className="bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-xl flex flex-col"
                        onClick={() => handleImageSelect(image.url)} // Selects the image on click
                    >
                        {/* Conditional rendering for image preview */}
                        {image.url ? (
                            // Display image if URL exists
                            <div className="relative w-full h-60 sm:h-56">
                                <Image
                                    src={
                                        // Use URL directly if it's a data URL or relative path
                                        image.url.startsWith("data:")
                                            ? image.url
                                            : image.url
                                    }
                                    alt={image.label}
                                    layout="fill" // Fill the container
                                    objectFit="cover" // Cover the area, cropping if necessary
                                    className="rounded-t-lg" // Apply top rounding
                                    // Disable optimization for data URLs to prevent errors
                                    unoptimized={image.url.startsWith("data:")} 
                                />
                            </div>
                        ) : (
                            // Display placeholder if URL is empty (for the "default" option)
                            <div className="w-full h-48 sm:h-56 bg-gray-600 flex items-center justify-center">
                                <span className="text-white text-xl">No Image</span>
                            </div>
                        )}
                        {/* Image label container */}
                        <div className="p-4 text-center flex-grow flex items-center justify-center">
                            <span className="text-lg font-semibold">
                                {image.label} {/* Display image name */}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            {/* Upload Modal - Rendered conditionally based on showUploadModal state */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    {/* Modal content container */}
                    <div className="bg-gray-700 p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-2xl mb-4 text-white">
                            Upload Image
                        </h2>
                        {/* Input for image name */}
                        <input
                            type="text"
                            placeholder="Name"
                            value={newImageName}
                            onChange={(e) => setNewImageName(e.target.value)}
                            className="w-full mb-4 px-3 py-2 border rounded text-black" // Added text-black for visibility
                        />
                        {/* Input for file selection */}
                        <input
                            type="file"
                            accept="image/*" // Accept only image files
                            onChange={handleFileChange}
                            className="w-full mb-4"
                        />
                        {/* Modal action buttons */}
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={handleModalCancel} // Cancel button
                                className="px-4 py-2 bg-gray-500 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleModalOk} // OK button
                                // Disable button if name or image data is missing
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