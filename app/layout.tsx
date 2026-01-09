import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import CustomUserButton from "@/app/components/CustomUserButton";
import MobileNavDrawer from "@/app/components/MobileNavDrawer";

const montserratFont = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Screenie",
  description: "Manage screen time across all devices",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Screenie",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  themeColor: "#CD0B6F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${montserratFont.className} antialiased text-fieldvaluesmall overflow-x-hidden`}
        >
          <header className="bg-primary w-full text-white flex flex-row justify-between items-center p-4 gap-4 h-16">
            <div className="flex flex-row gap-2 sm:gap-2 items-center">
              <img src="/screenie-logo@3x.png" alt="Screenie Logo" width={32} height={32} />
              <Link href="/about" className="text-2xl font-bold">
                Screenie
              </Link>
            </div>
            <div className="navlinks ml-auto hidden md:flex flex-row gap-2">
              <SignedOut>
                <Link href="/about" className="btn btn-md btn-primary-content btn-ghost font-medium">About</Link>
                <Link href="/get-device" className="btn btn-md btn-primary-content btn-ghost font-medium">Get a Screenie</Link>
                <Link href="/developers" className="btn btn-md btn-primary-content btn-ghost font-medium">Developers</Link>
                <SignInButton />
                <SignUpButton>
                  <button className="btn btn-outline">
                    Sign Up
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <div className="ml-auto flex flex-row gap-2" >
                  <Link href="/about" className="btn btn-md btn-primary-content btn-ghost font-medium">About</Link>
                  <Link href="/get-device" className="btn btn-md btn-primary-content btn-ghost font-medium">Get a Screenie</Link>
                  <Link href="/developers" className="btn btn-md btn-primary-content btn-ghost font-medium">Developers</Link>
                  <Link href="/home/" className="btn btn-md btn-primary-content btn-ghost font-medium">Dashboard</Link>
                  <CustomUserButton />
                </div>
              </SignedIn>
            </div>
            <MobileNavDrawer />
          </header>

          {/* MAIN WRAPPER CONTAINER - MAXES OUT AT 1200PX WIDTH */}
          <div className="max-w-5xl mx-auto w-full">

            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
