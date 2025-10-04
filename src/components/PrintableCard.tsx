import React, { useEffect, useRef } from 'react';
// Fix: Corrected import path for types.
import type { Match, FontSizeSetting, OutlineSizeSetting, FontTheme } from '../types';

interface PrintableCardProps {
  match: Match;
  eventDetails: string;
  backgroundId: string;
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
  isPdfMode?: boolean;
  onRendered?: () => void;
  isNameRevealed?: boolean;
  onReveal?: () => void;
}

const getProxiedUrl = (url: string) => `https://wsrv.nl/?url=${encodeURIComponent(url)}&n=-1&w=425`;

const fontClasses: Record<FontTheme, string> = {
  classic: 'font-serif',
  elegant: 'font-serif italic',
  modern: 'font-sans',
  whimsical: 'font-sans font-bold',
};

const fontSizeClasses: Record<FontSizeSetting, string> = {
  'normal': 'text-base',
  'large': 'text-lg',
  'extra-large': 'text-xl',
};

const outlineSizeClasses: Record<OutlineSizeSetting, string> = {
    'thin': '1px',
    'normal': '2px',
    'thick': '3px',
};


const PrintableCard: React.FC<PrintableCardProps> = ({
  match,
  eventDetails,
  backgroundImageUrl,
  customBackground,
  textColor,
  useTextOutline,
  outlineColor,
  outlineSize,
  fontSizeSetting,
  fontTheme,
  lineSpacing,
  greetingText,
  introText,
  wishlistLabelText,
  isPdfMode = false,
  onRendered,
  isNameRevealed = false,
  onReveal,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPdfMode && onRendered) {
      const img = cardRef.current?.querySelector('img');
      if (img && !img.complete) {
        img.onload = onRendered;
        img.onerror = onRendered;
        return;
      }
      // Fallback for cases where image might be cached or there's no image
      const timer = setTimeout(() => onRendered(), 100);
      return () => clearTimeout(timer);
    }
  }, [isPdfMode, onRendered, match, backgroundImageUrl, customBackground]);

  const textShadow = useTextOutline
    ? `${outlineColor} -${outlineSizeClasses[outlineSize]} -${outlineSizeClasses[outlineSize]} 0, ${outlineColor} ${outlineSizeClasses[outlineSize]} -${outlineSizeClasses[outlineSize]} 0, ${outlineColor} -${outlineSizeClasses[outlineSize]} ${outlineSizeClasses[outlineSize]} 0, ${outlineColor} ${outlineSizeClasses[outlineSize]} ${outlineSizeClasses[outlineSize]} 0`
    : 'none';

  const finalGreeting = greetingText.replace('{secret_santa}', match.giver.name);
  
  const backgroundStyle: React.CSSProperties = {};
  let backgroundContent;

  if (customBackground) {
      backgroundContent = <img src={customBackground} alt="" className="absolute inset-0 w-full h-full object-cover z-0" />;
  } else if (backgroundImageUrl) {
      backgroundContent = <img src={getProxiedUrl(backgroundImageUrl)} alt="" className="absolute inset-0 w-full h-full object-cover z-0" />;
  } else {
      backgroundStyle.backgroundColor = '#FFFFFF';
  }
  
  return (
    <div
      ref={cardRef}
      className={`relative aspect-[3/4] w-full max-w-[425px] mx-auto bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col justify-between text-center p-6 md:p-8 ${fontClasses[fontTheme]}`}
      style={{ 
          color: textColor, 
          textShadow,
          lineHeight: lineSpacing,
          ...backgroundStyle
       }}
    >
        {backgroundContent}
        <div className="z-10 relative">
            <p className="text-lg font-semibold">{finalGreeting}</p>
            <p className="mt-2 text-base">{introText}</p>

            {isNameRevealed && (
              <div className="my-4">
                <div className="inline-block bg-white/20 backdrop-blur-sm p-3 md:p-4 rounded-xl">
                    <h2 className="text-3xl md:text-4xl font-bold" style={{ color: textColor, textShadow }}>
                        {match.receiver.name}
                    </h2>
                </div>
              </div>
            )}
            
             {!isNameRevealed && onReveal && (
                <div className="my-4">
                    <button 
                        onClick={onReveal}
                        className="bg-white text-gray-800 font-bold py-3 px-8 text-lg rounded-full shadow-md transform hover:scale-105 hover:shadow-xl transition-all"
                    >
                        Click to Reveal
                    </button>
                </div>
             )}
        </div>

        <div className={`z-10 relative text-left bg-black/20 backdrop-blur-sm p-4 rounded-lg ${fontSizeClasses[fontSizeSetting]}`}>
            <h3 className="font-bold mb-1">{wishlistLabelText}</h3>
            {match.receiver.notes || match.receiver.budget ? (
                <>
                {match.receiver.notes && <p>{match.receiver.notes}</p>}
                {match.receiver.budget && <p><span className="font-semibold">Budget:</span> {match.receiver.budget.toString().startsWith('$') ? match.receiver.budget : `$${match.receiver.budget}`}</p>}
                </>
            ) : (
                <p className="italic">No notes provided.</p>
            )}
            {eventDetails && (
                <div className="mt-3 pt-3 border-t border-white/30">
                    <h3 className="font-bold">Event Details:</h3>
                    <p>{eventDetails}</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default PrintableCard;
