import React, { useState, useEffect } from 'react';
import type { Match, BackgroundOption, OutlineSizeSetting, FontSizeSetting, FontTheme } from '../types';
import LinkPreview from './LinkPreview';

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
  isForPdf?: boolean;
  showLinks?: boolean;
}

const PrintableCard: React.FC<PrintableCardProps> = ({
  match,
  eventDetails,
  isNameRevealed,
  backgroundOptions,
  bgId,
  bgImg,
  txtColor,
  outline,
  outColor,
  outSize,
  fontSize,
  font,
  line,
  greet,
  intro,
  wish,
  isForPdf = false,
  showLinks = true,
}) => {
  const { giver, receiver } = match;
  const [animatedName, setAnimatedName] = useState<React.ReactNode>('??????????');
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const backgroundUrl = bgImg || backgroundOptions.find(opt => opt.id === bgId)?.imageUrl || '';

  useEffect(() => {
    if (isNameRevealed && !isForPdf) {
      setIsAnimationComplete(false); // Reset on new reveal
      const finalName = receiver.name;
      
      // Start countdown
      setAnimatedName('3');
      
      const timeout1 = setTimeout(() => {
        setAnimatedName('2');
      }, 800);

      const timeout2 = setTimeout(() => {
        setAnimatedName('1');
      }, 1600);
      
      const timeout3 = setTimeout(() => {
        setAnimatedName(finalName);
        setIsAnimationComplete(true);
      }, 2400);

      // Cleanup function
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
      };

    } else if (!isNameRevealed) {
      setAnimatedName('??????????');
      setIsAnimationComplete(false); // Reset when hiding
    }
  }, [isNameRevealed, receiver.name, isForPdf]);

  const fontFamilies: Record<FontTheme, string> = {
    classic: "'Playfair Display', serif",
    modern: "'Montserrat', sans-serif",
    elegant: "'Cormorant Garamond', serif",
    whimsical: "'Patrick Hand', cursive",
  };
  
  const outlineSizeMap: Record<OutlineSizeSetting, string> = { 'thin': '0.5px', 'normal': '1px', 'thick': '1.5px' };
  const textShadow = outline
    ? `
        -${outlineSizeMap[outSize]} -${outlineSizeMap[outSize]} 0 ${outColor},
         ${outlineSizeMap[outSize]} -${outlineSizeMap[outSize]} 0 ${outColor},
        -${outlineSizeMap[outSize]}  ${outlineSizeMap[outSize]} 0 ${outColor},
         ${outlineSizeMap[outSize]}  ${outlineSizeMap[outSize]} 0 ${outColor},
        -${outlineSizeMap[outSize]} 0 0 ${outColor},
         ${outlineSizeMap[outSize]} 0 0 ${outColor},
        0 -${outlineSizeMap[outSize]} 0 ${outColor},
        0  ${outlineSizeMap[outSize]} 0 ${outColor}
      `
    : 'none';
  
  const formattedGreeting = greet.replace('{secret_santa}', giver.name);

  const baseFontSizeMap: Record<FontSizeSetting, { header: string, name: string, wishlist: string, event: string }> = {
    'normal':      { header: '1rem',      name: '2.5rem', wishlist: '0.75rem', event: '0.65rem' },
    'large':       { header: '1.1rem',    name: '2.9rem', wishlist: '0.85rem', event: '0.75rem' },
    'extra-large': { header: '1.2rem',    name: '3.3rem', wishlist: '0.95rem', event: '0.85rem' },
  };
  const baseSizes = baseFontSizeMap[fontSize];

  const renderWishlistItem = (label: string, value: string | undefined) => {
    if (!value || value.trim() === '') return null;
    return <li><strong className="font-semibold">{label}:</strong> <span>{value}</span></li>;
  };
  
  const hasLinks = Array.isArray(receiver.links) && receiver.links.some(link => link && link.trim() !== '');

  const commonTextStyle: React.CSSProperties = { 
      color: txtColor, 
      textShadow,
      overflowWrap: 'break-word',
      wordBreak: 'break-all',
  };

  const showWishlistDetails = (isForPdf && isNameRevealed) || isAnimationComplete;

  return (
    <div 
        className="w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg relative bg-white bg-cover bg-center transition-all duration-300" 
        style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      <div 
        className="absolute inset-0 flex flex-col items-center text-center p-[8%]"
        style={{ fontFamily: fontFamilies[font] }}
      >
        {/* Main Content (grows to fill space and centers its content vertically) */}
        <div className="w-full flex-grow flex flex-col justify-center items-center">
            
            {/* Header Text (Greeting/Intro) */}
            <div className="w-full" style={{ lineHeight: line }}>
                <h2 
                    className="font-bold"
                    style={{ ...commonTextStyle, fontSize: baseSizes.header }}
                >
                    {formattedGreeting}
                </h2>
                <p style={{ ...commonTextStyle, fontSize: `calc(${baseSizes.header} * 0.85)` }}>
                    {intro}
                </p>
            </div>

            {/* Receiver Name */}
            <h1
                className="font-bold my-1 break-words"
                style={{
                    ...commonTextStyle,
                    fontFamily: fontFamilies.classic,
                    fontSize: baseSizes.name,
                    lineHeight: 1.1,
                    letterSpacing: isNameRevealed ? 'normal' : '0.2em'
                }}
            >
                {isForPdf ? (isNameRevealed ? receiver.name : '??????????') : animatedName}
            </h1>
            
            {/* Wishlist and Event Details */}
            {showWishlistDetails && (
              <div className="w-full self-center mt-4">
                  <div className="flex flex-col items-center">
                      <h3 className="font-bold" style={{...commonTextStyle, fontSize: baseSizes.header, marginBottom: '0.25em' }}>{wish}</h3>
                      <ul className="list-none space-y-0 p-0 m-0 text-left" style={{ display: 'inline-block', ...commonTextStyle, fontSize: baseSizes.wishlist, lineHeight: 1.3 }}>
                          {renderWishlistItem('Interests', receiver.interests)}
                          {renderWishlistItem('Likes', receiver.likes)}
                          {renderWishlistItem('Dislikes', receiver.dislikes)}
                          {renderWishlistItem('Budget', receiver.budget)}
                      </ul>
                  </div>
                  
                  {hasLinks && showLinks && (
                      <div className="mt-2 text-center">
                          <h4 className="font-bold" style={{...commonTextStyle, fontSize: `calc(${baseSizes.header} * 0.9)`}}>Wishlist Links:</h4>
                          <div className="space-y-1 mt-1">{receiver.links.map((link, index) => (link.trim() ? <LinkPreview key={index} url={link} isForPdf={isForPdf} /> : null))}</div>
                      </div>
                  )}
                  
                  {eventDetails && <p className="opacity-90 mt-4" style={{...commonTextStyle, fontSize: baseSizes.event }}>{eventDetails}</p>}
              </div>
            )}
        </div>
        
        {/* Footer */}
        <div className="w-full flex-shrink-0">
            {(bgId === 'custom' || !backgroundUrl) && 
                <p className="text-xs opacity-70" style={{ color: txtColor, textShadow }}>SecretSantaMatch.com</p>
            }
        </div>
      </div>
    </div>
  );
};

export default PrintableCard;