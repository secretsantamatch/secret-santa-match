import React from 'react';
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

const getFontClass = (theme: FontTheme): string => {
  switch (theme) {
    case 'elegant':
      return 'font-elegant';
    case 'modern':
      return 'font-modern';
    case 'whimsical':
      return 'font-whimsical';
    case 'classic':
    default:
      return 'font-serif';
  }
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
  isPdfMode,
  onRendered,
  isNameRevealed,
  onReveal,
}) => {
  React.useEffect(() => {
    if (isPdfMode && onRendered) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      let loaded = false;
      const onFinish = () => {
        if (!loaded) {
          loaded = true;
          setTimeout(onRendered, 50);
        }
      };
      img.onload = onFinish;
      img.onerror = onFinish; // Resolve even if image fails to load
      img.src = customBackground || backgroundImageUrl || '';
      setTimeout(onFinish, 1000); // Failsafe timeout
    }
  }, [isPdfMode, onRendered, backgroundImageUrl, customBackground]);

  const fontClass = getFontClass(fontTheme);
  const bodyFontClass = 'font-sans';

  const fontSizes = {
    normal: { title: 'text-3xl', body: 'text-base', small: 'text-sm' },
    large: { title: 'text-4xl', body: 'text-lg', small: 'text-base' },
    'extra-large': { title: 'text-5xl', body: 'text-xl', small: 'text-lg' },
  };

  const outlineSizes = { thin: '1px', normal: '2px', thick: '3px' };

  const textShadow = useTextOutline
    ? `${outlineSizes[outlineSize]} ${outlineSizes[outlineSize]} 0 ${outlineColor}, -${outlineSizes[outlineSize]} -${outlineSizes[outlineSize]} 0 ${outlineColor}, ${outlineSizes[outlineSize]} -${outlineSizes[outlineSize]} 0 ${outlineColor}, -${outlineSizes[outlineSize]} ${outlineSizes[outlineSize]} 0 ${outlineColor}, ${outlineSizes[outlineSize]} 0 0 ${outlineColor}, -${outlineSizes[outlineSize]} 0 0 ${outlineColor}, 0 ${outlineSizes[outlineSize]} 0 ${outlineColor}, 0 -${outlineSizes[outlineSize]} 0 ${outlineColor}`
    : 'none';
  
  const backgroundStyle: React.CSSProperties = { backgroundSize: 'cover', backgroundPosition: 'center' };
  
  if (customBackground) backgroundStyle.backgroundImage = `url(${customBackground})`;
  else if (backgroundImageUrl) backgroundStyle.backgroundImage = `url(${backgroundImageUrl})`;
  else backgroundStyle.backgroundColor = '#ffffff';

  const processedGreeting = greetingText.replace('{secret_santa}', match.giver.name);

  return (
    <div className="aspect-[3/4] w-full max-w-[350px] mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
      <div style={backgroundStyle} className="p-6 flex flex-col text-center relative h-full">
        <div 
            style={{ color: textColor, textShadow, lineHeight: lineSpacing }}
            className="flex-grow flex flex-col justify-center items-center"
        >
          <p className={`${bodyFontClass} ${fontSizes[fontSizeSetting].body} mb-2`}>{processedGreeting}</p>
          <p className={`${bodyFontClass} ${fontSizes[fontSizeSetting].body} mb-4`}>{introText}</p>
          
          <div className="relative w-full min-h-[60px] flex items-center justify-center">
            {isNameRevealed === false ? (
                 <button onClick={onReveal} className="absolute inset-0 flex items-center justify-center w-full transition-opacity duration-500">
                    <div className="relative w-4/5 p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50">
                        <h2 className={`font-bold text-[var(--accent-dark-text)] text-2xl`}>Click to Reveal</h2>
                    </div>
                 </button>
            ) : null}
            <h2 className={`${fontClass} ${fontSizes[fontSizeSetting].title} font-bold break-words transition-opacity duration-500 ${isNameRevealed === false ? 'opacity-0' : 'opacity-100'}`}>
                {match.receiver.name}
            </h2>
          </div>
        </div>

        {(match.receiver.notes || match.receiver.budget) && (
          <div className={`flex-shrink-0 mt-4 pt-3 border-t-2 border-white/50 transition-opacity duration-500 ${isNameRevealed === false ? 'opacity-0' : 'opacity-100'}`}>
            <h3 style={{ color: textColor, textShadow }} className={`${bodyFontClass} ${fontSizes[fontSizeSetting].small} font-bold uppercase tracking-wider mb-1`}>
                {wishlistLabelText}
            </h3>
            <p style={{ color: textColor, textShadow, lineHeight: lineSpacing }} className={`${bodyFontClass} ${fontSizes[fontSizeSetting].body} break-words`}>
              {match.receiver.notes}
              {match.receiver.notes && match.receiver.budget && <span className="mx-1">|</span>}
              {match.receiver.budget && `Budget: $${match.receiver.budget}`}
            </p>
          </div>
        )}

        {eventDetails && (
          <div className={`flex-shrink-0 mt-3 transition-opacity duration-500 ${isNameRevealed === false ? 'opacity-0' : 'opacity-100'}`}>
             <p style={{ color: textColor, textShadow, lineHeight: lineSpacing }} className={`${bodyFontClass} ${fontSizes[fontSizeSetting].small} opacity-80 break-words`}>
                {eventDetails}
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintableCard;
