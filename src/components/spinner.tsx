const sizes = {
    sm: "h-3.5 w-3.5 border-2",
    md: "h-4 w-4 border-2",
    lg: "h-5 w-5 border-2",
} as const;

export function Spinner({
    className = "",
    size = "md",
    label,
}: {
    className?: string;
    size?: keyof typeof sizes;
    /** Visually hidden text for screen readers */
    label?: string;
}) {
    return (
        <span
            role={label ? "status" : "presentation"}
            aria-label={label}
            className={`inline-block shrink-0 rounded-full border-gray-300 border-t-primary-600 animate-spin ${sizes[size]} ${className}`.trim()}
        />
    );
}
