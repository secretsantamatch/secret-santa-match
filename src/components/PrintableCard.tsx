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
    showWishlistLink?: boolean;
    isPreview?: boolean;
    onReveal?: () => void;
}

const fontClassMap: Record<FontTheme, string> = {
    classic: 'font-serif', // e.g., Playfair Display
    elegant: 'font-[Cormorant Garamond,serif]',
    modern: 'font-sans', // e.g., Montserrat
    whimsical: 'font-[Patrick Hand,cursive]',
};

const fontSizeMap: Record<FontSizeSetting, string> = {
    normal: 'text-sm',
    large: 'text-base',
    'extra-large': 'text-lg',
};

const outlineSizeMap: Record<OutlineSizeSetting, string> = {
    thin: '1px',
    normal: '2px',
    thick: '3px',
};

const PrintableCard: React.FC<PrintableCardProps> = ({
    match, eventDetails, isNameRevealed, backgroundOptions, bgId, bgImg, txtColor, outline, outColor, outSize, fontSize, font, line, greet, intro, wish, showWishlistLink = true, isPreview = false, onReveal
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
                    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
                    return <a href={url.href} key={index} target="_blank" rel="noopener noreferrer" className="block text-blue-400 hover:text-blue-300 underline truncate">{url.hostname}</a>;
                } catch (e) {
                    return <p key={index} className="truncate">{trimmed}</p>;
                }
            }
            return null;
        });
    };

    const wishlistOverflowClass = !isPreview && showWishlistLink ? 'overflow-y-auto' : 'overflow-hidden';

    return (
        <div id={`card-${match.giver.id}`} className="printable-card-container aspect-[3/4] w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border">
            <div 
                className="relative w-full h-full p-6 flex flex-col justify-center text-center bg-cover bg-center" 
                style={{ 
                    backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
                    backgroundColor: !backgroundUrl ? '#ffffff' : undefined,
                }}
            >
                <div 
                    className={`relative z-10 flex flex-col h-full justify-center ${fontClassName} ${fontSizeClassName}`}
                    style={{ color: txtColor, textShadow, lineHeight: line }}
                >
                    {/* Header */}
                    <header className="mb-2">
                        <p className="font-semibold">{formattedGreeting}</p>
                        <p className="mt-1">{intro}</p>
                    </header>
                    
                    {/* Main Content: Name and Wishlist */}
                    <div
                        className="my-2 flex flex-col justify-center"
                        onClick={onReveal}
                        style={{ cursor: onReveal && !isNameRevealed ? 'pointer' : 'default' }}
                    >
                        <div className={`font-bold text-2xl leading-tight break-words transition-all duration-500 ${isNameRevealed ? 'blur-0' : 'blur-lg select-none'}`}>
                            {match.receiver.name}
                        </div>
                        
                        {/* Wishlist */}
                        {isNameRevealed && (
                            <div className={`text-center mt-3 text-xs max-h-48 ${wishlistOverflowClass}`}>
                                <h3 className="font-bold text-center mb-2">{wish}</h3>
                                {showWishlistLink && match.receiver.wishlistId && (
                                    <a href={`/wishlist-editor.html?id=${match.receiver.wishlistId}`} target="_blank" rel="noopener noreferrer" className="block text-center bg-white/20 hover:bg-white/30 p-2 rounded-lg font-semibold text-blue-300 mb-3 text-sm">
                                        <Edit size={14} className="inline-block mr-2" /> View Live Wishlist
                                    </a>
                                )}
                                <div className="space-y-0 text-center">
                                    {match.receiver.budget && <p><strong>Budget:</strong> {match.receiver.budget}</p>}
                                    {match.receiver.interests && <p><strong>Interests:</strong> {match.receiver.interests}</p>}
                                    {match.receiver.likes && <p><strong>Likes:</strong> {match.receiver.likes}</p>}
                                    {match.receiver.dislikes && <p><strong>Dislikes:</strong> {match.receiver.dislikes}</p>}
                                </div>
                                
                                {!isPreview && match.receiver.links && <div className="mt-1"><strong>Links:</strong> {renderLinks(match.receiver.links)}</div>}
                                
                                {eventDetails && (
                                    <div className="mt-3">
                                        <p className="font-semibold">Event Details:</p>
                                        <p>{eventDetails}</p>
                                    </div>
                                )}

                                 {!match.receiver.budget && !match.receiver.interests && !match.receiver.likes && !match.receiver.dislikes && !match.receiver.links && !eventDetails && isNameRevealed && (
                                    <p className="italic text-center text-xs mt-1">No wishlist details provided.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintableCard;