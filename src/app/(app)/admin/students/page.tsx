import { Users, Search, UserCheck, Clock } from "lucide-react";

export default function AdminStudentsPage() {
    return (
        <div className="animate-fade-in space-y-8">
            {/* Header with gradient */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-8 text-white shadow-lg">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
                <div className="relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium mb-4">
                        <Users className="w-4 h-4" />
                        Student Management
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Students</h1>
                    <p className="mt-2 text-emerald-100 max-w-lg">
                        View registered students, their activity, and performance.
                    </p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-card">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search students by name or email..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                        />
                    </div>
                    <select className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white">
                        <option>All Students</option>
                        <option>Active (last 7 days)</option>
                        <option>Inactive</option>
                    </select>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    {
                        label: "Total Students",
                        value: "0",
                        icon: Users,
                        bgLight: "bg-blue-50",
                        textColor: "text-blue-700",
                    },
                    {
                        label: "Active This Week",
                        value: "0",
                        icon: UserCheck,
                        bgLight: "bg-green-50",
                        textColor: "text-green-700",
                    },
                    {
                        label: "Avg. Attempts",
                        value: "—",
                        icon: Clock,
                        bgLight: "bg-amber-50",
                        textColor: "text-amber-700",
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white rounded-xl border border-gray-100 p-5 shadow-card hover:shadow-card-hover transition-all duration-300 group"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                <p className={`text-2xl font-bold mt-1 ${stat.textColor}`}>
                                    {stat.value}
                                </p>
                            </div>
                            <div
                                className={`w-10 h-10 rounded-xl ${stat.bgLight} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                            >
                                <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Students Table (empty state) */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <span>Student</span>
                    <span>Joined</span>
                    <span>Attempts</span>
                    <span>Avg. Score</span>
                </div>

                {/* Empty State */}
                <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">No students yet</h3>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                        Students will appear here once they sign up for the platform.
                    </p>
                </div>
            </div>
        </div>
    );
}
