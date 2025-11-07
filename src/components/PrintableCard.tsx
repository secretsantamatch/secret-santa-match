import React from 'react';
import type { BackgroundOption, OutlineSizeSetting, FontSizeSetting, FontTheme } from '../types';
import { Gift, Heart, Ban, Link as LinkIcon, DollarSign } from 'lucide-react';

interface PrintableCardProps {
    match: {
        giver: { name: string };
        receiver: {
            name: string;
            interests?: string;
            likes?: string;
            dislikes?: string;
            links?: string;
            budget?: string;
        };
    };
    eventDetails: string;
    isNameRevealed: boolean;
    backgroundOptions: BackgroundOption[];
    bgId: string;
    bgImg: string | null;
    txtColor: string;
    outline: boolean;
    outColor: string;
    outSize: OutlineSizeSetting;
    fontSize: FontSizeSetting;
    font: FontTheme;
    line: number;
    greet: string;
    intro: string;
    wish: string;
}

const fontClassMap: Record<FontTheme, string> = {
    classic: 'font-[serif]',
    elegant: 'font-[serif] italic',
    modern: 'font-[sans-serif]',
    whimsical: 'font-[cursive]'
};

const fontSizeMap: Record<FontSizeSetting, string> = {
    normal: 'text-base',
    large: 'text-lg',
    'extra-large': 'text-xl'
};

const outlineSizeMap: Record<OutlineSizeSetting, string> = {
    thin: '1px',
    normal: '2px',
    thick: '3px'
};

const PrintableCard: React.FC<PrintableCardProps> = ({
    match, eventDetails, isNameRevealed, backgroundOptions, bgId, bgImg, txtColor,
    outline, outColor, outSize, fontSize, font, line, greet, intro, wish
}) => {
    const selectedBg = backgroundOptions.find(opt => opt.id === bgId);
    const backgroundUrl = bgImg || (selectedBg?.imageUrl ? `/${selectedBg.imageUrl}`.replace('//', '/') : '');
    
    const textShadow = outline ? `${outColor} 0px 0px ${outlineSizeMap[outSize]}` : 'none';

    const renderLinks = (links: string) => {
        return links.split('\n').filter(link => link.trim() !== '').map((link, index) => {
            let displayLink = link;
            try {
                // Use a simple regex for URL validation to avoid constructor errors with partial inputs
                if (/^https?:\/\//.test(link)) {
                    const url = new URL(link);
                    displayLink = url.hostname;
                }
            } catch (e) { /* not a valid url, display as is */ }

            return (
                <a href={link} key={index} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                    <LinkIcon size={14} />
                    <span>{displayLink}</span>
                </a>
            );
        });
    };

    const renderList = (items: string, icon: React.ReactNode) => {
        return items.split(',').map(item => item.trim()).filter(Boolean).map((item, index) => (
            <div key={index} className="flex items-start gap-2">
                <div className="mt-1 flex-shrink-0">{icon}</div>
                <span>{item}</span>
            </div>
        ));
    };
    
    const formattedGreeting = greet.replace('{secret_santa}', match.giver.name);

    return (
        <div id={`card-${match.giver.name.replace(/\s+/g, '-')}`} className="aspect-[3/4] w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200 relative text-center flex flex-col justify-between p-6 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundUrl})` }}>
            <div className="absolute inset-0 bg-black/20" style={{ mixBlendMode: 'multiply' }}></div>
            <div className="relative z-10 flex flex-col h-full" style={{ color: txtColor, textShadow, lineHeight: line, fontFamily: `var(--font-${font})`}}>
                
                <header className={fontSizeMap[fontSize]}>
                    <p className="font-bold text-xl md:text-2xl">{formattedGreeting}</p>
                    <p className="mt-2">{intro}</p>
                </header>

                <div className="my-auto">
                    {isNameRevealed ? (
                        <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                            <h2 className="text-4xl md:text-5xl font-bold break-words">{match.receiver.name}</h2>
                        </div>
                    ) : (
                        <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl cursor-pointer">
                            <h2 className="text-3xl md:text-4xl font-bold">Click to Reveal</h2>
                        </div>
                    )}
                </div>

                <div className={`text-left ${fontSizeMap[fontSize]} space-y-4`}>
                    <h3 className="font-bold text-lg md:text-xl border-b-2 pb-1" style={{ borderColor: txtColor }}>{wish}</h3>
                    <div className="space-y-3 text-sm md:text-base max-h-48 overflow-y-auto pr-2">
                        {match.receiver.budget && <div className="flex items-center gap-2"><DollarSign size={16} /><strong>Budget:</strong> ${match.receiver.budget}</div>}
                        {match.receiver.interests && renderList(match.receiver.interests, <Gift size={16} className="text-green-300" />)}
                        {match.receiver.likes && renderList(match.receiver.likes, <Heart size={16} className="text-pink-300" />)}
                        {match.receiver.dislikes && renderList(match.receiver.dislikes, <Ban size={16} className="text-red-300" />)}
                        {match.receiver.links && <div className="space-y-1">{renderLinks(match.receiver.links)}</div>}
                    </div>
                </div>

                {eventDetails && (
                    <footer className={`mt-4 pt-2 border-t-2 ${fontSizeMap[fontSize]}`} style={{ borderColor: txtColor }}>
                        <p className="font-bold">Event Details:</p>
                        <p className="text-sm md:text-base whitespace-pre-wrap">{eventDetails}</p>
                    </footer>
                )}
            </div>
        </div>
    );
};

export default PrintableCard;
