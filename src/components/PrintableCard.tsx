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
  isForPdf = false
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

  // Auto-sizing logic
  const giverNameLength = giver.name.length;
  const receiverNameLength = receiverName.length;
  const wishlistContent = [receiver.interests, receiver.likes, receiver.dislikes, receiver.budget].join(' ');
  const wishlistLength = wishlistContent.length;

  const getHeaderFontSize = () => {
    let baseClass = 'text-lg';
    if (fontSize === 'large') baseClass = 'text-xl';
    if (fontSize === 'extra-large') baseClass = 'text-2xl';
    if (giverNameLength > 20) return 'text-base';
    if (giverNameLength > 15) return 'text-lg';
    return baseClass;
  };
  
  const getReceiverNameFontSize = () => {
    let baseClass = 'text-5xl';
    if (fontSize === 'large') baseClass = 'text-6xl';
    if (fontSize === 'extra-large') baseClass = 'text-7xl';
    if (receiverNameLength > 15) return 'text-4xl';
    if (receiverNameLength > 10) return 'text-5xl';
    return baseClass;
  };
  
  const getWishlistFontSize = () => {
      let baseClass = 'text-xs';
      if (fontSize === 'large') baseClass = 'text-sm';
      if (fontSize === 'extra-large') baseClass = 'text-base';
      if (wishlistLength > 100) return 'text-[10px]';
      return baseClass;
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
          className={`break-words ${getHeaderFontSize()}`}
          style={{ lineHeight: line }}
        >
          <p className="font-bold">{formattedGreeting}</p>
          <p className="mt-1">{intro}</p>
        </header>

        {/* Receiver Name */}
        <main style={{ lineHeight: 1.1 }}>
          <h2 className={`font-bold ${fontFamilies.classic} ${getReceiverNameFontSize()}`}>
            {receiverName}
          </h2>
        </main>

        {/* Wishlist */}
        {isNameRevealed && (
          <div 
            className={`space-y-1 ${getWishlistFontSize()}`}
            style={{ lineHeight: line }}
          >
            <h3 className="font-bold text-lg mb-1">{wish}</h3>
            <ul className="list-none text-center space-y-0">
              {renderWishlistItem('Interests', receiver.interests)}
              {renderWishlistItem('Likes', receiver.likes)}
              {renderWishlistItem('Dislikes', receiver.dislikes)}
              {renderWishlistItem('Budget', receiver.budget)}
            </ul>
            
            {hasLinks && (
                <div className="mt-2 text-left">
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