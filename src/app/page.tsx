"use client";
import React, { useEffect, useRef, useState } from "react";
import Rubiks from "./rubiks";
export default function Page() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [rubik, setRubik] = useState<Rubiks | null>(null);

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
            </div>
        </div>
    );
}
