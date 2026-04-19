// Reusable user avatar with SVG fallback when no photo is set

function DefaultAvatarSvg() {
    return (
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%", height: "100%" }}>
            <circle cx="50" cy="50" r="50" fill="#E4E6E9" />
            <ellipse cx="50" cy="37" rx="17" ry="20" fill="#6B7280" />
            <ellipse cx="50" cy="95" rx="35" ry="28" fill="#6B7280" />
        </svg>
    );
}

interface UserAvatarProps {
    src?: string | null;
    size?: "sm" | "md" | "lg";
}

export function UserAvatar({ src, size = "md" }: UserAvatarProps) {
    const sz = size === "lg" ? "w-14 h-14" : size === "md" ? "w-9 h-9" : "w-8 h-8";
    const resolved = src
        ? (src.startsWith("http") || src.startsWith("/uploads") ? src : `/uploads/${src}`)
        : null;

    return (
        <div className={`${sz} rounded-full overflow-hidden shrink-0`}>
            {resolved ? <img src={resolved} alt="" className="w-full h-full object-cover" /> : <DefaultAvatarSvg />}
        </div>
    );
}
