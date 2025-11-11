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
  const [hoveredBgId, setHoveredBgId] = useState<string | null>(null);

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

  // Determine which props to display based on hover state
  const displayBgId = hoveredBgId || selectedBackgroundId;
  const displayBgImg = displayBgId === 'custom' ? styleProps.customBackground : null;
  
  const hoveredOption = backgroundOptions.find(opt => opt.id === hoveredBgId);
  const selectedOption = backgroundOptions.find(opt => opt.id === selectedBackgroundId);
  
  // Use hover state for preview, otherwise use the actual state
  const displayTextColor = hoveredOption?.defaultTextColor ?? styleProps.textColor;
  const displayGreetingText = hoveredOption?.cardText?.greeting ?? styleProps.greetingText;
  const displayIntroText = hoveredOption?.cardText?.intro ?? styleProps.introText;
  const displayWishlistLabelText = hoveredOption?.cardText?.wishlistLabel ?? styleProps.wishlistLabelText;
  const displayBgOption = hoveredOption || selectedOption;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 lg:items-start">
        {/* Left Column: Controls */}
        <div className="space-y-8">
            {/* 1. Choose a Theme */}
            <section onMouseLeave={() => setHoveredBgId(null)}>
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
                 <div className="max-h-96 overflow-y-auto pr-2">
                    <BackgroundSelector
                        selected={selectedBackgroundId}
                        setSelectedBackgroundId={setSelectedBackgroundId}
                        setHoveredBackgroundId={setHoveredBgId}
                        customBackground={styleProps.customBackground}
                        setCustomBackground={styleProps.setCustomBackground}
                        backgroundOptions={filteredThemes}
                        onTextColorChange={styleProps.setTextColor}
                    />
                </div>
                <div className="flex items-start gap-2 text-slate-500 text-xs mt-3 bg-slate-50 p-2 rounded-md">
                   <Info size={14} className="flex-shrink-0 mt-0.5" />
                   <p>Hover to preview, click to select. Recommended image size for custom uploads: 3:4 ratio, under 3MB.</p>
                </div>
            </section>
            
            {/* 2. Customize Text Style */}
            <section>
                <h3 className="text-xl font-bold text-slate-800 mb-4">2. Customize Text Style</h3>
                <div className="space-y-4 bg-slate-50 p-4 rounded-lg border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        {/* Text Color */}
                        <div className="flex items-center justify-between">
                            <label htmlFor="text-color" className="flex items-center gap-2 font-semibold text-sm text-slate-600">
                                <Palette className="w-5 h-5" /> Text Color
                            </label>
                            <input id="text-color" type="color" value={styleProps.textColor} onChange={(e) => styleProps.setTextColor(e.target.value)} className="w-10 h-8 p-0 border-none rounded cursor-pointer bg-transparent"/>
                        </div>
                        {/* Font Size */}
                        <div className="flex items-center justify-between">
                            <label htmlFor="font-size" className="flex items-center gap-2 font-semibold text-sm text-slate-600">
                                <Text className="w-5 h-5" /> Font Size
                            </label>
                            <select id="font-size" value={styleProps.fontSize} onChange={(e) => styleProps.setFontSize(e.target.value as FontSizeSetting)} className="p-1 border border-slate-300 rounded-md text-sm w-32">
                                <option value="normal">Normal</option>
                                <option value="large">Large</option>
                                <option value="extra-large">Extra Large</option>
                            </select>
                        </div>
                        {/* Font Style */}
                        <div className="flex items-center justify-between">
                            <label htmlFor="font-theme" className="flex items-center gap-2 font-semibold text-sm text-slate-600">
                                <Type className="w-5 h-5" /> Font Style
                            </label>
                            <select id="font-theme" value={styleProps.fontTheme} onChange={(e) => styleProps.setFontTheme(e.target.value as FontTheme)} className="p-1 border border-slate-300 rounded-md text-sm w-32">
                                <option value="classic">Classic (Serif)</option>
                                <option value="modern">Modern (Sans)</option>
                                <option value="elegant">Elegant (Garamond)</option>
                                <option value="whimsical">Whimsical (Hand)</option>
                            </select>
                        </div>
                        {/* Line Spacing */}
                        <div className="flex items-center justify-between gap-2">
                            <label htmlFor="line-spacing" className="flex items-center gap-2 font-semibold text-sm text-slate-600">
                                <Baseline className="w-5 h-5" /> Line Spacing
                            </label>
                            <input id="line-spacing" type="range" min="1" max="2" step="0.1" value={styleProps.lineSpacing} onChange={(e) => styleProps.setLineSpacing(parseFloat(e.target.value))} className="w-full max-w-[70px]" />
                            <span className="text-xs font-mono w-8 text-right">{styleProps.lineSpacing.toFixed(1)}x</span>
                        </div>
                    </div>

                    <div className="pt-3 border-t">
                        <div className="flex items-center gap-2">
                            <input id="use-outline" type="checkbox" checked={styleProps.useTextOutline} onChange={(e) => styleProps.setUseTextOutline(e.target.checked)} className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"/>
                            <label htmlFor="use-outline" className="font-semibold text-sm text-slate-600">Add text outline for better visibility</label>
                        </div>
                    </div>

                    {styleProps.useTextOutline && (
                        <div className="pt-3 border-t grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                           <div className="flex items-center justify-between">
                             <label htmlFor="outline-color" className="flex items-center gap-2 font-semibold text-sm text-slate-600">
                                 <Droplet className="w-5 h-5" /> Outline Color
                            </label>
                             <input id="outline-color" type="color" value={styleProps.outlineColor} onChange={(e) => styleProps.setOutlineColor(e.target.value)} className="w-10 h-8 p-0 border-none rounded cursor-pointer bg-transparent"/>
                           </div>
                           <div className="flex items-center justify-between">
                               <label htmlFor="outline-size" className="flex items-center gap-2 font-semibold text-sm text-slate-600">
                                   <BoxSelect className="w-5 h-5" /> Outline Size
                                </label>
                               <select id="outline-size" value={styleProps.outlineSize} onChange={(e) => styleProps.setOutlineSize(e.target.value as OutlineSizeSetting)} className="p-1 border border-slate-300 rounded-md text-sm w-32">
                                   <option value="thin">Thin</option>
                                   <option value="normal">Normal</option>
                                   <option value="thick">Thick</option>
                               </select>
                           </div>
                        </div>
                    )}
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
                        <label className="text-sm font-semibold text-slate-600">Wishlist Label</label>
                        <input type="text" value={styleProps.wishlistLabelText} onChange={e => styleProps.setWishlistLabelText(e.target.value)} className="w-full p-2 mt-1 border border-slate-300 rounded-md text-sm" />
                    </div>
                 </div>
            </section>
        </div>

        {/* Right Column: Live Preview */}
        <div className="lg:sticky top-24">
            <h3 className="text-xl font-bold text-slate-800 mb-4">4. Live Preview</h3>
            <div className="w-full max-w-sm mx-auto">
                 <PrintableCard
                    match={sampleMatch}
                    eventDetails={eventDetails}
                    isNameRevealed={true}
                    backgroundOptions={backgroundOptions}
                    bgId={displayBgOption?.id ?? ''}
                    bgImg={displayBgId === 'custom' ? styleProps.customBackground : (displayBgOption?.imageUrl ?? '')}
                    txtColor={displayTextColor}
                    outline={styleProps.useTextOutline}
                    outColor={styleProps.outlineColor}
                    outSize={styleProps.outlineSize}
                    fontSize={styleProps.fontSize}
                    font={styleProps.fontTheme}
                    line={styleProps.lineSpacing}
                    greet={displayGreetingText}
                    intro={displayIntroText}
                    wish={displayWishlistLabelText}
                />
            </div>
        </div>
    </div>
  );
};

export default Options;