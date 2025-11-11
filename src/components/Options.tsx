import React from 'react';
import type { BackgroundOption, OutlineSizeSetting, FontSizeSetting, FontTheme } from '../types';
import BackgroundSelector from './BackgroundSelector';
// FIX: The 'SpacingVertical' icon does not exist in 'lucide-react'. It has been replaced with the 'LineHeight' icon.
import { Palette, Type, Droplet, Text, BoxSelect, LineHeight, MessageSquare } from 'lucide-react';

interface OptionsProps {
  eventDetails: string;
  setEventDetails: (details: string) => void;
  
  // Background props
  selectedBackgroundId: string;
  setSelectedBackgroundId: (id: string) => void;
  customBackground: string | null;
  setCustomBackground: (url: string | null) => void;
  backgroundOptions: BackgroundOption[];
  
  // Text style props
  textColor: string;
  setTextColor: (color: string) => void;
  useTextOutline: boolean;
  setUseTextOutline: (use: boolean) => void;
  outlineColor: string;
  setOutlineColor: (color: string) => void;
  outlineSize: OutlineSizeSetting;
  setOutlineSize: (size: OutlineSizeSetting) => void;
  
  // Font props
  fontSize: FontSizeSetting;
  setFontSize: (size: FontSizeSetting) => void;
  fontTheme: FontTheme;
  setFontTheme: (theme: FontTheme) => void;
  lineSpacing: number;
  setLineSpacing: (spacing: number) => void;
  
  // Card text props
  greetingText: string;
  setGreetingText: (text: string) => void;
  introText: string;
  setIntroText: (text: string) => void;
  wishlistLabelText: string;
  setWishlistLabelText: (text: string) => void;
}

const Options: React.FC<OptionsProps> = (props) => {
  const {
    eventDetails, setEventDetails,
    selectedBackgroundId, setSelectedBackgroundId,
    customBackground, setCustomBackground,
    backgroundOptions,
    textColor, setTextColor,
    useTextOutline, setUseTextOutline,
    outlineColor, setOutlineColor,
    outlineSize, setOutlineSize,
    fontSize, setFontSize,
    fontTheme, setFontTheme,
    lineSpacing, setLineSpacing,
    greetingText, setGreetingText,
    introText, setIntroText,
    wishlistLabelText, setWishlistLabelText,
  } = props;

  return (
    <div className="space-y-8">
      {/* Event Details */}
      <div>
        <label htmlFor="event-details" className="text-lg font-semibold text-slate-700 block mb-2">Event Message</label>
        <textarea
          id="event-details"
          value={eventDetails}
          onChange={(e) => setEventDetails(e.target.value)}
          placeholder="e.g., Exchange will be at the holiday party on Dec 20th!"
          className="w-full p-2 border border-slate-300 rounded-md"
          rows={2}
        />
        <p className="text-slate-500 mt-1 text-sm">This message will appear on each participant's card.</p>
      </div>

      {/* Background Selector */}
      <BackgroundSelector
        selectedBackgroundId={selectedBackgroundId}
        setSelectedBackgroundId={setSelectedBackgroundId}
        customBackground={customBackground}
        setCustomBackground={setCustomBackground}
        backgroundOptions={backgroundOptions}
        onTextColorChange={setTextColor}
      />
      
      {/* Advanced Styling Options */}
      <details className="group">
        <summary className="font-semibold text-slate-800 cursor-pointer list-none flex justify-between items-center">
            <span>Advanced Card Styling Options</span>
            <span className="transition-transform transform group-open:rotate-180">
                <svg className="h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </span>
        </summary>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 border-t pt-6">

          {/* Text Color */}
          <div className="flex items-center gap-4">
            <Palette className="w-6 h-6 text-slate-500" />
            <label htmlFor="text-color" className="font-semibold text-slate-600">Text Color</label>
            <input id="text-color" type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-10 h-10 border-none rounded-md cursor-pointer bg-white" />
          </div>

          {/* Text Outline */}
          <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input id="use-outline" type="checkbox" checked={useTextOutline} onChange={(e) => setUseTextOutline(e.target.checked)} className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"/>
                <label htmlFor="use-outline" className="font-semibold text-slate-600">Use Text Outline</label>
              </div>
              {useTextOutline && (
                  <div className="pl-6 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                          <Droplet className="w-5 h-5 text-slate-500" />
                          <input id="outline-color" type="color" value={outlineColor} onChange={(e) => setOutlineColor(e.target.value)} className="w-8 h-8 border-none rounded-md cursor-pointer bg-white"/>
                      </div>
                      <div className="flex items-center gap-2">
                           <BoxSelect className="w-5 h-5 text-slate-500" />
                           <select id="outline-size" value={outlineSize} onChange={(e) => setOutlineSize(e.target.value as OutlineSizeSetting)} className="p-1 border border-slate-300 rounded-md text-sm">
                               <option value="thin">Thin</option>
                               <option value="normal">Normal</option>
                               <option value="thick">Thick</option>
                           </select>
                      </div>
                  </div>
              )}
          </div>

          {/* Font Size */}
          <div className="flex items-center gap-4">
            <Text className="w-6 h-6 text-slate-500" />
            <label htmlFor="font-size" className="font-semibold text-slate-600">Font Size</label>
            <select id="font-size" value={fontSize} onChange={(e) => setFontSize(e.target.value as FontSizeSetting)} className="p-2 border border-slate-300 rounded-md text-sm">
              <option value="normal">Normal</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
            </select>
          </div>
          
          {/* Font Theme */}
          <div className="flex items-center gap-4">
            <Type className="w-6 h-6 text-slate-500" />
            <label htmlFor="font-theme" className="font-semibold text-slate-600">Font Theme</label>
            <select id="font-theme" value={fontTheme} onChange={(e) => setFontTheme(e.target.value as FontTheme)} className="p-2 border border-slate-300 rounded-md text-sm">
              <option value="classic">Classic (Serif)</option>
              <option value="elegant">Elegant (Garamond)</option>
              <option value="modern">Modern (Sans-serif)</option>
              <option value="whimsical">Whimsical (Cursive)</option>
            </select>
          </div>

          {/* Line Spacing */}
          <div className="flex items-center gap-4 md:col-span-2">
            {/* FIX: Replaced non-existent 'SpacingVertical' icon with 'LineHeight'. */}
            <LineHeight className="w-6 h-6 text-slate-500" />
            <label htmlFor="line-spacing" className="font-semibold text-slate-600">Line Spacing</label>
            <input id="line-spacing" type="range" min="1" max="2" step="0.1" value={lineSpacing} onChange={(e) => setLineSpacing(parseFloat(e.target.value))} className="w-full" />
            <span className="text-sm font-mono">{lineSpacing.toFixed(1)}</span>
          </div>

           {/* Card Text Customization */}
           <div className="md:col-span-2 space-y-4 border-t pt-6 mt-2">
             <div className="flex items-start gap-4">
               <MessageSquare className="w-6 h-6 text-slate-500 mt-1" />
               <div className="w-full">
                <h4 className="font-semibold text-slate-600 mb-2">Card Text Customization</h4>
                 <div className="space-y-2">
                   <input type="text" value={greetingText} onChange={e => setGreetingText(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-sm" placeholder="Greeting" />
                   <input type="text" value={introText} onChange={e => setIntroText(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-sm" placeholder="Introduction" />
                   <input type="text" value={wishlistLabelText} onChange={e => setWishlistLabelText(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-sm" placeholder="Wishlist Label" />
                 </div>
               </div>
             </div>
           </div>

        </div>
      </details>
    </div>
  );
};

export default Options;
