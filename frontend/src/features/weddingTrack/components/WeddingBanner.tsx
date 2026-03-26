/**
 * WeddingBanner – a subtle, minimal wedding illustration shown above the form.
 * Uses an inline SVG so there are no image dependencies.
 */
export default function WeddingBanner() {
    return (
        <div className="flex flex-col items-center gap-4 py-8 select-none animate-fade-up">
            {/* SVG: two interlocked rings with soft floral accents */}
            <div className="relative">
                <div className="absolute inset-0 bg-pink-400 blur-[30px] opacity-10 rounded-full mix-blend-multiply"></div>
                <svg
                    viewBox="0 0 120 60"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-32 h-16 text-pink-300 relative z-10 animate-pulse-glow rounded-full"
                    aria-hidden="true"
                >
                    {/* Left ring */}
                    <circle cx="44" cy="30" r="18" stroke="currentColor" strokeWidth="2.5" />
                    {/* Right ring */}
                    <circle cx="76" cy="30" r="18" stroke="currentColor" strokeWidth="2.5" />
                    {/* Overlap fill (mask-like effect using the bg colour) */}
                    <path
                        d="M60 18.5 C55 22 53 26 53 30 C53 34 55 38 60 41.5 C65 38 67 34 67 30 C67 26 65 22 60 18.5Z"
                        fill="var(--color-bg-light)"
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
            </div>

            <div className="text-center mt-2">
                <p className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-rose-400 tracking-[0.2em] uppercase">
                    New Wedding Track
                </p>
            </div>
        </div>
    );
}
