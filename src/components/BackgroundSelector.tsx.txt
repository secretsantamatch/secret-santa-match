
import React, { useState, useEffect, useRef } from 'react';
import type { BackgroundOption, FontSizeSetting, OutlineSizeSetting, FontTheme, Participant, Match } from '../types';
import Tooltip from './Tooltip';
import PrintableCard from './PrintableCard';

interface BackgroundSelectorProps {
  participants: Participant[];
  eventDetails: string;
  backgroundOptions: BackgroundOption[];
  selectedBackground: string;
  setSelectedBackground: (id: string) => void;
  customBackground: string | null;
  setCustomBackground: (color: string | null) => void;
  textColor: string;
  setTextColor: (color: string) => void;
  useTextOutline: boolean;
  setUseTextOutline: (use: boolean) => void;
  outlineColor: string;
  setOutlineColor: (color: string) => void;
  outlineSize: OutlineSizeSetting;
  setOutlineSize: (size: OutlineSizeSetting) => void;
  fontSizeSetting: FontSizeSetting;
  setFontSizeSetting: (size: FontSizeSetting) => void;
  fontTheme: FontTheme;
  setFontTheme: (theme: FontTheme) => void;
  lineSpacing: number;
  setLineSpacing: (spacing: number) => void;
  greetingText: string;
  setGreetingText: (text: string) => void;
  introText: string;
  setIntroText: (text: string) => void;
  wishlistLabelText: string;
  setWishlistLabelText: (text: string) => void;
}

const getProxiedUrl = (url: string) => `https://wsrv.nl/?url=${url}`;

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  participants,
  eventDetails,
  backgroundOptions,
  selectedBackground,
  setSelectedBackground,
  customBackground,
  setCustomBackground,
  textColor,
  setTextColor,
  useTextOutline,
  setUseTextOutline,
  outlineColor,
  setOutlineColor,
  outlineSize,
  setOutlineSize,
  fontSizeSetting,
  setFontSizeSetting,
  fontTheme,
  setFontTheme,
  lineSpacing,
  setLineSpacing,
  greetingText,
  setGreetingText,
  introText,
  setIntroText,
  wishlistLabelText,
  setWishlistLabelText
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const previewId = hoveredId || selectedBackground;
  const previewTheme = backgroundOptions.find(opt => opt.id === previewId);
  
  const selectedTheme = backgroundOptions.find(opt => opt.id === selectedBackground);
  const showGiverWarning = !greetingText.includes('{secret_santa}');

  const giver = participants.find(p => p.name.trim()) || { id: 'preview-giver', name: 'Secret Santa', notes: '', budget: ''};
  const receiver = participants.filter(p => p.name.trim())[1] || { id: 'preview-receiver', name: "Receiver's Name", notes: "Notes and wishlist details go here...", budget: "25" };

  const previewMatch: Match = { giver, receiver };
  
  const handleThemeClick = (optionId: string) => {
    setSelectedBackground(optionId);
    if (optionId !== 'custom-image') {
        setCustomBackground(null);
    }
  };

  const handleCustomImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) { // 3MB limit
          setUploadError('File is too large. Please upload an image under 3MB.');
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomBackground(reader.result as string);
        setSelectedBackground('custom-image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCustomImageSelect = () => {
    setSelectedBackground('custom-image');
    fileInputRef.current?.click();
  };

  const filteredOptions = backgroundOptions.filter(option => 
    option.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    option.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const { key } = event;
    const grid = gridRef.current;
    if (!grid) return;
    const items: HTMLButtonElement[] = Array.from(grid.querySelectorAll('button'));
    const activeIndex = items.findIndex(item => item === document.activeElement);
    if (activeIndex === -1 && (key === 'ArrowDown' || key === 'ArrowRight')) {
        items[0]?.focus(); event.preventDefault(); return;
    }
    let nextIndex = activeIndex;
    const getColumnCount = () => {
        if (window.matchMedia('(min-width: 768px)').matches) return 4;
        if (window.matchMedia('(min-width: 640px)').matches) return 3; return 2;
    };
    const numCols = getColumnCount();
    switch (key) {
        case 'ArrowRight': nextIndex = activeIndex + 1; break;
        case 'ArrowLeft': nextIndex = activeIndex - 1; break;
        case 'ArrowDown': nextIndex = activeIndex + numCols; break;
        case 'ArrowUp': nextIndex = activeIndex - numCols; break;
        case 'Enter': case ' ': if (activeIndex !== -1) { event.preventDefault(); items[activeIndex].click(); } return;
        default: return;
    }
    if (nextIndex >= 0 && nextIndex < items.length) {
        event.preventDefault(); items[nextIndex]?.focus();
    }
  };
  
  return (
    <div className="space-y-8">
       <input type="file" ref={fileInputRef} onChange={handleCustomImageUpload} className="hidden" accept="image/png, image/jpeg, image/gif" />
      <div className="bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200">
        <h3 className="font-semibold text-gray-800 text-lg">Choose a Card Theme <span className="text-[var(--primary-color)]">*</span></h3>
        <p className="text-sm text-gray-500 mb-4">Hover over a theme for a larger preview, then click to select.</p>
        <div className="relative">
          <input type="text" placeholder="Search themes (e.g., 'village', 'festive')" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 pr-10 mb-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-focus-ring-color)]" />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 flex items-center pr-3" aria-label="Clear search"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-gray-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></button>}
        </div>
        {uploadError && <p className="text-red-600 text-sm mb-4">{uploadError}</p>}
        <div ref={gridRef} onKeyDown={handleGridKeyDown} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredOptions.map(option => (
            <div key={option.id} className="relative group">
              <button onClick={() => handleThemeClick(option.id)} onMouseEnter={() => setHoveredId(option.id)} onMouseLeave={() => setHoveredId(null)} className={`relative w-full aspect-square rounded-lg overflow-hidden border-4 transition-all duration-200 bg-gray-100 focus:outline-none focus:ring-4 focus:ring-offset-0 focus:ring-[var(--primary-focus-ring-color)] ${selectedBackground === option.id ? 'border-[var(--primary-color)] scale-105 shadow-lg' : 'border-transparent hover:border-gray-300'}`}>
                {option.imageUrl ? <img src={getProxiedUrl(option.imageUrl)} alt={option.name} className="w-full h-full object-contain" /> : <div className="w-full h-full bg-white flex items-center justify-center p-2"><span className="text-gray-500 text-3xl">{option.icon}</span></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2 pointer-events-none"><p className="text-white text-xs font-bold truncate">{option.name}</p></div>
              </button>
              {option.imageUrl && <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 p-1 bg-white rounded-lg shadow-2xl border border-gray-200 z-30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none transform group-hover:scale-100 scale-95"><img src={getProxiedUrl(option.imageUrl)} alt={`${option.name} Preview`} className="w-full h-auto rounded-md" /><div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white drop-shadow-lg"></div></div>}
            </div>
          ))}
          {searchTerm.length === 0 && (
            <div className="relative group">
              <button onClick={handleCustomImageSelect} onMouseEnter={() => setHoveredId('custom-image')} onMouseLeave={() => setHoveredId(null)} className={`w-full aspect-square flex flex-col items-center justify-center text-center p-2 bg-slate-50 rounded-lg border-4 border-dashed transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-0 focus:ring-[var(--primary-focus-ring-color)] ${selectedBackground === 'custom-image' ? 'border-[var(--primary-color)] scale-105 shadow-lg' : 'border-slate-300 hover:border-slate-400'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg><span className="text-gray-600 font-semibold text-sm">Upload Image</span></button>
               <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-72 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-30"><p className="font-bold text-sm mb-2 text-center">Custom Image Guidelines</p><ul className="list-disc list-inside space-y-1 text-left"><li>Max file size: 3MB. Accepted types: JPG, PNG.</li><li>For best results, use a portrait-oriented image (3:4 aspect ratio).</li><li>Ideal size is approx. 4.25" x 5.5" at 300 DPI (1275x1650 pixels).</li><li>Larger images will be automatically scaled to fit the card.</li></ul><div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div></div>
            </div>
          )}
        </div>
          {selectedTheme && selectedBackground !== 'custom-image' && <div className="text-sm text-gray-600 mt-4 p-3 bg-white rounded-md border border-slate-200"><p><span className="font-semibold">{selectedTheme.name}:</span> {selectedTheme.description}</p></div>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
            <div>
                 <h4 className="font-semibold text-gray-800 text-lg mb-4">Text Style</h4>
                <div className="p-4 sm:p-6 bg-white rounded-xl shadow-md border border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label htmlFor="text-color" className="block text-sm font-medium text-gray-700">Text Color</label><div className="mt-1 flex items-center gap-2"><input id="text-color" type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="h-10 w-10 p-1 border border-gray-300 rounded-md cursor-pointer"/><input type="text" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-focus-ring-color)]"/></div></div>
                        <div><label htmlFor="font-size" className="block text-sm font-medium text-gray-700">Font Size</label><select id="font-size" value={fontSizeSetting} onChange={e => setFontSizeSetting(e.target.value as FontSizeSetting)} className="mt-1 w-full p-2 h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-focus-ring-color)]"><option value="normal">Normal</option><option value="large">Large</option><option value="extra-large">Extra Large</option></select></div>
                        <div className="sm:col-span-2"><label htmlFor="font-theme" className="block text-sm font-medium text-gray-700">Font Style</label><select id="font-theme" value={fontTheme} onChange={e => setFontTheme(e.target.value as FontTheme)} className="mt-1 w-full p-2 h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-focus-ring-color)]"><option value="classic">Classic</option><option value="elegant">Elegant</option><option value="modern">Modern</option><option value="whimsical">Whimsical</option></select></div>
                        <div className="sm:col-span-2"><label htmlFor="line-spacing" className="block text-sm font-medium text-gray-700">Line Spacing ({lineSpacing.toFixed(1)}x)</label><input id="line-spacing" type="range" min="0.8" max="1.5" step="0.1" value={lineSpacing} onChange={e => setLineSpacing(parseFloat(e.target.value))} className="mt-1 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--primary-color)]" /></div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200"><div className="flex items-center"><input id="text-outline" type="checkbox" checked={useTextOutline} onChange={e => setUseTextOutline(e.target.checked)} className="h-4 w-4 text-[var(--primary-color)] border-gray-300 rounded focus:ring-[var(--primary-focus-ring-color)]"/><label htmlFor="text-outline" className="ml-2 block text-sm text-gray-900">Add text outline for better visibility.</label></div>
                        {useTextOutline && (<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 ml-1 p-3 bg-slate-50 rounded-lg border border-slate-200"><div><label htmlFor="outline-color" className="block text-sm font-medium text-gray-700">Outline Color</label><div className="mt-1 flex items-center gap-2"><input id="outline-color" type="color" value={outlineColor} onChange={e => setOutlineColor(e.target.value)} className="h-10 w-10 p-1 border border-gray-300 rounded-md cursor-pointer"/><input type="text" value={outlineColor} onChange={e => setOutlineColor(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-focus-ring-color)]"/></div></div><div><label htmlFor="outline-size" className="block text-sm font-medium text-gray-700">Outline Size</label><select id="outline-size" value={outlineSize} onChange={e => setOutlineSize(e.target.value as OutlineSizeSetting)} className="mt-1 w-full p-2 h-10 border border-gray-300 rounded-md"><option value="thin">Thin</option><option value="normal">Normal</option><option value="thick">Thick</option></select></div></div>)}
                    </div>
                </div>
            </div>
             <div>
                <h4 className="font-semibold text-gray-800 text-lg mb-4 flex items-center gap-2">Customize Card Text<Tooltip text="Use {secret_santa} to automatically insert the gift-giver's name. This is useful for the greeting." /></h4>
                <div className="p-4 sm:p-6 bg-white rounded-xl shadow-md border border-slate-200 space-y-4">
                    <div><label htmlFor="greeting-text" className="block text-sm font-medium text-gray-700">Greeting</label><input id="greeting-text" type="text" maxLength={40} value={greetingText} onChange={e => setGreetingText(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md" />{showGiverWarning && <p className="text-xs text-amber-600 mt-1">Warning: Don't forget to include <code className="bg-amber-100 p-0.5 rounded">{"{secret_santa}"}</code> so their name appears!</p>}</div>
                    <div><label htmlFor="intro-text" className="block text-sm font-medium text-gray-700">Introductory Line</label><input id="intro-text" type="text" maxLength={60} value={introText} onChange={e => setIntroText(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md" /></div>
                    <div><label htmlFor="wishlist-label" className="block text-sm font-medium text-gray-700">Wishlist Label</label><input id="wishlist-label" type="text" maxLength={40} value={wishlistLabelText} onChange={e => setWishlistLabelText(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md" /></div>
                    <button onClick={() => { if (selectedTheme?.cardText) { setGreetingText(selectedTheme.cardText.greeting || 'Hello, {secret_santa}!'); setIntroText(selectedTheme.cardText.intro || 'You are the Secret Santa for...'); setWishlistLabelText(selectedTheme.cardText.wishlistLabel || 'Their Wishlist / Notes:'); } }} className="text-xs font-semibold text-gray-500 hover:text-[var(--primary-color)]">Reset to theme defaults</button>
                </div>
            </div>
        </div>
        <div>
           <h4 className="font-semibold text-gray-800 text-lg mb-4 text-center md:text-left">Live Preview</h4>
           <div className="sticky top-6">
                 <PrintableCard
                    match={previewMatch}
                    eventDetails={eventDetails}
                    backgroundId={previewId}
                    backgroundImageUrl={previewTheme?.imageUrl || null}
                    customBackground={previewId === 'custom-image' ? customBackground : null}
                    textColor={textColor}
                    useTextOutline={useTextOutline}
                    outlineColor={outlineColor}
                    outlineSize={outlineSize}
                    fontSizeSetting={fontSizeSetting}
                    fontTheme={fontTheme}
                    lineSpacing={lineSpacing}
                    greetingText={greetingText}
                    introText={introText}
                    wishlistLabelText={wishlistLabelText}
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundSelector;
