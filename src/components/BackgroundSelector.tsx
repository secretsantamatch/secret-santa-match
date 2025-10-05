import React from 'react';
import type { Participant, BackgroundOption, OutlineSizeSetting, FontSizeSetting, FontTheme, CardStyleData } from '../types';
import PrintableCard from './PrintableCard';

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

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
    participants, eventDetails, backgroundOptions, selectedBackground, setSelectedBackground, customBackground, setCustomBackground, textColor, setTextColor, useTextOutline, setUseTextOutline, outlineColor, setOutlineColor, outlineSize, setOutlineSize, fontSizeSetting, setFontSizeSetting, fontTheme, setFontTheme, lineSpacing, setLineSpacing, greetingText, setGreetingText, introText, setIntroText, wishlistLabelText, setWishlistLabelText
}) => {

    const previewMatch = {
        giver: { name: 'You' },
        receiver: { name: 'Your Recipient', notes: 'Loves coffee, books, and board games.', budget: '25' }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
                {/* Theme Selection */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-3">Theme</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {backgroundOptions.map(option => (
                            <button 
                                key={option.id}
                                onClick={() => setSelectedBackground(option.id)}
                                className={`p-3 text-left border-2 rounded-lg transition-all transform hover:scale-105 ${selectedBackground === option.id ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <span className="text-2xl">{option.icon}</span>
                                <p className="font-semibold mt-1 text-slate-800">{option.name}</p>
                                <p className="text-xs text-slate-500">{option.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="md:col-span-1">
                <h3 className="text-lg font-semibold text-slate-700 mb-3 text-center">Live Preview</h3>
                <div className="sticky top-8">
                    <PrintableCard 
                        match={previewMatch}
                        eventDetails={eventDetails}
                        isNameRevealed={true}
                        backgroundOptions={backgroundOptions}
                        bgId={selectedBackground}
                        bgImg={customBackground}
                        txtColor={textColor}
                        outline={useTextOutline}
                        outColor={outlineColor}
                        outSize={outlineSize}
                        fontSize={fontSizeSetting}
                        font={fontTheme}
                        line={lineSpacing}
                        greet={greetingText}
                        intro={introText}
                        wish={wishlistLabelText}
                    />
                </div>
            </div>
        </div>
    );
};

export default BackgroundSelector;
