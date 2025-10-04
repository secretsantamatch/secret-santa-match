import React, { useState } from 'react';
// Fix: Corrected import paths for types and components.
import type { Participant, BackgroundOption, FontSizeSetting, OutlineSizeSetting, FontTheme } from '../types';
import PrintableCard from './PrintableCard';
import Tooltip from './Tooltip';

interface BackgroundSelectorProps {
  participants: Participant[];
  eventDetails: string;
  backgroundOptions: BackgroundOption[];
  selectedBackground: string;
  setSelectedBackground: (id: string) => void;
  customBackground: string | null;
  setCustomBackground: (url: string | null) => void;
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

const BackgroundSelector: React.FC<BackgroundSelectorProps> = (props) => {
    const {
        participants, backgroundOptions, selectedBackground, setSelectedBackground,
        customBackground, setCustomBackground, textColor, setTextColor, useTextOutline,
        setUseTextOutline, outlineColor, setOutlineColor, outlineSize, setOutlineSize,
        fontSizeSetting, setFontSizeSetting, fontTheme, setFontTheme, lineSpacing, setLineSpacing,
        greetingText, setGreetingText, introText, setIntroText, wishlistLabelText, setWishlistLabelText
    } = props;
  
  const [isCustomizing, setIsCustomizing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCustomBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
          alert("Image is too large. Please select an image smaller than 2MB.");
          return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomBackground(e.target?.result as string);
        setSelectedBackground('custom');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const dummyParticipant = { id: 'preview-id', name: 'Your Name', notes: '', budget: '' };
  const dummyReceiver = { id: 'receiver-id', name: 'Gift Receiver', notes: 'Loves coffee, size L, reads sci-fi.', budget: '25' };
  const previewMatch = { giver: participants.find(p => p.name.trim() !== '') || dummyParticipant, receiver: participants.find(p => p.name.trim() !== '') || dummyReceiver };
  if(previewMatch.giver.id === previewMatch.receiver.id && participants.length > 1) {
    previewMatch.receiver = participants.find(p => p.id !== previewMatch.giver.id && p.name.trim() !== '') || dummyReceiver;
  } else if (previewMatch.giver.id === previewMatch.receiver.id) {
    previewMatch.receiver = dummyReceiver;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-lg text-slate-800 mb-3">Choose a Theme</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {backgroundOptions.map(opt => (
              <button key={opt.id} onClick={() => { setSelectedBackground(opt.id); setCustomBackground(null); }} className={`relative rounded-lg overflow-hidden border-4 transition-all ${selectedBackground === opt.id ? 'border-[var(--accent-color)] scale-105' : 'border-transparent hover:border-slate-300'}`}>
                <img src={opt.icon} alt={opt.name} className="w-full h-auto aspect-square object-cover" />
                <div className="absolute inset-0 bg-black/20" />
                <span className="absolute bottom-1 left-0 right-0 text-white text-xs text-center font-bold drop-shadow-sm">{opt.name}</span>
              </button>
            ))}
             <button onClick={() => fileInputRef.current?.click()} className={`relative rounded-lg overflow-hidden border-4 transition-all flex flex-col items-center justify-center aspect-square ${selectedBackground === 'custom' ? 'border-[var(--accent-color)] scale-105' : 'border-dashed border-slate-300 hover:border-slate-400'}`}>
                {customBackground ? (
                    <img src={customBackground} alt="Custom background" className="w-full h-full object-cover" />
                ) : (
                    <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    <span className="text-slate-600 text-xs mt-1 text-center font-semibold">Upload Your Own</span>
                    </>
                )}
             </button>
            <input type="file" ref={fileInputRef} onChange={handleCustomBackgroundUpload} accept="image/png, image/jpeg" className="hidden" />
          </div>
        </div>
        
        <div className="border-t pt-4">
            <button onClick={() => setIsCustomizing(!isCustomizing)} className="font-semibold text-lg text-slate-800 flex items-center gap-2">
                Customize Text & Colors
                <svg className={`w-5 h-5 text-gray-500 transform transition-transform duration-300 ${isCustomizing ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
        </div>

        <div className={`space-y-4 overflow-hidden transition-all duration-500 ease-in-out ${isCustomizing ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="text-color" className="block text-sm font-medium text-gray-700">Text Color</label>
                    <input id="text-color" type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                    <label htmlFor="outline-color" className="block text-sm font-medium text-gray-700">Outline Color</label>
                    <input id="outline-color" type="color" value={outlineColor} onChange={e => setOutlineColor(e.target.value)} className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm" disabled={!useTextOutline} />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={useTextOutline} onChange={e => setUseTextOutline(e.target.checked)} className="rounded" />
                    <span className="text-sm font-medium text-gray-700">Use Text Outline</span>
                </label>
                 <select value={outlineSize} onChange={e => setOutlineSize(e.target.value as OutlineSizeSetting)} disabled={!useTextOutline} className="text-sm rounded-md border-gray-300">
                    <option value="thin">Thin</option>
                    <option value="normal">Normal</option>
                    <option value="thick">Thick</option>
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="font-size" className="block text-sm font-medium text-gray-700">Font Size</label>
                    <select id="font-size" value={fontSizeSetting} onChange={e => setFontSizeSetting(e.target.value as FontSizeSetting)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm p-2">
                        <option value="normal">Normal</option>
                        <option value="large">Large</option>
                        <option value="extra-large">Extra Large</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="font-theme" className="block text-sm font-medium text-gray-700">Font Theme</label>
                    <select id="font-theme" value={fontTheme} onChange={e => setFontTheme(e.target.value as FontTheme)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm p-2">
                        <option value="classic">Classic</option>
                        <option value="elegant">Elegant</option>
                        <option value="modern">Modern</option>
                        <option value="whimsical">Whimsical</option>
                    </select>
                </div>
            </div>
             <div>
                <label htmlFor="line-spacing" className="block text-sm font-medium text-gray-700">Line Spacing: {lineSpacing.toFixed(1)}</label>
                <input id="line-spacing" type="range" min="1.0" max="2.0" step="0.1" value={lineSpacing} onChange={e => setLineSpacing(parseFloat(e.target.value))} className="mt-1 w-full" />
            </div>
            <div>
                 <label htmlFor="greeting-text" className="block text-sm font-medium text-gray-700 flex items-center gap-1">Greeting Text <Tooltip text="Use {secret_santa} as a placeholder for the giver's name." /></label>
                 <input id="greeting-text" type="text" value={greetingText} onChange={e => setGreetingText(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm p-2" />
            </div>
             <div>
                 <label htmlFor="intro-text" className="block text-sm font-medium text-gray-700">Intro Text</label>
                 <input id="intro-text" type="text" value={introText} onChange={e => setIntroText(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm p-2" />
            </div>
             <div>
                 <label htmlFor="wishlist-label" className="block text-sm font-medium text-gray-700">Wishlist Label</label>
                 <input id="wishlist-label" type="text" value={wishlistLabelText} onChange={e => setWishlistLabelText(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm p-2" />
            </div>
        </div>
      </div>

      <div className="sticky top-8">
        <h3 className="font-semibold text-lg text-slate-800 mb-3 text-center">Live Preview</h3>
        <div className="w-full aspect-[4.25/5.5] rounded-xl shadow-lg overflow-hidden bg-slate-200">
           <PrintableCard
              match={previewMatch}
              isNameRevealed={true}
              backgroundImageUrl={backgroundOptions.find(opt => opt.id === selectedBackground)?.imageUrl || null}
              {...props}
           />
        </div>
      </div>
    </div>
  );
};

export default BackgroundSelector;
