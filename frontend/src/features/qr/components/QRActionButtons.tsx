import { useState, useCallback } from 'react';
import { Copy, Download, Check, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';

interface QRActionButtonsProps {
    shareLink: string;
    qrImageUrl: string;
    weddingTitle: string;
    disabled?: boolean;
}

export default function QRActionButtons({
    shareLink,
    qrImageUrl,
    weddingTitle,
    disabled = false,
}: QRActionButtonsProps) {
    const [copied, setCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // ── Copy link to clipboard ─────────────────────────────────────────────────
    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(shareLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = shareLink;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [shareLink]);

    // ── Create and Save Branded QR ─────────────────────────────────────────────
    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context not supported');

            const width = 800;
            const height = 1000;
            canvas.width = width;
            canvas.height = height;

            // 1. Soft Gradient Background
            const bgGradient = ctx.createLinearGradient(0, 0, width, height);
            bgGradient.addColorStop(0, '#fdfbfb');
            bgGradient.addColorStop(1, '#fdeff2');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, width, height);

            // 2. Elegant Border
            ctx.strokeStyle = '#fbcfe8'; // pink-200
            ctx.lineWidth = 12;
            ctx.strokeRect(30, 30, width - 60, height - 60);

            // Inner thin line
            ctx.strokeStyle = '#fce7f3'; // pink-100
            ctx.lineWidth = 3;
            ctx.strokeRect(50, 50, width - 100, height - 100);

            // 3. Floral / Wedding Accents using Emojis (Fallback to classic styling)
            ctx.font = '60px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🌸', 100, 110);
            ctx.fillText('🌸', width - 100, 110);
            ctx.fillText('🍂', 100, height - 80);
            ctx.fillText('🍂', width - 100, height - 80);

            // Top Love Icon
            ctx.fillText('💖', width / 2, 100);

            // 4. Draw Bride & Groom Names
            ctx.fillStyle = '#1e293b'; // slate-800
            let titleSize = 54;
            ctx.font = `bold ${titleSize}px Georgia, serif`;
            while (ctx.measureText(weddingTitle).width > width - 180 && titleSize > 32) {
                titleSize -= 2;
                ctx.font = `bold ${titleSize}px Georgia, serif`;
            }
            ctx.fillText(weddingTitle, width / 2, 180, width - 180);

            // 5. Draw Subtitle
            ctx.fillStyle = '#64748b'; // slate-500
            ctx.font = '28px sans-serif';
            ctx.fillText('Secure Guest Registry', width / 2, 235);

            // 6. Load QR Image
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = qrImageUrl;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            // 7. Draw QR with White Card Background
            const qrSize = 460;
            const qrX = (width - qrSize) / 2;
            const qrY = 300;

            ctx.shadowColor = 'rgba(0,0,0,0.15)';
            ctx.shadowBlur = 30;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 15;
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(qrX - 30, qrY - 30, qrSize + 60, qrSize + 60, 24) : ctx.fillRect(qrX - 30, qrY - 30, qrSize + 60, qrSize + 60);
            ctx.fill();

            // Reset shadow to avoid applying on QR itself
            ctx.shadowColor = 'transparent';
            ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

            // 8. Footer Message
            ctx.fillStyle = '#f43f5e'; // rose-500
            let footerSize = 34;
            const footerMessage = 'Scan to send your blessings & gifts';
            ctx.font = `bold ${footerSize}px sans-serif`;
            while (ctx.measureText(footerMessage).width > width - 280 && footerSize > 22) {
                footerSize -= 2;
                ctx.font = `bold ${footerSize}px sans-serif`;
            }
            ctx.fillText(footerMessage, width / 2, height - 130, width - 280);
            
            ctx.fillStyle = '#94a3b8'; // slate-400
            ctx.font = '20px sans-serif';
            ctx.fillText('Powered by WedTrack', width / 2, height - 90);

            // 9. Download
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `${weddingTitle.replace(/\s+/g, '-').toLowerCase()}-registry.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Failed to generate composite image, falling back', error);
            // Fallback
            const link = document.createElement('a');
            link.href = qrImageUrl;
            link.download = `${weddingTitle.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } finally {
            setIsSaving(false);
        }
    }, [qrImageUrl, weddingTitle]);

    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full max-w-[340px] mx-auto">
            {/* Copy Link */}
            <Button
                variant="outline"
                size="md"
                fullWidth
                disabled={disabled}
                icon={copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                onClick={handleCopy}
                className={copied ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'bg-white/60 hover:bg-white'}
            >
                {copied ? 'Link Copied!' : 'Copy Share Link'}
            </Button>

            {/* Save to Gallery (Styled & Branded payload) */}
            <Button
                variant="primary"
                size="md"
                fullWidth
                disabled={disabled || isSaving}
                icon={isSaving ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                onClick={handleSave}
                className="bg-gradient-to-r from-pink-500 to-rose-400 border-none shadow-md hover:shadow-lg transition-all"
            >
                {isSaving ? 'Processing...' : 'Save Registry Image'}
            </Button>
        </div>
    );
}
