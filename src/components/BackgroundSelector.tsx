import React, { useState, useRef, useEffect, useMemo } from 'react';
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

const fontThemeOptions: { id: FontTheme, name: string }[] = [
    { id: 'classic', name: 'Classic' },
    { id: 'elegant', name: 'Elegant' },
    { id: 'modern', name: 'Modern' },
    { id: 'whimsical', name: 'Whimsical' },
];

const BackgroundSelector: React.FC<BackgroundSelectorProps> = (props) => {
    const {
        participants, eventDetails, backgroundOptions, selectedBackground, setSelectedBackground,
        customBackground, setCustomBackground, textColor, setTextColor, useTextOutline, setUseTextOutline,
        outlineColor, setOutlineColor, outlineSize, setOutlineSize, fontSizeSetting, setFontSizeSetting,
        fontTheme, setFontTheme, lineSpacing, setLineSpacing, greetingText, setGreetingText, introText,
        setIntroText, wishlistLabelText, setWishlistLabelText
    } = props;
    
    const [isCustomizing, setIsCustomizing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCustomImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomBackground(reader.result as string);
                setSelectedBackground('custom');
            };
            reader.readAsDataURL(file);
        }
    };

    const previewParticipant = useMemo(() => {
        return participants.find(p => p.name.trim() !== '') || { id: 'preview1', name: 'Alice', notes: 'Loves knitting, size M', budget: '25' };
    }, [participants]);

    const previewMatch = useMemo(() => ({
        giver: previewParticipant,
        receiver: participants.filter(p => p.name.trim() !== '' && p.id !== previewParticipant.id)[0] || { id: 'preview2', name: 'Bob', notes: 'Big fan of sci-fi movies', budget: '25' }
    }), [participants, previewParticipant]);
    
    const selectedThemeDetails = useMemo(() => {
        return backgroundOptions.find(opt => opt.id === selectedBackground);
    }, [selectedBackground, backgroundOptions]);

    useEffect(() => {
        if (selectedThemeDetails && selectedBackground !== 'custom') {
            setTextColor(selectedThemeDetails.defaultTextColor);
            if (selectedThemeDetails.cardText) {
                setGreetingText(selectedThemeDetails.cardText.greeting || 'Hello, {secret_santa}!');
                setIntroText(selectedThemeDetails.cardText.intro || 'You are the Secret Santa for...');
                setWishlistLabelText(selectedThemeDetails.cardText.wishlistLabel || 'Gift Ideas & Notes:');
            }
        }
    }, [selectedBackground, selectedThemeDetails, setTextColor, setGreetingText, setIntroText, setWishlistLabelText]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">1. Choose a Theme</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {backgroundOptions.map(option => (
                        <button key={option.id} onClick={() => { setSelectedBackground(option.id); setCustomBackground(null); }} className={`relative block border-4 rounded-lg overflow-hidden aspect-w-3 aspect-h-4 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-[var(--primary-focus-ring-color)] ${selectedBackground === option.id ? 'border-[var(--primary-color)]' : 'border-transparent hover:border-gray-300'}`}>
                            <img src={option.icon} alt={option.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-end p-2">
                                <span className="text-white text-xs font-bold">{option.name}</span>
                            </div>
                        </button>
                    ))}
                    <button onClick={() => fileInputRef.current?.click()} className={`relative block border-4 rounded-lg overflow-hidden aspect-w-3 aspect-h-4 flex flex-col items-center justify-center text-center p-2 bg-slate-100 hover:bg-slate-200 ${selectedBackground === 'custom' ? 'border-[var(--primary-color)]' : 'border-dashed border-gray-300 hover:border-gray-400'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <span className="text-gray-600 text-xs font-semibold">Upload Image</span>
                        <input type="file" ref={fileInputRef} onChange={handleCustomImageUpload} accept="image/*" className="hidden" />
                    </button>
                </div>

                <div className="mt-6">
                    <button onClick={() => setIsCustomizing(!isCustomizing)} className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        2. Customize Text & Colors
                        <svg className={`w-5 h-5 text-gray-500 transform transition-transform duration-300 ${isCustomizing ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {isCustomizing && (
                         <div className="space-y-4 pt-2 animate-fade-in-up">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="font-theme" className="text-sm font-medium text-gray-700 block mb-1">Font Style</label>
                                    <select id="font-theme" value={fontTheme} onChange={e => setFontTheme(e.target.value as FontTheme)} className="w-full p-2 border border-gray-300 rounded-md">
                                        {fontThemeOptions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="font-size" className="text-sm font-medium text-gray-700 block mb-1">Font Size</label>
                                    <select id="font-size" value={fontSizeSetting} onChange={e => setFontSizeSetting(e.target.value as FontSizeSetting)} className="w-full p-2 border border-gray-300 rounded-md">
                                        <option value="normal">Normal</option>
                                        <option value="large">Large</option>
                                        <option value="extra-large">Extra Large</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center gap-4">
                                    <label htmlFor="text-color" className="text-sm font-medium text-gray-700">Text Color</label>
                                    <input type="color" id="text-color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-10 h-10 border-none rounded-md cursor-pointer" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="use-outline" checked={useTextOutline} onChange={e => setUseTextOutline(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                                    <label htmlFor="use-outline" className="text-sm font-medium text-gray-700">Use Text Outline</label>
                                </div>
                            </div>
                            {useTextOutline && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-4">
                                        <label htmlFor="outline-color" className="text-sm font-medium text-gray-700">Outline Color</label>
                                        <input type="color" id="outline-color" value={outlineColor} onChange={e => setOutlineColor(e.target.value)} className="w-10 h-10 border-none rounded-md cursor-pointer" />
                                    </div>
                                    <div>
                                        <label htmlFor="outline-size" className="text-sm font-medium text-gray-700 block mb-1">Outline Size</label>
                                        <select id="outline-size" value={outlineSize} onChange={e => setOutlineSize(e.target.value as OutlineSizeSetting)} className="w-full p-2 border border-gray-300 rounded-md">
                                            <option value="thin">Thin</option>
                                            <option value="normal">Normal</option>
                                            <option value="thick">Thick</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-700">Card Text Content</h4>
                                <div className="relative">
                                    <input type="text" value={greetingText} onChange={e => setGreetingText(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">Greeting</span>
                                </div>
                                <div className="relative">
                                    <input type="text" value={introText} onChange={e => setIntroText(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">Intro</span>
                                </div>
                                <div className="relative">
                                    <input type="text" value={wishlistLabelText} onChange={e => setWishlistLabelText(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">Wishlist Label</span>
                                </div>
                                {!greetingText.includes('{secret_santa}') && (
                                    <p className="text-xs text-red-600">Greeting must include {'{secret_santa}'} to show the giver's name.</p>
                                )}
                            </div>
                         </div>
                    )}
                </div>
            </div>
            
            <div className="sticky top-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-1">
                    Live Preview
                    <Tooltip text="This is a live preview of how your printable cards will look. It uses a sample participant." />
                </h3>
                <div className="aspect-[4.25/5.5] w-full max-w-[425px] mx-auto rounded-lg shadow-xl overflow-hidden">
                    <PrintableCard
                        match={previewMatch}
                        eventDetails={eventDetails}
                        backgroundImageUrl={selectedBackground === 'custom' ? null : selectedThemeDetails?.imageUrl || null}
                        customBackground={customBackground}
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
                        isPdfMode={false}
                        isNameRevealed={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default BackgroundSelector;
