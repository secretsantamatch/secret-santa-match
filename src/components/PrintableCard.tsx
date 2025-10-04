import React, { useEffect, useRef } from 'react';
// Fix: Corrected import paths for types.
import type { Match, FontSizeSetting, OutlineSizeSetting, FontTheme } from '../types';

interface PrintableCardProps {
  match: Match;
  isNameRevealed: boolean;
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

const fontClasses: Record<FontTheme, string> = {
  classic: 'font-serif',
  elegant: 'font-serif',
  modern: 'font-sans',
  whimsical: 'font-sans',
};

const fontSizes: Record<FontSizeSetting, { base: string; header: string; small: string }> = {
  normal: { base: 'text-[15px]', header: 'text-[24px]', small: 'text-[12px]' },
  large: { base: 'text-[17px]', header: 'text-[28px]', small: 'text-[14px]' },
  'extra-large': { base: 'text-[19px]', header: 'text-[32px]', small: 'text-[16px]' },
};

const outlineSizes: Record<OutlineSizeSetting, string> = {
    thin: '1px',
    normal: '2px',
    thick: '3px',
};

const PrintableCard: React.FC<PrintableCardProps> = ({
  match,
  isNameRevealed,
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
  onRendered,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (onRendered) {
      const images = cardRef.current?.querySelectorAll('img');
      const bgImage = customBackground || backgroundImageUrl;

      if (!bgImage || (!images || images.length === 0)) {
        setTimeout(onRendered, 50);
        return;
      }
      
      const imagePromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>(resolve => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      });

      Promise.all(imagePromises).then(() => {
        setTimeout(onRendered, 100);
      });
    }
  }, [onRendered, customBackground, backgroundImageUrl]);
  
  const size = outlineSizes[outlineSize];
  const textShadow = useTextOutline
    ? `${size} 0 0 ${outlineColor}, -${size} 0 0 ${outlineColor}, 0 ${size} 0 ${outlineColor}, 0 -${size} 0 ${outlineColor}, ${size} ${size} 0 ${outlineColor}, -${size} -${size} 0 ${outlineColor}, ${size} -${size} 0 ${outlineColor}, -${size} ${size} 0 ${outlineColor}`
    : 'none';

  const styles: React.CSSProperties = {
    color: textColor,
    textShadow,
    lineHeight: lineSpacing,
  };

  const bgImage = customBackground || backgroundImageUrl;
  const giverName = match.giver.name;
  const receiverName = match.receiver.name;
  
  const finalGreetingText = greetingText.replace('{secret_santa}', giverName);

  return (
    <div
      ref={cardRef}
      className={`w-full h-full p-6 flex flex-col justify-between relative overflow-hidden ${fontClasses[fontTheme]}`}
      style={{
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundColor: bgImage ? 'transparent' : '#f0f0f0',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 text-center" style={styles}>
        <h2 className={`${fontSizes[fontSizeSetting].header} font-bold`}>{finalGreetingText}</h2>
        <p className={`${fontSizes[fontSizeSetting].base} mt-2`}>{introText}</p>
        <div className={`my-4 inline-block px-6 py-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30`}>
          <p className={`${fontSizes[fontSizeSetting].header} font-bold`}>
            {isNameRevealed ? receiverName : 'Tap to Reveal'}
          </p>
        </div>
      </div>
      
      <div className="relative z-10 text-center" style={styles}>
        <h3 className={`${fontSizes[fontSizeSetting].base} font-bold`}>{wishlistLabelText}</h3>
        <p className={`${fontSizes[fontSizeSetting].small}`}>
          {match.receiver.notes || <span className="italic">No notes provided</span>}
        </p>
        {match.receiver.budget && (
          <p className={`${fontSizes[fontSizeSetting].small} mt-1`}>
            <strong>Suggested Budget:</strong> ${match.receiver.budget}
          </p>
        )}
      </div>
      {bgImage && <img src={bgImage} alt="" className="hidden" aria-hidden="true" />}
    </div>
  );
};

export default PrintableCard;
