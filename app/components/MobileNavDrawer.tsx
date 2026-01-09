"use client";

import { useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, SignOutButton } from "@clerk/nextjs";
import CustomUserButton from "@/app/components/CustomUserButton";
import HamburgerMenuIcon from "@/app/assets/icons/hamburger-menu.svg";

export default function MobileNavDrawer() {
    const [isOpen, setIsOpen] = useState(false);

    const closeDrawer = () => setIsOpen(false);

    return (
        <>
            {/* Hamburger button - separate from drawer for proper flex positioning */}
            <button
                className="btn btn-ghost btn-circle md:hidden ml-auto"
                onClick={() => setIsOpen(true)}
                aria-label="Open menu"
            >
                <HamburgerMenuIcon className="w-6 h-6" />
            </button>

            {/* Drawer overlay and sidebar */}
            <div className={`fixed inset-0 z-50 ${isOpen ? "visible" : "invisible"}`}>
                {/* Overlay */}
                <div
                    className={`absolute inset-0 bg-black transition-opacity duration-300 ${isOpen ? "opacity-50" : "opacity-0"}`}
                    onClick={closeDrawer}
                    aria-label="close sidebar"
                ></div>

                {/* Sidebar */}
                <div
                    className={`absolute left-0 top-0 h-full w-64 bg-base-200 text-base-content transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
                >
                    <div className="menu min-h-full p-4 flex flex-col">
                        {/* Top section with user button */}
                        <SignedIn>
                            <div className="mb-4 pb-4 border-b border-base-300">
                                <CustomUserButton />
                            </div>
                        </SignedIn>

                        {/* Navigation links */}
                        <ul className="flex-1 space-y-2">
                            <SignedOut>
                                <li>
                                    <Link
                                        href="/about"
                                        className="btn btn-primary btn-ghost justify-start"
                                        onClick={closeDrawer}
                                    >
                                        About
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/developers"
                                        className="btn btn-primary btn-ghost justify-start"
                                        onClick={closeDrawer}
                                    >
                                        Developers
                                    </Link>
                                </li>
                                <li>
                                    <SignInButton />
                                </li>
                                <li>
                                    <SignUpButton>
                                        <button className="btn btn-outline w-full">Sign Up</button>
                                    </SignUpButton>
                                </li>
                            </SignedOut>
                            <SignedIn>
                                <li>
                                    <Link
                                        href="/home/"
                                        className="btn btn-primary btn-ghost justify-start"
                                        onClick={closeDrawer}
                                    >
                                        Dashboard
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/home/settings"
                                        className="btn btn-primary btn-ghost justify-start"
                                        onClick={closeDrawer}
                                    >
                                        Settings
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/developers"
                                        className="btn btn-primary btn-ghost justify-start"
                                        onClick={closeDrawer}
                                    >
                                        Developers
                                    </Link>
                                </li>

                            </SignedIn>
                        </ul>

                        {/* Bottom section with log out */}
                        <SignedIn>
                            <div className="mt-auto pt-4 border-t border-base-300">
                                <SignOutButton>
                                    <button className="btn btn-primary btn-ghost w-full justify-start">
                                        Log Out
                                    </button>
                                </SignOutButton>
                            </div>
                        </SignedIn>
                    </div>
                </div>
            </div>
        </>
    );
}
