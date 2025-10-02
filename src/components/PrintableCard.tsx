import React, { useEffect } from 'react';
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
}

const getProxiedUrl = (url: string) => `https://wsrv.nl/?url=${encodeURIComponent(url)}`;

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
}) => {
  useEffect(() => {
    if (isPdfMode && onRendered) {
      // Allow a short moment for images to potentially load
      const timer = setTimeout(onRendered, 100);
      return () => clearTimeout(timer);
    }
  }, [isPdfMode, onRendered]);

  const fontClass = {
    classic: 'font-serif',
    elegant: 'font-[Cormorant-Garamond,serif]',
    modern: 'font-[Montserrat,sans-serif]',
    whimsical: 'font-[Pacifico,cursive]',
  }[fontTheme];

  const fontSizeClasses = {
    normal: { title: 'text-2xl', body: 'text-sm', small: 'text-xs' },
    large: { title: 'text-3xl', body: 'text-base', small: 'text-sm' },
    'extra-large': { title: 'text-4xl', body: 'text-lg', small: 'text-base' },
  };

  const outlineSizeMap = {
    thin: '1px',
    normal: '2px',
    thick: '3px',
  };

  const textShadow = useTextOutline
    ? `${outlineSizeMap[outlineSize]} ${outlineSizeMap[outlineSize]} 0 ${outlineColor}, -${outlineSizeMap[outlineSize]} -${outlineSizeMap[outlineSize]} 0 ${outlineColor}, ${outlineSizeMap[outlineSize]} -${outlineSizeMap[outlineSize]} 0 ${outlineColor}, -${outlineSizeMap[outlineSize]} ${outlineSizeMap[outlineSize]} 0 ${outlineColor}, ${outlineSizeMap[outlineSize]} 0 0 ${outlineColor}, -${outlineSizeMap[outlineSize]} 0 0 ${outlineColor}, 0 ${outlineSizeMap[outlineSize]} 0 ${outlineColor}, 0 -${outlineSizeMap[outlineSize]} 0 ${outlineColor}`
    : 'none';
  
  const backgroundStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
  
  if (customBackground) {
    backgroundStyle.backgroundImage = `url(${customBackground})`;
  } else if (backgroundImageUrl) {
    // For PDF generation, we don't want to rely on the proxy
    backgroundStyle.backgroundImage = `url(${isPdfMode ? backgroundImageUrl : getProxiedUrl(backgroundImageUrl)})`;
  } else {
    backgroundStyle.backgroundColor = '#ffffff';
  }

  const processedGreeting = greetingText.replace('{secret_santa}', match.giver.name);

  return (
    <div className="aspect-[3/4] w-full max-w-[310px] mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
      <div style={backgroundStyle} className="p-5 flex flex-col text-center relative h-full">
        <div 
            style={{ color: textColor, textShadow, lineHeight: lineSpacing }}
            className={`flex-grow flex flex-col justify-center items-center ${fontClass}`}
        >
          <p className={`${fontSizeClasses[fontSizeSetting].body} mb-2`}>{processedGreeting}</p>
          <p className={`${fontSizeClasses[fontSizeSetting].body} mb-4`}>{introText}</p>
          <h2 className={`${fontSizeClasses[fontSizeSetting].title} font-bold break-words`}>{match.receiver.name}</h2>
        </div>

        {(match.receiver.notes || match.receiver.budget) && (
          <div className="flex-shrink-0 mt-4 pt-3 border-t-2 border-white/50">
            <h3 style={{ color: textColor, textShadow }} className={`${fontSizeClasses[fontSizeSetting].small} font-bold uppercase tracking-wider mb-1 ${fontClass}`}>
                {wishlistLabelText}
            </h3>
            <p style={{ color: textColor, textShadow, lineHeight: lineSpacing }} className={`${fontSizeClasses[fontSizeSetting].body} ${fontClass} break-words`}>
              {match.receiver.notes}
              {match.receiver.notes && match.receiver.budget && <span className="mx-1">|</span>}
              {match.receiver.budget && `Budget: $${match.receiver.budget}`}
            </p>
          </div>
        )}

        {eventDetails && (
          <div className="flex-shrink-0 mt-3">
             <p style={{ color: textColor, textShadow, lineHeight: lineSpacing }} className={`${fontSizeClasses[fontSizeSetting].small} ${fontClass} opacity-80 break-words`}>
                {eventDetails}
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintableCard;
