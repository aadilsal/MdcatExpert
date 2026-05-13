"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/spinner";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
    children: ReactNode;
    /** Optional label while the enclosing form is submitting */
    pendingChildren?: ReactNode;
};

/**
 * Submit button that reflects the parent form submission state (e.g. Server Actions).
 * Must be rendered inside the same form as the action.
 */
export function FormSubmitButton({
    children,
    pendingChildren,
    disabled,
    className = "",
    ...rest
}: Props) {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            {...rest}
            disabled={disabled || pending}
            aria-busy={pending}
            className={className}
        >
            {pending ? (
                <span className="inline-flex items-center justify-center gap-2">
                    <Spinner size="md" label="Submitting" />
                    {pendingChildren ?? children}
                </span>
            ) : (
                children
            )}
        </button>
    );
}
