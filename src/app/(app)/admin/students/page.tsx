import { Users, UserCheck, Shield, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import StudentTable from "./StudentTable";

export default async function AdminStudentsPage() {
    const supabase = await createClient();

    // Fetch all users
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching students:", error);
    }

    // Stats calculations
    const totalUsers = users?.length || 0;
    const adminCount = users?.filter(u => u.role === "admin").length || 0;
    const studentCount = totalUsers - adminCount;

    return (
        <div className="animate-fade-in space-y-12 pb-20 max-w-7xl mx-auto">
            {/* Header Hero */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gray-900 border border-white/5 p-12 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                            <Shield className="w-3.5 h-3.5" />
                            Security Clearance Level 04
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none italic">
                            Personnel <span className="text-emerald-500 italic">Registry.</span>
                        </h1>
                        <p className="text-gray-400 font-medium max-w-md">
                            Manage access levels, monitor user distribution, and oversee platform hierarchy.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 text-center px-8">
                            <p className="text-3xl font-black italic mb-1">{totalUsers}</p>
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Total Nodes</p>
                        </div>
                        <div className="bg-emerald-500/10 backdrop-blur-xl p-6 rounded-[2rem] border border-emerald-500/20 text-center px-8">
                            <p className="text-3xl font-black italic mb-1 text-emerald-400">{adminCount}</p>
                            <p className="text-[10px] font-black text-emerald-400/50 uppercase tracking-[0.2em]">Administrators</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                    { label: "Active Students", value: studentCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Verified Admins", value: adminCount, icon: Shield, color: "text-primary-600", bg: "bg-primary-50" },
                    { label: "Growth Rate", value: "+12%", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/20 group hover:border-primary-100 transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className={`text-4xl font-black italic tracking-tighter ${stat.color}`}>{stat.value}</p>
                            </div>
                            <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <stat.icon className={`w-7 h-7 ${stat.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Interactive Section */}
            <StudentTable users={users || []} />
        </div>
    );
}
