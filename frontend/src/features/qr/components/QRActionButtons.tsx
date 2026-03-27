import { useState, useCallback, useRef } from 'react';
import { Copy, Download, Check, Loader2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import Button from '@/components/ui/Button';

interface QRActionButtonsProps {
    shareLink: string;
    /** The URL to encode into the QR (same as shareLink in most cases) */
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
    const hiddenCanvasRef = useRef<HTMLDivElement>(null);

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

    // ── Save branded QR image using canvas + generated QR ─────────────────────
    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            // Render an off-screen QRCodeCanvas to get the raw QR image
            const qrUrl = qrImageUrl || shareLink;
            if (!qrUrl) throw new Error('No QR URL available');

            // Create a temporary off-screen canvas with the QR and compose the branded image
            const mainCanvas = document.createElement('canvas');
            const ctx = mainCanvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context not supported');

            const width = 800;
            const height = 1000;
            mainCanvas.width = width;
            mainCanvas.height = height;

            // 1. Soft Gradient Background
            const bgGradient = ctx.createLinearGradient(0, 0, width, height);
            bgGradient.addColorStop(0, '#fdfbfb');
            bgGradient.addColorStop(1, '#fdeff2');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, width, height);

            // 2. Elegant Border
            ctx.strokeStyle = '#fbcfe8';
            ctx.lineWidth = 12;
            ctx.strokeRect(30, 30, width - 60, height - 60);
            ctx.strokeStyle = '#fce7f3';
            ctx.lineWidth = 3;
            ctx.strokeRect(50, 50, width - 100, height - 100);

            // 3. Floral Accents
            ctx.font = '60px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🌸', 100, 110);
            ctx.fillText('🌸', width - 100, 110);
            ctx.fillText('🍂', 100, height - 80);
            ctx.fillText('🍂', width - 100, height - 80);
            ctx.fillText('💖', width / 2, 100);

            // 4. Names
            ctx.fillStyle = '#1e293b';
            let titleSize = 54;
            ctx.font = `bold ${titleSize}px Georgia, serif`;
            while (ctx.measureText(weddingTitle).width > width - 180 && titleSize > 32) {
                titleSize -= 2;
                ctx.font = `bold ${titleSize}px Georgia, serif`;
            }
            ctx.fillText(weddingTitle, width / 2, 180, width - 180);

            ctx.fillStyle = '#64748b';
            ctx.font = '28px sans-serif';
            ctx.fillText('Secure Guest Registry', width / 2, 235);

            // 5. Generate QR via hidden canvas element
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.top = '-9999px';
            document.body.appendChild(tempDiv);

            // We need a React-rendered QRCodeCanvas — use a workaround with the imported component
            // by rendering to a temporary canvas
            const tempQRCanvas = document.createElement('canvas');
            tempQRCanvas.width = 460;
            tempQRCanvas.height = 460;
            // Use qrcode library directly for the download canvas
            const qrModule = await import('qrcode');
            await qrModule.default.toCanvas(tempQRCanvas, qrUrl, {
                width: 460,
                margin: 2,
                color: { dark: '#1e293b', light: '#ffffff' },
                errorCorrectionLevel: 'H',
            });
            document.body.removeChild(tempDiv);

            // 6. Draw QR Card
            const qrSize = 460;
            const qrX = (width - qrSize) / 2;
            const qrY = 300;

            ctx.shadowColor = 'rgba(0,0,0,0.15)';
            ctx.shadowBlur = 30;
            ctx.shadowOffsetY = 15;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(qrX - 30, qrY - 30, qrSize + 60, qrSize + 60, 24);
            } else {
                ctx.rect(qrX - 30, qrY - 30, qrSize + 60, qrSize + 60);
            }
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.drawImage(tempQRCanvas, qrX, qrY, qrSize, qrSize);

            // 7. Footer
            ctx.fillStyle = '#f43f5e';
            let footerSize = 34;
            const footerMsg = 'Scan to send your blessings & gifts';
            ctx.font = `bold ${footerSize}px sans-serif`;
            while (ctx.measureText(footerMsg).width > width - 280 && footerSize > 22) {
                footerSize -= 2;
                ctx.font = `bold ${footerSize}px sans-serif`;
            }
            ctx.fillText(footerMsg, width / 2, height - 130, width - 280);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '20px sans-serif';
            ctx.fillText('Powered by WedTrack', width / 2, height - 90);

            // 8. Download
            const dataUrl = mainCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `${weddingTitle.replace(/\s+/g, '-').toLowerCase()}-registry.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Failed to generate image:', error);
        } finally {
            setIsSaving(false);
        }
    }, [qrImageUrl, shareLink, weddingTitle]);

    return (
        <>
            {/* Hidden canvas kept in DOM for accessibility/screen-reader QR detection — only when URL is ready */}
            <div ref={hiddenCanvasRef} style={{ position: 'absolute', top: -9999, left: -9999, pointerEvents: 'none' }}>
                {(qrImageUrl || shareLink) ? (
                    <QRCodeCanvas value={(qrImageUrl || shareLink).trim() || 'https://wedtrackss.in'} size={460} level="H" />
                ) : null}
            </div>

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

                {/* Save Branded Image */}
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
        </>
    );
}
