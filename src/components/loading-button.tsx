"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "@/components/spinner";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
    /** Shown next to spinner when loading; defaults to children */
    loadingChildren?: ReactNode;
};

export function LoadingButton({
    children,
    loading = false,
    loadingChildren,
    disabled,
    className = "",
    type = "button",
    ...rest
}: Props) {
    const busy = Boolean(loading);
    return (
        <button
            type={type}
            {...rest}
            disabled={disabled || busy}
            aria-busy={busy}
            className={`${className}`.trim()}
        >
            {busy ? (
                <span className="inline-flex items-center justify-center gap-2">
                    <Spinner size="md" label="Loading" />
                    {loadingChildren ?? children}
                </span>
            ) : (
                children
            )}
        </button>
    );
}
