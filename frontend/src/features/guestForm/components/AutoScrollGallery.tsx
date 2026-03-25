export default function AutoScrollGallery({ images }: { images: string[] }) {
    // If no images are provided, use default beautiful wedding placeholders
    const defaultImages = [
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800"
    ];

    const actualImages = (!images || images.length === 0) ? defaultImages : images;

    // Repeat enough times to fill the viewport and allow for seamless scrolling
    // Even if there's only 1 image (260px), 8 copies will comfortably overflow the 460px container
    const displayImages = [...actualImages, ...actualImages, ...actualImages, ...actualImages, ...actualImages, ...actualImages, ...actualImages, ...actualImages];
    
    // Calculate the precise total width of the original, unique set of images
    const shiftPixels = actualImages.length * 260; // since each image is strictly 260px wide

    return (
        <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-gradient-to-b from-slate-50 to-[#fdfbfb] border-b border-white/60">
            {/* Edge fade overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#fdfbfb] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#fdfbfb] to-transparent z-10 pointer-events-none" />

            <style>
                {`
                @keyframes scroll-precise {
                    0% { transform: translateX(0px); }
                    100% { transform: translateX(-${shiftPixels}px); }
                }
                .gallery-scroll-track {
                    animation: scroll-precise ${actualImages.length * 10}s linear infinite;
                    width: max-content;
                }
                .gallery-scroll-track:hover {
                    animation-play-state: paused;
                }
                `}
            </style>

            <div className="flex items-center h-full gallery-scroll-track group">
                {displayImages.map((src, idx) => (
                    <div 
                        key={idx} 
                        className="h-full px-2 py-3 w-[260px] shrink-0"
                    >
                        <div className="w-full h-full rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-[4px] border-white/90 bg-white/50 relative">
                            {/* Glass overlay on hover */}
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none z-10" />
                            <img 
                                src={src} 
                                alt={`gallery-img-${idx}`} 
                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
