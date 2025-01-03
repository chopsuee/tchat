'use client'
import Image from "next/image";
import ChatSystem from "./chat/page";
export default function Home() {
return(
  <main className="w-full">
    <ChatSystem />
  </main>
);
}
