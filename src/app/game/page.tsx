"use client";
import React, { useEffect, useRef, useState } from "react";
import Rubiks from "../rubiks";
export default function Page() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [rubik, setRubik] = useState<Rubiks | null>(null);

    useEffect(() => {
        if (!rubik && containerRef.current && containerRef.current.children.length === 0) {
            const instance = new Rubiks(containerRef.current);
            setRubik(instance);
        }
    }, [rubik]);
    
    return (
        <div className="w-screen h-screen relative flex">
            <div className="absolute top-4 left-4 z-10 flex space-x-4 items-center text-white">
                <span
                    id="timer"
                    className="bg-black bg-opacity-50 px-5 py-2 rounded-3xl text-xl font-bold"
                >
                    00:00
                </span>
                <span
                    id="finish"
                    className="bg-black bg-opacity-50 px-5 py-2 rounded-3xl text-xl font-bold"
                >
                    😽
                </span>
            </div>
            <div ref={containerRef} className="flex-grow" />
            <div className="absolute top-4 right-4 z-10 flex space-x-2">
                <button
                    onClick={() => rubik?.disorder2()}
                    className="bg-green-500 text-white font-bold py-2 px-4 border-b-4 border-green-700 rounded-3xl hover:scale-110"
                >
                    Start
                </button>
                <button
                    onClick={() => rubik?.restore()}
                    className="bg-red-500 text-white font-bold py-2 px-4 border-b-4 border-red-700 rounded-3xl hover:scale-110"
                >
                    Reset
                </button>
            </div>
        </div>
    );
}
