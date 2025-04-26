"use client";
import Link from "next/link";
import Image from "next/image";

export default function Page() {
  return (
    <div className="relative w-screen h-screen overflow-hidden ">
      {/* พื้นหลัง */}
      <Image
        src="/img/rubik-main.jpg"
        alt="Rubik Background"
        layout="fill"
        objectFit="cover"
        className="z-0 brightness-75 blur-[3px]"
      />

      {/* ชั้นบนสุด */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white animate-fadeIn uppercase">
        {/* หัวข้อ */}
        <h1 className="text-5xl md:text-7xl font-bold mb-8 text-shadow-lg/20 italic ">
          Rubik's Challenge
        </h1>

        {/* ปุ่ม Play */}
        <Link href="/game">
          <button className="px-12 py-4 hover:scale-110 bg-gradient-to-r from-blue-950 to-indigo-950 outline-2 outline-offset-2 rounded-3xl text-2xl font-semibold shadow-lg transition-all duration-300 ">
            PLAY
          </button>
        </Link>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
