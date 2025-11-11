import React, { useState, useMemo } from 'react';
import type { Participant, BackgroundOption, OutlineSizeSetting, FontSizeSetting, FontTheme, Match } from '../types';
import BackgroundSelector from './BackgroundSelector';
import PrintableCard from './PrintableCard';
import { Palette, Type, Droplet, Text, BoxSelect, Baseline, MessageSquare, Info, Search } from 'lucide-react';

interface OptionsProps {
  participants: Participant[];
  eventDetails: string;
  
  selectedBackgroundId: string;
  setSelectedBackgroundId: (id: string) => void;
  customBackground: string | null;
  setCustomBackground: (url: string | null) => void;
  backgroundOptions: BackgroundOption[];
  
  textColor: string;
  setTextColor: (color: string) => void;
  useTextOutline: boolean;
  setUseTextOutline: (use: boolean) => void;
  outlineColor: string;
  setOutlineColor: (color: string) => void;
  outlineSize: OutlineSizeSetting;
  setOutlineSize: (size: OutlineSizeSetting) => void;
  
  fontSize: FontSizeSetting;
  setFontSize: (size: FontSizeSetting) => void;
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

const Options: React.FC<OptionsProps> = (props) => {
  const { participants, eventDetails, ...styleProps } = props;
  const { backgroundOptions, selectedBackgroundId, setSelectedBackgroundId } = styleProps;
  const [themeSearch, setThemeSearch] = useState('');

  const filteredThemes = useMemo(() => {
    if (!themeSearch) return backgroundOptions;
    const lowercasedFilter = themeSearch.toLowerCase();
    return backgroundOptions.filter(opt => 
        opt.name.toLowerCase().includes(lowercasedFilter) ||
        opt.description?.toLowerCase().includes(lowercasedFilter)
    );
  }, [themeSearch, backgroundOptions]);
  
  const sampleMatch: Match = useMemo(() => {
      const giver = participants[0] || { id: 'sample-giver', name: 'Alex', interests: 'Loves dark roast coffee', likes: 'Horror movies', dislikes: '', links: '', budget: '' };
      const receiver = participants[1] || participants[0] || { id: 'sample-receiver', name: 'Taylor', interests: 'Enjoys hiking and board games', likes: 'Spicy food', dislikes: '', links: '', budget: '$25' };
      return { giver, receiver };
  }, [participants]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Column: Controls */}
        <div className="space-y-8">
            {/* 1. Choose a Theme */}
            <section>
                <h3 className="text-xl font-bold text-slate-800 mb-4">1. Choose a Theme</h3>
                <div className="relative mb-4">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                     <input 
                        type="text"
                        placeholder="Search themes (e.g., 'village', 'festive')"
                        value={themeSearch}
                        onChange={e => setThemeSearch(e.target.value)}
                        className="w-full p-2 pl-10 border border-slate-300 rounded-md"
                     />
                </div>
                <BackgroundSelector
                    selected={selectedBackgroundId}
                    setSelectedBackgroundId={setSelectedBackgroundId}
                    customBackground={styleProps.customBackground}
                    setCustomBackground={styleProps.setCustomBackground}
                    backgroundOptions={filteredThemes}
                    onTextColorChange={styleProps.setTextColor}
                />
                <div className="flex items-start gap-2 text-slate-500 text-xs mt-3 bg-slate-50 p-2 rounded-md">
                   <Info size={14} className="flex-shrink-0 mt-0.5" />
                   <p>Hover to preview, click to select. Recommended image size for custom uploads: 3:4 ratio, under 3MB.</p>
                </div>
            </section>
            
            {/* 2. Customize Text Style */}
            <section>
                <h3 className="text-xl font-bold text-slate-800 mb-4">2. Customize Text Style</h3>
                <div className="space-y-4 bg-slate-50 p-4 rounded-lg border">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                             <Palette className="w-5 h-5 text-slate-500" />
                             <label htmlFor="text-color" className="font-semibold text-sm text-slate-600">Text Color</label>
                             <input id="text-color" type="color" value={styleProps.textColor} onChange={(e) => styleProps.setTextColor(e.target.value)} className="w-8 h-8 border-none rounded cursor-pointer bg-transparent"/>
                        </div>
                         <div className="flex items-center gap-2">
                             <Text className="w-5 h-5 text-slate-500" />
                             <label htmlFor="font-size" className="font-semibold text-sm text-slate-600">Font Size</label>
                             <select id="font-size" value={styleProps.fontSize} onChange={(e) => styleProps.setFontSize(e.target.value as FontSizeSetting)} className="p-1 border border-slate-300 rounded-md text-sm w-full">
                               <option value="normal">Normal</option>
                               <option value="large">Large</option>
                               <option value="extra-large">Extra Large</option>
                             </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="flex items-center gap-2">
                             <Type className="w-5 h-5 text-slate-500" />
                             <label htmlFor="font-theme" className="font-semibold text-sm text-slate-600">Font Style</label>
                             <select id="font-theme" value={styleProps.fontTheme} onChange={(e) => styleProps.setFontTheme(e.target.value as FontTheme)} className="p-1 border border-slate-300 rounded-md text-sm w-full">
                               <option value="classic">Classic (Serif)</option>
                               <option value="modern">Modern (Sans-serif)</option>
                               <option value="elegant">Elegant (Garamond)</option>
                               <option value="whimsical">Whimsical (Handwriting)</option>
                             </select>
                        </div>
                         <div className="flex items-center gap-2">
                            <Baseline className="w-5 h-5 text-slate-500" />
                            <label htmlFor="line-spacing" className="font-semibold text-sm text-slate-600">Line Spacing</label>
                             <input id="line-spacing" type="range" min="1" max="2" step="0.1" value={styleProps.lineSpacing} onChange={(e) => styleProps.setLineSpacing(parseFloat(e.target.value))} className="w-full" />
                             <span className="text-xs font-mono">{styleProps.lineSpacing.toFixed(1)}x</span>
                         </div>
                    </div>
                    <div className="pt-3 border-t">
                        <div className="flex items-center gap-2">
                            <input id="use-outline" type="checkbox" checked={styleProps.useTextOutline} onChange={(e) => styleProps.setUseTextOutline(e.target.checked)} className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"/>
                            <label htmlFor="use-outline" className="font-semibold text-sm text-slate-600">Add text outline for better visibility</label>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* 3. Edit Card Text */}
            <section>
                 <h3 className="text-xl font-bold text-slate-800 mb-4">3. Edit Card Text</h3>
                 <div className="space-y-3 bg-slate-50 p-4 rounded-lg border">
                    <p className="text-xs text-slate-500 flex items-center gap-2"><Info size={14}/>Use <code className="bg-slate-200 text-slate-700 px-1 rounded-sm">{`{secret_santa}`}</code> to insert the giver's name.</p>
                    <div>
                        <label className="text-sm font-semibold text-slate-600">Greeting</label>
                        <input type="text" value={styleProps.greetingText} onChange={e => styleProps.setGreetingText(e.target.value)} className="w-full p-2 mt-1 border border-slate-300 rounded-md text-sm" />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-600">Introductory Line</label>
                        <input type="text" value={styleProps.introText} onChange={e => styleProps.setIntroText(e.target.value)} className="w-full p-2 mt-1 border border-slate-300 rounded-md text-sm" />
                    </div>
                     <div>
                        <label className="text-sm font-semibold text-slate-600">Wishlist Header</label>
                        <input type="text" value={styleProps.wishlistLabelText} onChange={e => styleProps.setWishlistLabelText(e.target.value)} className="w-full p-2 mt-1 border border-slate-300 rounded-md text-sm" />
                    </div>
                 </div>
            </section>
        </div>

        {/* Right Column: Live Preview */}
        <div className="lg:sticky top-24 h-full">
            <h3 className="text-xl font-bold text-slate-800 mb-4">4. Live Preview</h3>
            <div className="w-full max-w-sm mx-auto">
                 <PrintableCard
                    match={sampleMatch}
                    eventDetails={eventDetails}
                    isNameRevealed={true}
                    backgroundOptions={backgroundOptions}
                    bgId={selectedBackgroundId}
                    bgImg={styleProps.customBackground}
                    txtColor={styleProps.textColor}
                    outline={styleProps.useTextOutline}
                    outColor={styleProps.outlineColor}
                    outSize={styleProps.outlineSize}
                    fontSize={styleProps.fontSize}
                    font={styleProps.fontTheme}
                    line={styleProps.lineSpacing}
                    greet={styleProps.greetingText}
                    intro={styleProps.introText}
                    wish={styleProps.wishlistLabelText}
                />
            </div>
        </div>
    </div>
  );
};

export default Options;