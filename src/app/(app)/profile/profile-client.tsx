"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    User,
    Lock,
    Bell,
    Save,
    Loader2,
    CheckCircle,
    AlertCircle,
    Mail,
    Phone,
    UserCircle
} from "lucide-react";
import { updateProfile, updatePassword } from "./actions";

interface ProfileClientProps {
    user: {
        id: string;
        email: string;
        name: string;
        phone: string | null;
        role: string;
    };
}

export default function ProfileClient({ user }: ProfileClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"personal" | "security" | "preferences">("personal");

    // Sync state with URL on initial load and when URL changes
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "personal" || tab === "security" || tab === "preferences") {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const switchTab = (tab: "personal" | "security" | "preferences") => {
        setActiveTab(tab);
        router.push(`/profile?tab=${tab}`, { scroll: false });
    };

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Form states
    const [name, setName] = useState(user.name);
    const [phone, setPhone] = useState(user.phone || "");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            await updateProfile({ name, phone });
            setMessage({ type: "success", text: "Profile updated successfully!" });
        } catch (err) {
            setMessage({ type: "error", text: "Failed to update profile. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match." });
            return;
        }
        if (newPassword.length < 6) {
            setMessage({ type: "error", text: "Password must be at least 6 characters." });
            return;
        }

        setLoading(true);
        setMessage(null);
        try {
            await updatePassword(newPassword);
            setMessage({ type: "success", text: "Password updated successfully!" });
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            setMessage({ type: "error", text: "Failed to update password." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
                <div className="flex flex-col md:flex-row h-full">
                    {/* Tabs Sidebar */}
                    <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-4 space-y-2">
                        <button
                            onClick={() => switchTab("personal")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "personal"
                                ? "bg-primary-600 text-white shadow-md shadow-primary-200"
                                : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            <User className="w-4 h-4" />
                            Personal Info
                        </button>
                        <button
                            onClick={() => switchTab("security")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "security"
                                ? "bg-primary-600 text-white shadow-md shadow-primary-200"
                                : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            <Lock className="w-4 h-4" />
                            Security
                        </button>
                        <button
                            onClick={() => switchTab("preferences")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "preferences"
                                ? "bg-primary-600 text-white shadow-md shadow-primary-200"
                                : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            <Bell className="w-4 h-4" />
                            Preferences
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-8">
                        {message && (
                            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-fade-in ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                                }`}>
                                {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <p className="text-sm font-medium">{message.text}</p>
                            </div>
                        )}

                        {activeTab === "personal" && (
                            <div className="animate-fade-in space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-1">Personal Information</h2>
                                    <p className="text-sm text-gray-500">Update your account details and contact information.</p>
                                </div>

                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-gray-700">Full Name</label>
                                            <div className="relative">
                                                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-gray-700">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="email"
                                                    value={user.email}
                                                    disabled
                                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    placeholder="Optional"
                                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-gray-700">Account Role</label>
                                            <div className="px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 first-letter:uppercase">
                                                {user.role}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-all shadow-md shadow-primary-200 disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === "security" && (
                            <div className="animate-fade-in space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-1">Security Settings</h2>
                                    <p className="text-sm text-gray-500">Manage your password and account security.</p>
                                </div>

                                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Min 6 characters"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-all shadow-md shadow-primary-200 disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Update Password
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === "preferences" && (
                            <div className="animate-fade-in space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-1">Account Preferences</h2>
                                    <p className="text-sm text-gray-500">Manage how you interact with the platform.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <p className="font-semibold text-gray-900">Email Notifications</p>
                                            <p className="text-xs text-gray-500">Receive weekly summaries of your performance.</p>
                                        </div>
                                        <div className="w-12 h-6 bg-primary-600 rounded-full relative cursor-pointer opacity-50">
                                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-all" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <p className="font-semibold text-gray-900">Push Notifications</p>
                                            <p className="text-xs text-gray-500">Alerts when new papers are uploaded.</p>
                                        </div>
                                        <div className="w-12 h-6 bg-gray-300 rounded-full relative cursor-not-allowed">
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
