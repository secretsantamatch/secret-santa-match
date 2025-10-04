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
}

const getProxiedUrl = (url: string) => `https://wsrv.nl/?url=${encodeURIComponent(url)}&n=-1`;

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
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onRendered) {
      // Allow a short time for images to potentially load before rendering PDF
      const timer = setTimeout(() => {
        onRendered();
      }, isPdfMode ? 250 : 50);
      return () => clearTimeout(timer);
    }
  }, [match, backgroundImageUrl, customBackground, onRendered, isPdfMode]);

  const getFontSizeClasses = () => {
    switch (fontSizeSetting) {
      case 'large': return { base: 'text-lg', receiver: 'text-4xl', details: 'text-base' };
      case 'extra-large': return { base: 'text-xl', receiver: 'text-5xl', details: 'text-lg' };
      default: return { base: 'text-base', receiver: 'text-3xl', details: 'text-sm' };
    }
  };
  
  const getFontThemeClass = () => {
    switch (fontTheme) {
        case 'elegant':
        case 'classic': 
            return 'font-serif';
        case 'whimsical':
        case 'modern': 
            return 'font-sans';
        default: 
            return 'font-serif';
    }
  };

  const getOutlineStyle = () => {
    if (!useTextOutline) return {};
    const sizeMap = { thin: '1px', normal: '2px', thick: '3px' };
    const shadowSize = sizeMap[outlineSize] || '2px';
    return {
      textShadow: `
        -${shadowSize} -${shadowSize} 0 ${outlineColor},
         ${shadowSize} -${shadowSize} 0 ${outlineColor},
        -${shadowSize}  ${shadowSize} 0 ${outlineColor},
         ${shadowSize}  ${shadowSize} 0 ${outlineColor}
      `,
    };
  };
  
  const finalBackgroundImageUrl = customBackground ? customBackground : (backgroundImageUrl ? getProxiedUrl(backgroundImageUrl) : undefined);
  const { giver, receiver } = match;

  const fontSizes = getFontSizeClasses();

  return (
    <div
      ref={cardRef}
      className={`aspect-[4.25/5.5] w-full bg-cover bg-center rounded-xl shadow-lg overflow-hidden flex flex-col justify-between text-center p-6 ${getFontThemeClass()}`}
      style={{
        backgroundImage: finalBackgroundImageUrl ? `url("${finalBackgroundImageUrl}")` : 'linear-gradient(to bottom, #f3f4f6, #e5e7eb)',
        color: textColor,
        lineHeight: lineSpacing,
        ...getOutlineStyle()
      }}
    >
      <div className={`greeting-section ${fontSizes.base}`}>
        <p>{greetingText.replace('{secret_santa}', giver.name)}</p>
        <p className="mt-2">{introText}</p>
      </div>

      <div className="receiver-section">
        <h2 className={`font-bold break-words ${fontSizes.receiver}`}>
          {isNameRevealed ? receiver.name : '????????'}
        </h2>
      </div>

      <div className={`details-section ${fontSizes.details}`}>
        {(receiver.notes || receiver.budget) && (
            <div className="bg-black/20 backdrop-blur-sm p-3 rounded-lg mt-4 max-h-24 overflow-y-auto">
                <p className="font-bold">{wishlistLabelText}</p>
                {receiver.notes && <p>{receiver.notes}</p>}
                {receiver.budget && <p>Suggested Budget: ${receiver.budget}</p>}
            </div>
        )}
        {eventDetails && <p className="mt-3 opacity-90">{eventDetails}</p>}
      </div>
    </div>
  );
};

export default PrintableCard;
