"use client";

import { useEffect, useState } from "react";

interface AdUnitProps {
    slot?: string;
    format?: "auto" | "rectangle" | "horizontal" | "vertical";
    responsive?: boolean;
}

export default function AdUnit({ slot = "default-slot", format = "auto", responsive = true }: AdUnitProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        // Load AdSense script dynamically if not already loaded
        if (typeof window !== "undefined") {
            try {
                const adsbygoogle = (window as any).adsbygoogle || [];
                adsbygoogle.push({});
            } catch (e) {
                console.warn("AdSense script load deferred:", e);
            }
        }
    }, []);

    if (!isClient) return null;

    return (
        <div className="my-6 mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/30 p-4 text-center">
            {/* Real AdSense Slot */}
            <ins
                className="adsbygoogle block"
                style={{ display: "block", textAlign: "center" }}
                data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Place owner AdSense ID here
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive ? "true" : "false"}
            />
            
            {/* Rich Mock Programmatic Ad Fallback (Pakistan Localized Prep Academies) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-linear-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/20 rounded-xl relative">
                <span className="absolute top-1 right-2 text-[8px] font-black text-gray-400 uppercase tracking-widest bg-gray-200/50 dark:bg-slate-800/80 px-1 py-0.5 rounded">
                    Sponsored Ad
                </span>
                
                <div className="flex items-center gap-3 text-left">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                        K
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">KIPS MDCAT Prep Session</h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Join 50k+ toppers. Intensive revision, mock simulations, and board alignment drills.</p>
                    </div>
                </div>

                <a
                    href="https://kips.edu.pk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-gray-900 hover:bg-black dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shrink-0 shadow-sm"
                >
                    Learn More
                </a>
            </div>
        </div>
    );
}
