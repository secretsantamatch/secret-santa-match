import React, { useState } from 'react';
import type { BackgroundOption } from '../types';
import { Upload, X } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (option: BackgroundOption) => {
    setSelectedBackgroundId(option.id);
    setCustomBackground(null);
    if (option.defaultTextColor) {
      onTextColorChange(option.defaultTextColor);
    }
  };

  const handleCustomUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) { // 3MB limit
        setError("Image is too large. Please use a file under 3MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCustomBackground(result);
        setSelectedBackgroundId('custom');
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveCustom = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setCustomBackground(null);
      if (backgroundOptions[0]) {
          handleSelect(backgroundOptions[0]);
      }
  };

  if (!backgroundOptions.length) return <div>Loading themes...</div>;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {backgroundOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleSelect(option)}
            onMouseEnter={() => setHoveredBackgroundId(option.id)}
            className={`aspect-[3/4] rounded-lg border-4 transition-all overflow-hidden relative group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              selected === option.id && !customBackground
                ? 'border-indigo-500 scale-105'
                : 'border-transparent hover:border-slate-300'
            }`}
            title={option.name}
          >
            {option.description && <span className="sr-only">{option.description}</span>}
            <img src={option.imageUrl} alt={option.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors"></div>
            <span className="absolute bottom-1 right-1 text-white text-[10px] font-bold whitespace-nowrap px-1.5 py-0.5 bg-black/50 rounded">{option.icon}</span>
          </button>
        ))}
        <label
            htmlFor="custom-bg-upload"
            onMouseEnter={() => setHoveredBackgroundId(customBackground ? 'custom' : null)}
            className={`aspect-[3/4] rounded-lg border-4 transition-all flex items-center justify-center cursor-pointer relative group ${
              selected === 'custom' && customBackground
                ? 'border-indigo-500 scale-105'
                : 'border-dashed border-slate-300 hover:border-indigo-400'
            }`}
        >
            {customBackground ? (
                <>
                    <img src={customBackground} alt="Custom background" className="w-full h-full object-cover" />
                    <button type="button" onClick={handleRemoveCustom} className="absolute top-0 right-0 m-1 bg-white/70 hover:bg-white text-red-600 rounded-full p-0.5 z-10">
                        <X size={16} />
                    </button>
                </>
            ) : (
                <div className="text-center text-slate-500 group-hover:text-indigo-600">
                    <Upload size={24} className="mx-auto" />
                    <span className="text-xs font-semibold mt-1 block">Upload</span>
                </div>
            )}
          <input
            id="custom-bg-upload"
            type="file"
            accept="image/png, image/jpeg, image/gif, image/webp"
            className="sr-only"
            onChange={handleCustomUpload}
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default BackgroundSelector;