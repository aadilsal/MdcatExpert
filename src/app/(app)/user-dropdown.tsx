"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
    User,
    Settings,
    LogOut,
    ChevronUp,
    Shield,
} from "lucide-react";
import SignOutButton from "@/components/sign-out-button";

interface UserDropdownProps {
    user: {
        name: string;
        email: string;
        role: string;
    };
}

export default function UserDropdown({ user }: UserDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get initials for avatar
    const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* User Profile Trigger - Hover/Click */}
            <button
                onMouseEnter={() => setIsOpen(true)}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200 ${isOpen ? "bg-gray-100 shadow-sm" : "hover:bg-gray-50"
                    }`}
            >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                    {initials}
                </div>
                <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider truncate flex items-center gap-1">
                        {user.role === "admin" && <Shield className="w-2.5 h-2.5 text-primary-500" />}
                        {user.role}
                    </p>
                </div>
                <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-0" : "rotate-180"}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    onMouseLeave={() => setIsOpen(false)}
                    className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-2 animate-slide-up-fade z-[60]"
                >
                    <div className="px-3 py-2 border-b border-gray-50 mb-1">
                        <p className="text-xs text-gray-400 font-medium truncate">{user.email}</p>
                    </div>

                    <div className="space-y-1">
                        <Link
                            href="/profile?tab=personal"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                            <User className="w-4 h-4" />
                            My Profile
                        </Link>
                        <Link
                            href="/profile?tab=security"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            Settings
                        </Link>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-50">
                        <SignOutButton />
                    </div>
                </div>
            )}
        </div>
    );
}
