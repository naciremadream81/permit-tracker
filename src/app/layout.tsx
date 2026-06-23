import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import { Shell } from "@/components/Shell";
import "./globals.css";
import "./ui.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Meridian — Permit Package Tracker",
  description:
    "Track residential permit packages across Florida counties — building, electrical, HVAC, mobile home, modular home, and shed permits.",
};

const themeInit = `try{var t=localStorage.getItem("permit-tracker-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.dataset.theme="dark"}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,600,700,800&display=swap"
        />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
