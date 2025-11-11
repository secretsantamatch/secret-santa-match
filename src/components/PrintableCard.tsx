import React, { useMemo } from 'react';
import type { Match, BackgroundOption, OutlineSizeSetting, FontSizeSetting, FontTheme } from '../types';

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
}

const fontClasses: Record<FontTheme, string> = {
    classic: 'font-serif',
    elegant: 'font-[Cormorant Garamond, serif]',
    modern: 'font-sans',
    whimsical: 'font-[Patrick Hand, cursive]'
};

const fontSizeClasses: Record<FontSizeSetting, { base: string, header: string, name: string }> = {
    normal: { base: 'text-sm', header: 'text-2xl', name: 'text-4xl' },
    large: { base: 'text-base', header: 'text-3xl', name: 'text-5xl' },
    'extra-large': { base: 'text-lg', header: 'text-4xl', name: 'text-6xl' }
};

const outlineSizeMap: Record<OutlineSizeSetting, string> = {
    thin: '1px',
    normal: '2px',
    thick: '3px'
};

const PrintableCard: React.FC<PrintableCardProps> = ({
  match, eventDetails, isNameRevealed, backgroundOptions, bgId, bgImg,
  txtColor, outline, outColor, outSize, fontSize, font, line, greet, intro, wish
}) => {
    const { giver, receiver } = match;

    const backgroundUrl = useMemo(() => {
        if (bgId === 'custom' && bgImg) {
            return bgImg;
        }
        const selectedOption = backgroundOptions.find(opt => opt.id === bgId);
        return selectedOption ? selectedOption.imageUrl : (backgroundOptions[0]?.imageUrl || '');
    }, [bgId, bgImg, backgroundOptions]);

    const textShadow = useMemo(() => {
        if (!outline) return 'none';
        const size = outlineSizeMap[outSize];
        const color = outColor || '#000000';
        return `${size} ${size} 0 ${color}, -${size} -${size} 0 ${color}, ${size} -${size} 0 ${color}, -${size} ${size} 0 ${color}, ${size} 0 0 ${color}, -${size} 0 0 ${color}, 0 ${size} 0 ${color}, 0 -${size} 0 ${color}`;
    }, [outline, outColor, outSize]);
    
    const hasDetails = receiver.interests || receiver.likes || receiver.dislikes || receiver.links || receiver.budget;
    const currentFontSize = fontSizeClasses[fontSize];

    // Auto-fit name logic
    const nameLength = receiver.name.length;
    let nameSizeClass = currentFontSize.name;
    if (nameLength > 15) {
      nameSizeClass = `text-3xl`; // smaller than text-4xl
    } else if (nameLength > 10) {
      nameSizeClass = currentFontSize.header;
    }
    
    const renderLinks = (links: string) => {
        return links.split('\n').filter(Boolean).map((link, i) => {
            let href = link.trim();
            if (!href.startsWith('http://') && !href.startsWith('https://')) {
                href = `https://${href}`;
            }
            try {
                // To check if it's a valid URL, otherwise render as text
                new URL(href);
                return <li key={i}><a href={href} target="_blank" rel="noopener noreferrer" className="underline break-all">{link.trim()}</a></li>;
            } catch {
                return <li key={i} className="break-all">{link.trim()}</li>;
            }
        });
    }

    return (
        <div 
            id={`printable-card-${giver.id}`} 
            className="printable-card-container aspect-[3/4] w-full bg-white text-black relative shadow-lg overflow-hidden select-none rounded-xl"
        >
            {backgroundUrl ? (
                <img src={backgroundUrl} alt="Card background" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
                <div className="absolute inset-0 bg-white"></div>
            )}
            <div
                className={`absolute inset-0 pt-8 pb-4 px-6 flex flex-col text-center ${currentFontSize.base}`}
                style={{
                    color: txtColor,
                    textShadow: textShadow,
                    lineHeight: line,
                }}
            >
                <header className={`${fontClasses[font]}`}>
                    <h2 className={`${currentFontSize.header} font-bold`}>{greet.replace('{secret_santa}', giver.name)}</h2>
                    <p className="mt-2">{intro}</p>
                </header>

                <main className="my-4 flex-grow flex items-center justify-center">
                    {isNameRevealed ? (
                        <p className={`font-serif font-extrabold tracking-tight break-words ${nameSizeClass}`}>{receiver.name}</p>
                    ) : (
                        <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
                            <p className="text-lg">Your match is hidden!</p>
                            <p className="text-sm">Click the button to reveal your person.</p>
                        </div>
                    )}
                </main>

                <footer className="font-sans text-left max-h-[45%] overflow-y-auto p-3 rounded-lg scrollbar-thin mt-auto">
                    {isNameRevealed && hasDetails && (
                        <>
                            <h3 className="font-bold text-lg mb-2">{wish}</h3>
                            <ul className="space-y-1.5 list-disc list-inside">
                                {receiver.budget && <li><strong>Budget:</strong> {receiver.budget}</li>}
                                {receiver.interests && <li><strong>Interests:</strong> {receiver.interests}</li>}
                                {receiver.likes && <li><strong>Likes:</strong> {receiver.likes}</li>}
                                {receiver.dislikes && <li><strong>Dislikes:</strong> {receiver.dislikes}</li>}
                                {receiver.links && <li className="list-none -ml-4"><strong>Links:</strong><ul className="pl-4">{renderLinks(receiver.links)}</ul></li>}
                            </ul>
                        </>
                    )}
                    {isNameRevealed && !hasDetails && (
                         <p className="italic">No wishlist details were provided for {receiver.name}.</p>
                    )}
                     {isNameRevealed && eventDetails && (
                        <p className="mt-3 pt-3 border-t border-white/30 italic text-sm">{eventDetails}</p>
                    )}
                </footer>
                 <p className="text-center text-[8px] absolute bottom-1 left-1/2 -translate-x-1/2 opacity-70" style={{ textShadow: '1px 1px 2px #000' }}>SecretSantaMatch.com</p>
            </div>
        </div>
    );
};

export default PrintableCard;