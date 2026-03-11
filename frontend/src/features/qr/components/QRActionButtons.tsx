import { useState, useCallback } from 'react';
import { Copy, Download, Check } from 'lucide-react';
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

    // ── Copy link to clipboard ─────────────────────────────────────────────────
    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(shareLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for browsers that block clipboard API
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

    // ── Save QR to device ──────────────────────────────────────────────────────
    const handleSave = useCallback(() => {
        const link = document.createElement('a');
        link.href = qrImageUrl;
        link.download = `${weddingTitle.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [qrImageUrl, weddingTitle]);

    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full max-w-[320px] mx-auto">
            {/* Copy Link */}
            <Button
                variant="outline"
                size="md"
                fullWidth
                disabled={disabled}
                icon={copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
                onClick={handleCopy}
                className={copied ? 'border-green-400 text-green-700' : ''}
            >
                {copied ? 'Copied!' : 'Copy Link'}
            </Button>

            {/* Save to Gallery */}
            <Button
                variant="primary"
                size="md"
                fullWidth
                disabled={disabled}
                icon={<Download size={15} />}
                onClick={handleSave}
            >
                Save to Gallery
            </Button>
        </div>
    );
}
