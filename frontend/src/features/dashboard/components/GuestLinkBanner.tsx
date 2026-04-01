import { useState } from 'react';
import { Link2, Copy, Check } from 'lucide-react';

interface GuestLinkBannerProps {
    activeWedding: any; // We can type this strictly later
}

export default function GuestLinkBanner({ activeWedding }: GuestLinkBannerProps) {
    const [linkCopied, setLinkCopied] = useState(false);

    if (!activeWedding?.nanoid) return null;

    const inviteUrl = `${window.location.origin}/guest-form/${activeWedding.nanoid}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteUrl).then(() => {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        });
    };

    const handleWhatsApp = () => {
        const weddingName = activeWedding?.bride_name && activeWedding?.groom_name
            ? `${activeWedding.bride_name} & ${activeWedding.groom_name}'s`
            : 'Our';
        const msg = `💍 ${weddingName} Wedding\n\nYou're invited! Please register your gift/contribution using this link:\n${inviteUrl}\n\nPowered by WedTrack 🌸`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <div className="px-4 sm:px-6">
            <div
                style={{
                    margin: '12px 0 0',
                    background: '#ffffff',
                    borderRadius: '1.1rem',
                    boxShadow: '0 2px 16px -4px rgba(25,28,30,0.07)',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap',
                }}
            >
                {/* Icon + Label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <div style={{
                        background: '#fce7f3',
                        borderRadius: '8px',
                        padding: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Link2 size={13} style={{ color: '#be185d' }} />
                    </div>
                    <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#87717a',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                    }}>Guest Link</span>
                </div>

                {/* URL pill */}
                <div style={{
                    flex: 1,
                    minWidth: 0,
                    background: '#f7f9fb',
                    borderRadius: '8px',
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#544249',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: 'monospace',
                    letterSpacing: '0.01em',
                }}>
                    {inviteUrl}
                </div>

                {/* Copy button */}
                <button
                    onClick={handleCopy}
                    title="Copy invite link"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: '1px solid rgba(218,192,201,0.4)',
                        background: linkCopied ? '#f0fdf4' : '#ffffff',
                        color: linkCopied ? '#15803d' : '#544249',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.2s',
                    }}
                >
                    {linkCopied
                        ? <><Check size={12} /><span>Copied!</span></>
                        : <><Copy size={12} /><span className="hidden sm:inline">Copy</span></>}
                </button>

                {/* WhatsApp share */}
                <button
                    onClick={handleWhatsApp}
                    title="Share on WhatsApp"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#25D366',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        flexShrink: 0,
                    }}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    <span className="hidden sm:inline">Share</span>
                </button>
            </div>
        </div>
    );
}
