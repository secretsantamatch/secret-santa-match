import React, { useState, useMemo, useEffect } from 'react';
import type { Participant, BackgroundOption, OutlineSizeSetting, FontSizeSetting, FontTheme } from '../types';
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

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
    participants, eventDetails, backgroundOptions, selectedBackground, setSelectedBackground, customBackground, setCustomBackground, textColor, setTextColor, useTextOutline, setUseTextOutline, outlineColor, setOutlineColor, outlineSize, setOutlineSize, fontSizeSetting, setFontSizeSetting, fontTheme, setFontTheme, lineSpacing, setLineSpacing, greetingText, setGreetingText, introText, setIntroText, wishlistLabelText, setWishlistLabelText
}) => {
    
    const [filter, setFilter] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [previewBackground, setPreviewBackground] = useState(selectedBackground);

    useEffect(() => {
        setPreviewBackground(selectedBackground);
    }, [selectedBackground]);

    const filteredOptions = useMemo(() => {
        if (!filter) return backgroundOptions;
        return backgroundOptions.filter(opt => 
            opt.name.toLowerCase().includes(filter.toLowerCase()) || 
            opt.description.toLowerCase().includes(filter.toLowerCase())
        );
    }, [filter, backgroundOptions]);

    const previewParticipants = participants.filter(p => p.name.trim() !== '');
    const giverName = previewParticipants.length > 0 ? previewParticipants[0].name : 'Alex';
    
    const receiverParticipant = previewParticipants.length > 1 ? previewParticipants[1] : null;

    const receiverName = receiverParticipant ? receiverParticipant.name : 'Alexa';
    const receiverNotes = receiverParticipant?.notes || '';
    const receiverBudget = receiverParticipant?.budget || '';

    const previewMatch = {
        giver: { name: giverName },
        receiver: { 
            name: receiverName, 
            notes: receiverNotes, 
            budget: receiverBudget 
        }
    };
    
    const handleLineSpacingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLineSpacing(parseFloat(e.target.value));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUploadError('');
        const file = e.target.files?.[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            setUploadError('Invalid file type. Please upload a JPG or PNG.');
            return;
        }

        if (file.size > 3 * 1024 * 1024) { // 3 MB
            setUploadError('File is too large. Please upload an image under 3MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            setCustomBackground(result);
            setSelectedBackground('plain-white');
        };
        reader.onerror = () => {
            setUploadError('Failed to read the file.');
        };
        reader.readAsDataURL(file);
        
        e.target.value = ''; 
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-8">
                {/* 1. Choose a Theme */}
                <div>
                    <h3 className="text-xl font-bold text-slate-700 mb-1">1. Choose a Theme</h3>
                    <p className="text-slate-500 mb-4">Hover to preview, then click to select.</p>
                     <input 
                        type="search"
                        placeholder="Search themes (e.g., 'village', 'festive')"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition mb-4"
                    />
                    <div 
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-2"
                        onMouseLeave={() => setPreviewBackground(selectedBackground)}
                    >
                        {filteredOptions.map(option => {
                            const imageUrl = option.imageUrl && !option.imageUrl.startsWith('/') ? `/${option.imageUrl}` : option.imageUrl;
                            return (
                                <button 
                                    key={option.id}
                                    onClick={() => {
                                        setSelectedBackground(option.id);
                                        setCustomBackground(null);
                                        setUploadError('');
                                    }}
                                    onMouseOver={() => setPreviewBackground(option.id)}
                                    className={`text-left border-2 rounded-lg transition-all transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${selectedBackground === option.id ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-400'}`}
                                >
                                    <div className="aspect-w-3 aspect-h-4 bg-slate-100 rounded-t-md">
                                        {imageUrl ? (
                                            <img src={imageUrl} alt={option.name} className="object-cover rounded-t-md w-full h-full" />
                                        ) : (
                                            <div className="flex items-center justify-center w-full h-full">
                                                <span className="text-4xl">{option.icon}</span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                         })}
                    </div>

                    <div className="mt-6">
                        <h4 className="text-lg font-bold text-slate-600 mb-1">...Or Upload Your Own</h4>
                        <p className="text-slate-500 mb-4 flex items-center text-sm">
                            Recommended: 3:4 ratio, under 3MB.
                            <Tooltip text="For best results, use an image around 600x800 pixels. Supports JPG and PNG.">
                                <InfoIcon />
                            </Tooltip>
                        </p>
                         <div className="p-4 bg-slate-50 rounded-lg border">
                            {customBackground ? (
                                <div className="flex items-center gap-4">
                                    <img src={customBackground} alt="Custom background preview" className="w-16 h-16 object-cover rounded-md border" />
                                    <div className="flex-grow">
                                        <p className="font-semibold text-slate-700">Your background is ready.</p>
                                        <p className="text-sm text-slate-500">Select another theme to replace it.</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setCustomBackground(null);
                                            setUploadError('');
                                        }}
                                        className="py-1 px-3 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-sm font-semibold"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <label htmlFor="custom-bg-upload" className="w-full text-center cursor-pointer bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg transition-colors block">
                                        Upload Image
                                    </label>
                                    <input 
                                        type="file" 
                                        id="custom-bg-upload"
                                        className="hidden"
                                        accept="image/png, image/jpeg"
                                        onChange={handleFileUpload}
                                    />
                                </div>
                            )}
                            {uploadError && <p className="text-red-600 text-sm mt-2">{uploadError}</p>}
                        </div>
                    </div>
                </div>

                {/* 2. Customize Text Style */}
                 <div>
                    <h3 className="text-xl font-bold text-slate-700 mb-4">2. Customize Text Style</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-4 bg-slate-50 rounded-lg border">
                        <div>
                            <label htmlFor="text-color" className="block text-sm font-medium text-slate-700">Text Color</label>
                            <input type="color" id="text-color" value={textColor} onChange={e => setTextColor(e.target.value)} className="mt-1 block w-full h-10 rounded-md border-slate-300 shadow-sm" />
                        </div>
                        <div>
                            <label htmlFor="font-size" className="block text-sm font-medium text-slate-700">Font Size</label>
                            <select id="font-size" value={fontSizeSetting} onChange={e => setFontSizeSetting(e.target.value as FontSizeSetting)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                <option value="normal">Normal</option>
                                <option value="large">Large</option>
                                <option value="extra-large">Extra Large</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label htmlFor="font-style" className="block text-sm font-medium text-slate-700">Font Style</label>
                            <select id="font-style" value={fontTheme} onChange={e => setFontTheme(e.target.value as FontTheme)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                <option value="classic">Classic (Serif)</option>
                                <option value="elegant">Elegant (Serif)</option>
                                <option value="modern">Modern (Sans-serif)</option>
                                <option value="whimsical">Whimsical (Handwriting)</option>
                            </select>
                        </div>
                         <div className="col-span-2">
                            <label htmlFor="line-spacing" className="block text-sm font-medium text-slate-700">Line Spacing ({lineSpacing.toFixed(1)}x)</label>
                            <input type="range" id="line-spacing" min="0.8" max="2.0" step="0.1" value={lineSpacing} onChange={handleLineSpacingChange} className="mt-1 block w-full" />
                        </div>
                        <div className="col-span-2 mt-2">
                            <div className="flex items-center">
                                <input id="text-outline" type="checkbox" checked={useTextOutline} onChange={e => setUseTextOutline(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                                <label htmlFor="text-outline" className="ml-2 block text-sm text-slate-900">Add text outline for better visibility</label>
                            </div>
                        </div>
                        {useTextOutline && (
                            <>
                                <div>
                                    <label htmlFor="outline-color" className="block text-sm font-medium text-slate-700">Outline Color</label>
                                    <input type="color" id="outline-color" value={outlineColor} onChange={e => setOutlineColor(e.target.value)} className="mt-1 block w-full h-10 rounded-md border-slate-300 shadow-sm" />
                                </div>
                                <div>
                                    <label htmlFor="outline-size" className="block text-sm font-medium text-slate-700">Outline Size</label>
                                    <select id="outline-size" value={outlineSize} onChange={e => setOutlineSize(e.target.value as OutlineSizeSetting)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                        <option value="thin">Thin</option>
                                        <option value="normal">Normal</option>
                                        <option value="thick">Thick</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* 3. Edit Card Text */}
                 <div>
                    <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center">
                        3. Edit Card Text
                         <Tooltip text="Use {secret_santa} to automatically insert the gift giver's name.">
                            <InfoIcon />
                        </Tooltip>
                    </h3>
                    <div className="space-y-3 p-4 bg-slate-50 rounded-lg border">
                         <div>
                            <label htmlFor="greeting-text" className="block text-sm font-medium text-slate-700">Greeting</label>
                            <input type="text" id="greeting-text" value={greetingText} onChange={e => setGreetingText(e.target.value)} className="mt-1 p-2 block w-full text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"/>
                        </div>
                         <div>
                            <label htmlFor="intro-text" className="block text-sm font-medium text-slate-700">Introductory Line</label>
                            <input type="text" id="intro-text" value={introText} onChange={e => setIntroText(e.target.value)} className="mt-1 p-2 block w-full text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"/>
                        </div>
                         <div>
                            <label htmlFor="wishlist-label" className="block text-sm font-medium text-slate-700">Wishlist Label</label>
                            <input type="text" id="wishlist-label" value={wishlistLabelText} onChange={e => setWishlistLabelText(e.target.value)} className="mt-1 p-2 block w-full text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"/>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="lg:col-span-2">
                <div className="sticky top-8">
                    <h3 className="text-xl font-bold text-slate-700 mb-4 text-center">4. Live Preview</h3>
                    <PrintableCard 
                        match={previewMatch}
                        eventDetails={eventDetails}
                        isNameRevealed={true}
                        backgroundOptions={backgroundOptions}
                        bgId={previewBackground}
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
