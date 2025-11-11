import React, { useRef } from 'react';
import type { BackgroundOption } from '../types';
import { UploadCloud } from 'lucide-react';

interface BackgroundSelectorProps {
    selected: string;
    setSelectedBackgroundId: (id: string) => void;
    setHoveredBackgroundId: (id: string | null) => void;
    customBackground: string | null;
    setCustomBackground: (url: string | null) => void;
    backgroundOptions: BackgroundOption[];
    onTextColorChange: (color: string) => void;
}

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
    selected,
    setSelectedBackgroundId,
    setHoveredBackgroundId,
    customBackground,
    setCustomBackground,
    backgroundOptions,
    onTextColorChange,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCustomUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 3 * 1024 * 1024) { // 3MB limit
                alert("File is too large. Please choose an image under 3MB.");
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setCustomBackground(result);
                setSelectedBackgroundId('custom');
                onTextColorChange('#FFFFFF'); // Default to white for custom uploads
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSelect = (option: BackgroundOption) => {
        setSelectedBackgroundId(option.id);
        if (option.defaultTextColor) {
            onTextColorChange(option.defaultTextColor);
        }
    }

    return (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
            {/* Pre-defined Themes */}
            {backgroundOptions.map(option => (
                <div
                    key={option.id}
                    title={option.name}
                    className={`relative aspect-[3/4] rounded-lg border-2 cursor-pointer bg-cover bg-center transition-all
                        ${selected === option.id ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-slate-200 hover:border-indigo-400'}`}
                    style={{ backgroundImage: `url(${option.imageUrl})` }}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHoveredBackgroundId(option.id)}
                >
                    {/* You could add an icon or overlay here if needed */}
                </div>
            ))}

            {/* Custom Upload Button */}
            <div
                className={`relative aspect-[3/4] rounded-lg border-2 cursor-pointer flex flex-col items-center justify-center text-center p-1 transition-all
                    ${selected === 'custom' ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-slate-300 hover:border-indigo-400'}
                    ${customBackground ? 'bg-cover bg-center' : 'bg-slate-100'}`}
                style={customBackground ? { backgroundImage: `url(${customBackground})` } : {}}
                onClick={handleCustomUploadClick}
                onMouseEnter={() => setHoveredBackgroundId('custom')}
            >
                {!customBackground && (
                    <>
                        <UploadCloud className="w-6 h-6 text-slate-500 mb-1" />
                        <span className="text-xs font-semibold text-slate-600">Upload</span>
                    </>
                )}
                 {customBackground && <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"><UploadCloud className="w-8 h-8 text-white" /></div>}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                />
            </div>
        </div>
    );
};

export default BackgroundSelector;