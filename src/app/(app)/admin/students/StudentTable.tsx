"use client";

import { useState } from "react";
import { Users, Search, Mail, Calendar, Shield, ShieldCheck, Loader2 } from "lucide-react";
import { updateUserRoleAction } from "./actions";

interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: "student" | "admin";
    created_at: string;
}

interface StudentTableProps {
    users: UserProfile[];
}

export default function StudentTable({ users }: StudentTableProps) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());

        if (filter === "admin") return matchesSearch && u.role === "admin";
        if (filter === "student") return matchesSearch && u.role === "student";
        return matchesSearch;
    });

    const handleRoleChange = async (userId: string, currentRole: string) => {
        const newRole = currentRole === "admin" ? "student" : "admin";
        if (!confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) return;

        setUpdatingUserId(userId);
        try {
            await updateUserRoleAction(userId, newRole as "student" | "admin");
        } catch (error) {
            alert("Failed to update role. Please check your permissions.");
        } finally {
            setUpdatingUserId(userId === updatingUserId ? null : updatingUserId);
            // Revalidation will handle the UI update
            setUpdatingUserId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-xl shadow-gray-200/20">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search students by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:bg-white focus:border-primary-500 transition-all font-bold italic"
                        />
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-gray-700 font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:bg-white focus:border-primary-500 transition-all appearance-none"
                    >
                        <option value="all">All Users</option>
                        <option value="student">Students Only</option>
                        <option value="admin">Admins Only</option>
                    </select>
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined Date</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Current Role</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${user.role === "admin"
                                                        ? "bg-primary-50 text-primary-600"
                                                        : "bg-emerald-50 text-emerald-600"
                                                    }`}>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 group-hover:text-primary-600 transition-colors tracking-tight">{user.name}</p>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                                                        <Mail className="w-3 h-3" />
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-sm text-gray-500 font-bold italic">
                                                <Calendar className="w-4 h-4 opacity-50" />
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${user.role === "admin"
                                                        ? "bg-primary-50 border-primary-200 text-primary-600"
                                                        : "bg-emerald-50 border-emerald-200 text-emerald-600"
                                                    }`}>
                                                    {user.role === "admin" ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3 opacity-50" />}
                                                    {user.role}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => handleRoleChange(user.id, user.role)}
                                                disabled={updatingUserId === user.id}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${user.role === "admin"
                                                        ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                                        : "bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/20"
                                                    } disabled:opacity-50`}
                                            >
                                                {updatingUserId === user.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                                                ) : (
                                                    user.role === "admin" ? "Demote to Student" : "Promote to Admin"
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-50">
                                            <Users className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <h3 className="font-black text-gray-900 tracking-tight italic">No users matching search.</h3>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Refine your query and execute again</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
