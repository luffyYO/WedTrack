import { useState, useRef } from 'react';
import { ImagePlus, X, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ImageGalleryUploadProps {
    files: File[];
    onChange: (files: File[]) => void;
    disabled?: boolean;
}

export default function ImageGalleryUpload({ files, onChange, disabled }: ImageGalleryUploadProps) {
    const [error, setError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const maxFiles = 3;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError('');
        const selectedFiles = Array.from(e.target.files || []);
        
        if (files.length + selectedFiles.length > maxFiles) {
            setError(`You can only upload a maximum of ${maxFiles} images.`);
            return;
        }

        const validFiles = selectedFiles.filter(file => {
            if (!file.type.startsWith('image/')) {
                setError('Please select only image files.');
                return false;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('Each image must be smaller than 5MB.');
                return false;
            }
            return true;
        });

        if (validFiles.length > 0) {
            onChange([...files, ...validFiles]);
        }
        
        // Reset input so the same file can be selected again if removed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (indexToRemove: number) => {
        onChange(files.filter((_, index) => index !== indexToRemove));
        setError('');
    };

    return (
        <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-6 sm:p-8 border border-white/60 shadow-sm transition-all relative overflow-hidden">
            <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <ImagePlus size={16} className="text-pink-400" />
                Event Gallery (Optional)
            </h3>
            <p className="text-sm text-slate-500 mb-6">
                Upload up to 3 beautiful photos of the couple. These will automatically scroll at the top of the guest registry!
            </p>

            {error && (
                <div className="mb-4 flex items-start gap-2 text-rose-500 text-sm bg-rose-50 p-3 rounded-xl border border-rose-100">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <div className="flex flex-wrap gap-4">
                {files.map((file, idx) => (
                    <div key={idx} className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden group shadow-md border-2 border-white">
                        <img 
                            src={URL.createObjectURL(file)} 
                            alt="preview" 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <button 
                            type="button"
                            onClick={() => removeFile(idx)}
                            disabled={disabled}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-rose-500 transition-colors backdrop-blur-md"
                        >
                            <X size={14} strokeWidth={3} />
                        </button>
                    </div>
                ))}

                {files.length < maxFiles && (
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            "w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all group overflow-hidden relative",
                            disabled 
                                ? "opacity-50 cursor-not-allowed border-slate-300 bg-slate-50" 
                                : "cursor-pointer border-pink-300 bg-pink-50/50 hover:bg-pink-100/50 hover:border-pink-400"
                        )}
                    >
                        <ImagePlus size={24} className={cn("transition-transform duration-300", !disabled && "text-pink-400 group-hover:scale-110 group-hover:text-pink-500")} />
                        <span className="text-xs font-semibold text-slate-500 tracking-wide">Add Photo</span>
                    </button>
                )}
            </div>

            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
            />
        </div>
    );
}
