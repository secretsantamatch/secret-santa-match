import React from 'react';
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

  const backgroundUrl = bgImg || backgroundOptions.find(opt => opt.id === bgId)?.imageUrl || '';
  const showWatermark = bgId === 'custom';

  const fontFamilies: Record<FontTheme, string> = {
    classic: "'Playfair Display', serif",
    modern: "'Montserrat', sans-serif",
    elegant: "'Cormorant Garamond', serif",
    whimsical: "'Patrick Hand', cursive",
  };
  
  const outlineSizeMap: Record<OutlineSizeSetting, string> = {
    'thin': '1px', 'normal': '1.5px', 'thick': '2px',
  };

  const createTextShadow = (size: OutlineSizeSetting, color: string): string => {
    const s = outlineSizeMap[size];
    const shadows = [ `-${s} -${s} 0 ${color}`, `${s} -${s} 0 ${color}`, `-${s} ${s} 0 ${color}`, `${s} ${s} 0 ${color}` ];
    return shadows.join(', ');
  };
  
  const textShadow = outline ? createTextShadow(outSize, outColor) : 'none';
  
  const receiverName = isNameRevealed ? receiver.name : '????????';
  const formattedGreeting = greet.replace('{secret_santa}', giver.name);

  // Auto-sizing logic for adaptive text
  const greetingLength = formattedGreeting.length;
  const introLength = intro.length;
  const receiverNameLength = receiverName.length;
  const wishlistContent = [receiver.interests, receiver.likes, receiver.dislikes, receiver.budget].join(' ');
  const wishlistLength = wishlistContent.length;

  const getHeaderFontSize = () => {
    const maxLength = Math.max(greetingLength, introLength);
    // More aggressive scaling for header text
    if (maxLength > 45) return 'text-[10px]';
    if (maxLength > 38) return 'text-xs';
    if (maxLength > 30) return 'text-sm';
    if (maxLength > 22) return 'text-base';
    
    if (fontSize === 'extra-large') return 'text-lg';
    if (fontSize === 'large') return 'text-lg';
    return 'text-base';
  };
  
  const getReceiverNameFontSize = () => {
    // More aggressive scaling to prevent wrapping of long names
    if (receiverNameLength > 28) return 'text-lg';
    if (receiverNameLength > 22) return 'text-xl';
    if (receiverNameLength > 18) return 'text-2xl';
    if (receiverNameLength > 14) return 'text-3xl';
    if (receiverNameLength > 10) return 'text-4xl';
    if (receiverNameLength > 8) return 'text-5xl';
    
    let baseSize = 'text-6xl';
    if (fontSize === 'large') baseSize = 'text-6xl';
    if (fontSize === 'extra-large') baseSize = 'text-7xl';
    return baseSize;
  };
  
  const getWishlistFontSize = () => {
    // This function provides more granular control over font size based on content length
    // to prevent awkward wrapping.
    if (wishlistLength > 150) return 'text-[8px]';
    if (wishlistLength > 120) return 'text-[9px]';
    if (wishlistLength > 90) return 'text-[10px]';
    if (wishlistLength > 60) return 'text-[11px]';

    // Base sizes from user settings
    if (fontSize === 'extra-large') return 'text-sm'; // 14px
    if (fontSize === 'large') return 'text-sm'; // 14px
    return 'text-xs'; // 12px
  };

  const renderWishlistItem = (label: string, value: string | undefined) => {
    if (!value || value.trim() === '') return null;
    
    return (
      <li className="break-words">
        <strong className="font-bold">{label}:</strong> <span>{value}</span>
      </li>
    );
  };
  
  const hasLinks = Array.isArray(receiver.links) && receiver.links.some(link => link && link.trim() !== '');

  return (
    <div 
        className={`printable-card-container w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg relative bg-cover bg-center ${isForPdf ? '' : 'transition-all duration-300'}`} 
        style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      <div
        className="absolute inset-0 flex flex-col items-center justify-evenly py-12 sm:py-16 px-4 sm:px-12 md:px-16 text-center"
        style={{ color: txtColor, textShadow, fontFamily: fontFamilies[font] }}
      >
        {/* Header */}
        <header 
          className={getHeaderFontSize()}
          style={{ lineHeight: line }}
        >
          <p className="font-bold whitespace-nowrap">{formattedGreeting}</p>
          <p className="mt-1 whitespace-nowrap">{intro}</p>
        </header>

        {/* Receiver Name */}
        <main style={{ lineHeight: 1.1 }}>
          <h2 className={`font-bold whitespace-nowrap ${fontFamilies.classic} ${getReceiverNameFontSize()}`}>
            {receiverName}
          </h2>
        </main>

        {/* Wishlist */}
        {isNameRevealed && (
          <div 
            className={`w-full space-y-1 ${getWishlistFontSize()}`}
            style={{ lineHeight: line }}
          >
            <h3 className="font-bold text-lg mb-1">{wish}</h3>
            <ul className="list-none text-left inline-block space-y-0 max-w-full">
              {renderWishlistItem('Interests', receiver.interests)}
              {renderWishlistItem('Likes', receiver.likes)}
              {renderWishlistItem('Dislikes', receiver.dislikes)}
              {renderWishlistItem('Budget', receiver.budget)}
            </ul>
            
            {hasLinks && showLinks && (
                <div className="mt-2 text-left max-w-full inline-block">
                    <h4 className="font-bold text-center">Wishlist Links:</h4>
                    <div className="space-y-2 mt-1">
                        {receiver.links.map((link, index) => (
                           link.trim() ? <LinkPreview key={index} url={link} isForPdf={isForPdf} /> : null
                        ))}
                    </div>
                </div>
            )}

            {eventDetails && <p className="text-sm opacity-90 break-words mt-4">{eventDetails}</p>}
          </div>
        )}
        
        {/* Absolutely positioned watermark */}
        <div className="absolute bottom-4 left-0 right-0 px-4 text-center">
             {showWatermark && <p className="text-xs opacity-70">SecretSantaMatch.com</p>}
        </div>

      </div>
    </div>
  );
};

export default PrintableCard;