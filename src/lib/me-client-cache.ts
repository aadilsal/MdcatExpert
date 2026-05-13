type MeRow = { name: string; email: string; role: string };

let meCache: { value: MeRow; at: number } | null = null;
const TTL_MS = 8000;

/** Short-lived dedupe for client layout profile fetch (reduces double-fetch on nav). */
export async function fetchMeCached(): Promise<MeRow | null> {
    if (meCache && Date.now() - meCache.at < TTL_MS) {
        return meCache.value;
    }
    try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
            meCache = null;
            return null;
        }
        const payload = await response.json();
        if (!payload?.user) {
            meCache = null;
            return null;
        }
        const value: MeRow = {
            name: payload.user.name || "Student",
            email: payload.user.email || "",
            role: payload.user.role || "student",
        };
        meCache = { value, at: Date.now() };
        return value;
    } catch {
        return null;
    }
}

export function clearMeClientCache() {
    meCache = null;
}
