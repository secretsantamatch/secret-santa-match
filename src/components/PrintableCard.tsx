import React from 'react';
import type { Match, BackgroundOption, OutlineSizeSetting, FontSizeSetting, FontTheme } from '../types';
import { Edit } from 'lucide-react';

interface PrintableCardProps {
    match: Match;
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
    onReveal?: () => void;
}

const fontClassMap: Record<FontTheme, string> = {
    classic: 'font-serif', // e.g., Playfair Display
    elegant: 'font-[Georgia,serif]',
    modern: 'font-sans', // e.g., Montserrat
    whimsical: 'font-["Comic_Sans_MS",cursive]',
};

const fontSizeMap: Record<FontSizeSetting, string> = {
    normal: 'text-base',
    large: 'text-lg',
    'extra-large': 'text-xl',
};

const outlineSizeMap: Record<OutlineSizeSetting, string> = {
    thin: '1px',
    normal: '2px',
    thick: '3px',
};

const PrintableCard: React.FC<PrintableCardProps> = ({
    match, eventDetails, isNameRevealed, backgroundOptions, bgId, bgImg, txtColor, outline, outColor, outSize, fontSize, font, line, greet, intro, wish, onReveal
}) => {

    const selectedBg = backgroundOptions.find(opt => opt.id === bgId);
    const backgroundUrl = bgImg || (selectedBg?.imageUrl ? (selectedBg.imageUrl.startsWith('/') ? selectedBg.imageUrl : `/${selectedBg.imageUrl}`) : '');
    
    const textShadow = outline ? `${outColor} 0px 0px ${outlineSizeMap[outSize]}` : 'none';
    const fontClassName = fontClassMap[font] || fontClassMap.classic;
    const fontSizeClassName = fontSizeMap[fontSize] || fontSizeMap.normal;

    const formattedGreeting = greet.replace('{secret_santa}', match.giver.name);
    
    const renderLinks = (links: string) => {
        if (!links) return null;
        return links.split('\n').map((link, index) => {
            const trimmed = link.trim();
            if (trimmed) {
                try {
                    // Make sure it's a valid URL before creating a link
                    const url = new URL(trimmed);
                    return <a href={url.href} key={index} target="_blank" rel="noopener noreferrer" className="block text-blue-400 hover:text-blue-300 underline truncate">{url.hostname}</a>;
                } catch (e) {
                    return <p key={index} className="truncate">{trimmed}</p>;
                }
            }
            return null;
        });
    };

    return (
        <div id={`card-${match.giver.id}`} className="printable-card-container aspect-[3/4] w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border">
            <div 
                className="relative w-full h-full p-6 flex flex-col justify-between text-center bg-cover bg-center" 
                style={{ 
                    backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
                    backgroundColor: !backgroundUrl ? '#ffffff' : undefined,
                }}
            >
                {/* Overlay for text readability on busy backgrounds */}
                {backgroundUrl && <div className="absolute inset-0 bg-black/30"></div>}
                
                <div 
                    className={`relative z-10 flex-grow flex flex-col ${fontClassName} ${fontSizeClassName}`}
                    style={{ color: txtColor, textShadow, lineHeight: line }}
                >
                    {/* Header */}
                    <header className="mb-4">
                        <p className="font-semibold">{formattedGreeting}</p>
                        <p className="mt-2">{intro}</p>
                    </header>
                    
                    {/* Receiver Name */}
                    <div
                        className="my-auto"
                        onClick={onReveal}
                        style={{ cursor: onReveal && !isNameRevealed ? 'pointer' : 'default' }}
                    >
                        <div className={`font-bold text-4xl md:text-5xl transition-all duration-500 ${isNameRevealed ? 'blur-0' : 'blur-lg select-none'}`}>
                            {match.receiver.name}
                        </div>
                    </div>

                    {/* Wishlist */}
                    {isNameRevealed && (
                        <div className="text-left mt-4 text-sm space-y-2 overflow-y-auto max-h-48">
                            <h3 className="font-bold text-center mb-2">{wish}</h3>
                            {match.receiver.wishlistId && (
                                <a href={`/wishlist-editor.html?id=${match.receiver.wishlistId}`} target="_blank" rel="noopener noreferrer" className="block text-center bg-white/20 hover:bg-white/30 p-2 rounded-lg font-semibold text-blue-300 mb-3 text-base">
                                    <Edit size={14} className="inline-block mr-2" /> View Live Wishlist
                                </a>
                            )}
                            {match.receiver.budget && <p><strong>Budget:</strong> ${match.receiver.budget}</p>}
                            {match.receiver.interests && <p><strong>Interests:</strong> {match.receiver.interests}</p>}
                            {match.receiver.likes && <p><strong>Likes:</strong> {match.receiver.likes}</p>}
                            {match.receiver.dislikes && <p><strong>Dislikes:</strong> {match.receiver.dislikes}</p>}
                            {match.receiver.links && <div><strong>Links:</strong> {renderLinks(match.receiver.links)}</div>}
                            {!match.receiver.budget && !match.receiver.interests && !match.receiver.likes && !match.receiver.dislikes && !match.receiver.links && (
                                <p className="italic text-center">No wishlist details provided.</p>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                {eventDetails && (
                    <footer className="relative z-10 text-xs mt-4">
                        <p className="font-semibold">Event Details:</p>
                        <p>{eventDetails}</p>
                    </footer>
                )}
            </div>
        </div>
    );
};

export default PrintableCard;