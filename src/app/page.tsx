"use client";
import React, { useEffect, useRef, useState } from "react";
import Rubiks from "./rubiks";
export default function Page() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [rubik, setRubik] = useState<Rubiks | null>(null);
    const [materialType, setMaterialType] = useState<string>('plastic');

    useEffect(() => {
        if (containerRef.current && !rubik) {
            const instance = new Rubiks(containerRef.current);
            setRubik(instance);
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
            <div className="absolute top-4 right-4 z-10 flex space-x-2 items-center">
                <select
                    value={materialType}
                    onChange={(e) => {
                        setMaterialType(e.target.value);
                        rubik?.setMaterialType(e.target.value);
                    }}
                    className="px-2 py-1 bg-gray-800 text-white rounded"
                >
                    <option value="plastic">Plastic</option>
                    <option value="glass">Glass</option>
                    <option value="metal">Metal</option>
                    <option value="mostReflexMetal">Most Reflex Metal</option>
                    <option value="mostBright">Most Bright</option>
                    <option value="wooden">Wooden</option>
                    <option value="water">Water</option>
                    <option value="frost">Frost</option>
                </select>
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
            </div>
        </div>
    );
}
