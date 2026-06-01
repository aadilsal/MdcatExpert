import type { FunctionReturnType } from "convex/server";
import type { api } from "../../../../../convex/_generated/api";

export type AdminDashboardData = FunctionReturnType<typeof api.adminAnalytics.getAdminDashboard>;
