import React from 'react';
import type { Match, BackgroundOption, OutlineSizeSetting, FontSizeSetting, FontTheme } from '../types';

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
  const showWatermark = !!bgImg; // Only show watermark on custom uploads

  const fontFamilies: Record<FontTheme, string> = {
    classic: "'Playfair Display', serif",
    modern: "'Montserrat', sans-serif",
    elegant: "'Cormorant Garamond', serif",
    whimsical: "'Patrick Hand', cursive",
  };
  
  const baseFontSizeClasses: Record<FontSizeSetting, string> = {
    normal: 'text-base',
    large: 'text-lg',
    'extra-large': 'text-xl',
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
  const wishlistContent = [receiver.interests, receiver.likes, receiver.dislikes, receiver.links, receiver.budget].join(' ');
  const wishlistLength = wishlistContent.length;

  const getHeaderFontSize = () => {
    if (giverNameLength > 20) return 'text-sm';
    if (giverNameLength > 15) return 'text-base';
    return 'text-lg';
  };
  
  const getReceiverNameFontSize = () => {
    if (receiverNameLength > 15) return 'text-3xl';
    if (receiverNameLength > 10) return 'text-4xl';
    return 'text-5xl';
  };
  
  const getWishlistFontSize = () => {
      if (wishlistLength > 150) return 'text-xs';
      if (wishlistLength > 100) return 'text-sm';
      return 'text-base';
  };

  const renderWishlistItem = (label: string, value: string | undefined) => {
    if (!value || value.trim() === '') return null;
    if (label === 'Links' && isForPdf) return null; // Don't show links on PDF

    const isLinks = label === 'Links';
    const content = isLinks ? 
      value.split('\n').filter(link => link.trim()).map((link, i) => (
        <a key={i} href={link.startsWith('http') ? link : `//${link}`} target="_blank" rel="noopener noreferrer" className="underline break-all block">{link}</a>
      )) : 
      <span className="break-words">{value}</span>;

    return (
      <div className="break-words">
        <strong className="font-bold">{label}:</strong> {content}
      </div>
    );
  };
  
  return (
    <div 
        className={`printable-card-container w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg relative bg-cover bg-center ${isForPdf ? '' : 'transition-all duration-300'}`} 
        style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      <div
        className={`absolute inset-0 flex flex-col items-center justify-start pt-20 px-8 pb-16 text-center gap-y-2 ${baseFontSizeClasses[fontSize]}`}
        style={{ color: txtColor, textShadow, lineHeight: line, fontFamily: fontFamilies[font] }}
      >
        {/* Header */}
        <header className={`break-words ${getHeaderFontSize()}`}>
          <p className="font-bold">{formattedGreeting}</p>
          <p className="mt-1">{intro}</p>
        </header>

        {/* Receiver Name */}
        <main>
          <h2 className={`font-bold leading-tight ${fontFamilies.classic} ${getReceiverNameFontSize()}`}>
            {receiverName}
          </h2>
        </main>

        {/* Wishlist */}
        {isNameRevealed && (
          <div className={`space-y-2 ${getWishlistFontSize()}`}>
            <h3 className="font-bold text-lg">{wish}</h3>
            <ul className="list-none space-y-1 text-center">
              {renderWishlistItem('Interests', receiver.interests)}
              {renderWishlistItem('Likes', receiver.likes)}
              {renderWishlistItem('Dislikes', receiver.dislikes)}
              {renderWishlistItem('Links', receiver.links)}
              {renderWishlistItem('Budget', receiver.budget)}
            </ul>
          </div>
        )}
        
        {/* Footer */}
        <footer className="absolute bottom-4 left-0 right-0 px-4 text-center">
             {eventDetails && <p className="text-sm opacity-90 break-words">{eventDetails}</p>}
             {showWatermark && <p className="text-xs opacity-70 mt-1">SecretSantaMatch.com</p>}
        </footer>

      </div>
    </div>
  );
};

export default PrintableCard;