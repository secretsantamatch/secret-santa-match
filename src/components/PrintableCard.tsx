import React, { useEffect, useMemo } from 'react';
import type { Match, FontSizeSetting, OutlineSizeSetting, FontTheme } from '../types';

interface PrintableCardProps {
  match: Match;
  eventDetails: string;
  backgroundImageUrl: string | null;
  customBackground: string | null;
  textColor: string;
  useTextOutline: boolean;
  outlineColor: string;
  outlineSize: OutlineSizeSetting;
  fontSizeSetting: FontSizeSetting;
  fontTheme: FontTheme;
  lineSpacing: number;
  greetingText: string;
  introText: string;
  wishlistLabelText: string;
  isPdfMode: boolean;
  onRendered?: () => void;
  isNameRevealed: boolean;
}

const fontFamilies: Record<FontTheme, string> = {
    classic: '"Playfair Display", serif',
    elegant: '"Cormorant Garamond", serif',
    modern: '"Montserrat", sans-serif',
    whimsical: '"Pacifico", cursive',
};

const fontSizes: Record<FontSizeSetting, { base: string, large: string, small: string }> = {
    normal: { base: '1rem', large: '2rem', small: '0.875rem' },
    large: { base: '1.125rem', large: '2.25rem', small: '1rem' },
    'extra-large': { base: '1.25rem', large: '2.5rem', small: '1.125rem' },
};

const outlineSizes: Record<OutlineSizeSetting, string> = {
    thin: '0.5px',
    normal: '1px',
    thick: '2px',
};


const PrintableCard: React.FC<PrintableCardProps> = (props) => {
    const { 
        match, eventDetails, backgroundImageUrl, customBackground, textColor, useTextOutline, outlineColor,
        outlineSize, fontSizeSetting, fontTheme, lineSpacing, greetingText, introText, wishlistLabelText,
        isPdfMode, onRendered, isNameRevealed
    } = props;
    
    useEffect(() => {
        if (onRendered) onRendered();
    }, [onRendered, props]);
    
    const textShadow = useMemo(() => {
        if (!useTextOutline) return 'none';
        const size = outlineSizes[outlineSize];
        return `
            -${size} -${size} 0 ${outlineColor},
             ${size} -${size} 0 ${outlineColor},
            -${size}  ${size} 0 ${outlineColor},
             ${size}  ${size} 0 ${outlineColor},
            -${size} 0 0 ${outlineColor},
             ${size} 0 0 ${outlineColor},
            0 -${size} 0 ${outlineColor},
            0  ${size} 0 ${outlineColor}
        `;
    }, [useTextOutline, outlineColor, outlineSize]);
    
    const dynamicStyles: React.CSSProperties = {
        fontFamily: fontFamilies[fontTheme],
        color: textColor,
        '--base-font-size': fontSizes[fontSizeSetting].base,
        '--large-font-size': fontSizes[fontSizeSetting].large,
        '--small-font-size': fontSizes[fontSizeSetting].small,
        lineHeight: lineSpacing,
        textShadow,
    };
    
    const backgroundStyle: React.CSSProperties = {
        backgroundImage: `url(${customBackground || backgroundImageUrl || ''})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    const parsedGreeting = greetingText.replace('{secret_santa}', match.giver.name);
    const receiverName = isNameRevealed ? match.receiver.name : "Tap to Reveal";

    return (
        <div 
            className="w-full h-full p-8 flex flex-col justify-between text-center overflow-hidden bg-gray-100" 
            style={{ ...dynamicStyles, ...backgroundStyle }}
        >
            <div className="flex-grow flex flex-col items-center justify-center">
                <p className="text-[var(--base-font-size)] opacity-90">{parsedGreeting}</p>
                <p className="text-[var(--base-font-size)] mt-4">{introText}</p>
                <div 
                    className={`my-4 p-4 border-2 border-current rounded-lg ${!isNameRevealed && !isPdfMode ? 'cursor-pointer hover:bg-white/10' : ''}`}
                    style={{
                         fontSize: 'var(--large-font-size)',
                         fontWeight: 700,
                         filter: !isNameRevealed && !isPdfMode ? 'blur(10px)' : 'none',
                         transition: 'filter 0.3s ease-in-out',
                    }}
                >
                    {receiverName}
                </div>
                {(match.receiver.notes || match.receiver.budget) && (
                    <div className="mt-4 text-[var(--small-font-size)] w-full">
                        <h3 className="font-bold opacity-90">{wishlistLabelText}</h3>
                        <p className="opacity-80">
                            {match.receiver.notes}
                            {match.receiver.notes && match.receiver.budget && ' | '}
                            {match.receiver.budget && `Budget: $${match.receiver.budget}`}
                        </p>
                    </div>
                )}
            </div>
            {eventDetails && (
                <div className="mt-auto pt-4 text-[var(--small-font-size)] opacity-70">
                    <p className="font-bold">Event Details:</p>
                    <p>{eventDetails}</p>
                </div>
            )}
        </div>
    );
};

export default PrintableCard;
