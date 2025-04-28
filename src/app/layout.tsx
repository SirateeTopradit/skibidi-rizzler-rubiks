import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "skibidi-rizzler-rubiks",
  description: "skibidi-rizzler-rubiks",

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`lilita-one-regular antialiased`}>
        {children}
      </body>
    </html>
  );
}
