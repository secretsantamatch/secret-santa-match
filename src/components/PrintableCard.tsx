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
  onReveal?: () => void; // Added for click-to-reveal
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
        isPdfMode, onRendered, isNameRevealed, onReveal
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
    
    // FIX: Cast the style object to React.CSSProperties to allow for CSS custom properties.
    const dynamicStyles = {
        fontFamily: fontFamilies[fontTheme],
        color: textColor,
        '--base-font-size': fontSizes[fontSizeSetting].base,
        '--large-font-size': fontSizes[fontSizeSetting].large,
        '--small-font-size': fontSizes[fontSizeSetting].small,
        lineHeight: lineSpacing,
        textShadow,
    } as React.CSSProperties;
    
    const backgroundStyle: React.CSSProperties = {
        backgroundImage: `url(${customBackground || backgroundImageUrl || ''})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    const parsedGreeting = greetingText.replace('{secret_santa}', match.giver.name);
    
    const renderRevealableName = () => {
        if (isNameRevealed || isPdfMode) {
            return (
                 <div className="my-4 p-4" style={{ fontSize: 'var(--large-font-size)', fontWeight: 700 }}>
                    {match.receiver.name}
                </div>
            )
        }
        return (
            <div 
                className="my-4 p-4 rounded-lg cursor-pointer transition-all duration-300 bg-black/10 hover:bg-black/20 backdrop-blur-sm"
                onClick={onReveal}
                role="button"
                aria-label="Click to reveal name"
            >
                <div 
                    style={{
                         fontSize: 'var(--large-font-size)',
                         fontWeight: 700,
                         filter: 'blur(12px)',
                         opacity: 0.6
                    }}
                >
                   {match.receiver.name}
                </div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-semibold" style={{ textShadow: 'none' }}>Tap to Reveal</span>
                </div>
            </div>
        )
    }

    return (
        <div 
            className="w-full h-full p-6 sm:p-8 flex flex-col justify-between text-center overflow-hidden bg-gray-100" 
            style={{ ...dynamicStyles, ...backgroundStyle }}
        >
            <div className="flex-grow flex flex-col items-center justify-center">
                <p className="text-[var(--base-font-size)] opacity-90">{parsedGreeting}</p>
                <p className="text-[var(--base-font-size)] mt-2 sm:mt-4">{introText}</p>
                
                <div className="relative w-full">
                   {renderRevealableName()}
                </div>

                {(match.receiver.notes || match.receiver.budget) && (
                    <div className="mt-2 sm:mt-4 text-[var(--small-font-size)] w-full max-w-xs mx-auto p-3 bg-black/10 rounded-lg backdrop-blur-sm">
                        <h3 className="font-bold opacity-90">{wishlistLabelText}</h3>
                        <p className="opacity-80 break-words">
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
                    <p className="break-words">{eventDetails}</p>
                </div>
            )}
            <div className="absolute bottom-1 right-2 text-[10px] opacity-50" style={{textShadow: '0 0 2px rgba(0,0,0,0.5)'}}>
                SecretSantaMatch.com
            </div>
        </div>
    );
};

export default PrintableCard;
