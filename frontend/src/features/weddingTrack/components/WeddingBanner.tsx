/**
 * WeddingBanner – a subtle, minimal wedding illustration shown above the form.
 * Uses an inline SVG so there are no image dependencies.
 */
export default function WeddingBanner() {
    return (
        <div className="flex flex-col items-center gap-3 py-6 select-none">
            {/* SVG: two interlocked rings with soft floral accents */}
            <svg
                viewBox="0 0 120 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-28 h-14 text-neutral-300"
                aria-hidden="true"
            >
                {/* Left ring */}
                <circle cx="44" cy="30" r="18" stroke="currentColor" strokeWidth="2.5" />
                {/* Right ring */}
                <circle cx="76" cy="30" r="18" stroke="currentColor" strokeWidth="2.5" />
                {/* Overlap fill (mask-like effect using the bg colour) */}
                <path
                    d="M60 18.5 C55 22 53 26 53 30 C53 34 55 38 60 41.5 C65 38 67 34 67 30 C67 26 65 22 60 18.5Z"
                    fill="white"
                    stroke="currentColor"
                    strokeWidth="0"
                />

                {/* Small decorative dots / florals */}
                <circle cx="44" cy="8" r="2" fill="currentColor" opacity="0.35" />
                <circle cx="76" cy="8" r="2" fill="currentColor" opacity="0.35" />
                <circle cx="22" cy="20" r="1.5" fill="currentColor" opacity="0.25" />
                <circle cx="98" cy="20" r="1.5" fill="currentColor" opacity="0.25" />
                <circle cx="22" cy="40" r="1.5" fill="currentColor" opacity="0.25" />
                <circle cx="98" cy="40" r="1.5" fill="currentColor" opacity="0.25" />

                {/* Small diamond / gem at the top centre */}
                <polygon
                    points="60,3 63,9 60,12 57,9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    opacity="0.5"
                />
            </svg>

            <div className="text-center">
                <p className="text-label text-[var(--color-text-muted)] tracking-widest uppercase">
                    New Wedding Track
                </p>
            </div>
        </div>
    );
}
