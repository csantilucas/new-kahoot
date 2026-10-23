import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { YoutubeAudioPlayer } from "@/components/youtube-audio-player";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Revisão TV - Simulados & Apresentação",
  description: "Plataforma de simulados e revisões para apresentação em tela/TV",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={cn("h-full antialiased font-sans", geist.variable)}>
      <body className="min-h-full bg-background text-foreground flex flex-col">
        {children}
        <YoutubeAudioPlayer />
      </body>
    </html>
  );
}
