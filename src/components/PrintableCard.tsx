import React from 'react';
import type { Match, CardStyleData, BackgroundOption, OutlineSizeSetting, FontSizeSetting, FontTheme } from '../types';

interface PrintableCardProps {
  match: Match | { giver: { name: string }, receiver: { name: string, notes: string, budget: string } };
  eventDetails: string;
  isNameRevealed: boolean;
  onReveal?: () => void;
  backgroundOptions: BackgroundOption[];
  // Style props are now individual
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

const PrintableCard: React.FC<PrintableCardProps> = ({ 
  match, eventDetails, isNameRevealed, onReveal, backgroundOptions,
  bgId, bgImg, txtColor, outline, outColor, outSize, fontSize, font, line, greet, intro, wish 
}) => {

  const fontFamilies: Record<string, string> = {
    classic: '"Playfair Display", serif',
    elegant: '"Cormorant Garamond", serif',
    modern: '"Montserrat", sans-serif',
    whimsical: '"Patrick Hand", cursive',
  };

  const fontSizes: Record<string, string> = {
    normal: '1rem',
    large: '1.15rem',
    'extra-large': '1.3rem',
  };

  const outlineSizes: Record<string, string> = {
    thin: '0.5px',
    normal: '1px',
    thick: '2px',
  };

  const dynamicStyles = {
    '--base-font-size': fontSizes[fontSize] || '1rem',
    '--line-spacing': line,
    '--text-color': txtColor,
    '--font-family': fontFamilies[font] || '"Playfair Display", serif',
    textShadow: outline ? `${outSize === 'thin' ? `0 0 ${outlineSizes[outSize]}` : `${outlineSizes[outSize]} ${outlineSizes[outSize]} 0`} ${outColor}, ${outSize === 'thin' ? `0 0 ${outlineSizes[outSize]}` : `-${outlineSizes[outSize]} -${outlineSizes[outSize]} 0`} ${outColor}, ${outSize === 'thin' ? `0 0 ${outlineSizes[outSize]}` : `${outlineSizes[outSize]} -${outlineSizes[outSize]} 0`} ${outColor}, ${outSize === 'thin' ? `0 0 ${outlineSizes[outSize]}` : `-${outlineSizes[outSize]} ${outlineSizes[outSize]} 0`} ${outColor}` : 'none',
  } as React.CSSProperties;

  const backgroundImageUrlRaw = bgImg || (bgId !== 'plain-white' && backgroundOptions.find(b => b.id === bgId)?.imageUrl);
  
  let backgroundImageUrl = backgroundImageUrlRaw;
  if (backgroundImageUrl && !backgroundImageUrl.startsWith('http') && !backgroundImageUrl.startsWith('data:') && !backgroundImageUrl.startsWith('/')) {
    backgroundImageUrl = `/${backgroundImageUrl}`;
  }


  return (
    <div 
        className="printable-card aspect-[3/4] w-full max-w-sm mx-auto rounded-2xl shadow-lg relative overflow-hidden bg-white flex flex-col items-center justify-center p-6" 
        style={dynamicStyles}
    >
      {backgroundImageUrl && (
        <img src={backgroundImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
      )}
      <div className="relative z-10 text-center flex flex-col h-full w-full">
        <div className="flex-grow flex flex-col items-center justify-center text-center">
            <p style={{ color: 'var(--text-color)', fontFamily: 'var(--font-family)', fontSize: 'calc(var(--base-font-size) * 0.9)', lineHeight: 'var(--line-spacing)' }} className="opacity-90">
                {greet.replace('{secret_santa}', match.giver.name)}
            </p>
            <p style={{ color: 'var(--text-color)', fontFamily: 'var(--font-family)', fontSize: 'calc(var(--base-font-size) * 1.1)', lineHeight: 'var(--line-spacing)' }} className="mt-1">
                {intro.replace('{secret_santa}', match.giver.name)}
            </p>
            
            <div className="my-4 w-full">
                {isNameRevealed ? (
                    <>
                      <h2 style={{ color: 'var(--text-color)', fontFamily: 'var(--font-family)', fontSize: 'calc(var(--base-font-size) * 2.25)' }} className="font-bold break-words">
                          {match.receiver.name}
                      </h2>
                      
                      {(match.receiver.notes || match.receiver.budget) && (
                          <div className="mt-4 w-full text-center">
                              <h3 style={{ color: 'var(--text-color)', fontFamily: 'var(--font-family)', fontSize: 'calc(var(--base-font-size) * 0.8)'}} className="font-bold tracking-widest uppercase opacity-70">
                                  {wish}
                              </h3>
                              <div style={{ color: 'var(--text-color)', fontFamily: 'var(--font-family)', fontSize: 'calc(var(--base-font-size) * 0.9)' }} className="mt-1 opacity-90 break-words px-4">
                                  {match.receiver.notes && <p>{match.receiver.notes}</p>}
                                  {match.receiver.budget && <p className="mt-1">{`Budget: $${match.receiver.budget}`}</p>}
                              </div>
                          </div>
                      )}

                      {eventDetails && (
                        <div className="w-full text-center px-4 mt-4">
                          <p style={{ color: 'var(--text-color)', fontFamily: 'var(--font-family)', fontSize: 'calc(var(--base-font-size) * 0.8)' }} className="opacity-80 break-words">
                            {eventDetails}
                          </p>
                        </div>
                      )}
                    </>
                ) : (
                    <div 
                        className="w-full aspect-[3/1] max-w-[80%] mx-auto rounded-xl flex items-center justify-center cursor-pointer bg-white/30 backdrop-blur-sm border border-white/50"
                        onClick={onReveal}
                    >
                        <p style={{ color: 'var(--text-color)', fontFamily: 'var(--font-family)' }} className="text-lg font-semibold opacity-80">Click to Reveal</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableCard;
