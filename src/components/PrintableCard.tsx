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
    if (maxLength > 45) return 'text-[0.6rem]';
    if (maxLength > 38) return 'text-[0.7rem]';
    if (maxLength > 30) return 'text-xs';
    if (maxLength > 22) return 'text-sm';
    
    if (fontSize === 'extra-large') return 'text-base';
    if (fontSize === 'large') return 'text-base';
    return 'text-sm';
  };
  
  const getReceiverNameFontSize = () => {
    if (receiverNameLength > 28) return 'text-xl';
    if (receiverNameLength > 22) return 'text-2xl';
    if (receiverNameLength > 18) return 'text-3xl';
    if (receiverNameLength > 14) return 'text-4xl';
    if (receiverNameLength > 10) return 'text-5xl';
    if (receiverNameLength > 8) return 'text-6xl';
    
    let baseSize = 'text-6xl';
    if (fontSize === 'large') baseSize = 'text-7xl';
    if (fontSize === 'extra-large') baseSize = 'text-8xl';
    return baseSize;
  };
  
  const getWishlistFontSize = () => {
    if (wishlistLength > 200) return 'text-[8px]';
    if (wishlistLength > 150) return 'text-[9px]';
    if (wishlistLength > 120) return 'text-[10px]';
    if (wishlistLength > 90) return 'text-xs';
    if (wishlistLength > 60) return 'text-sm';

    if (fontSize === 'extra-large') return 'text-base';
    if (fontSize === 'large') return 'text-base';
    return 'text-sm';
  };
  
  const pdfFontSizes = {
    header: '22px',
    receiverName: '72px',
    wishlistLabel: '28px',
    wishlist: '18px',
    eventDetails: '16px'
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
        className={`absolute inset-0 flex flex-col items-center text-center ${isForPdf ? '' : 'justify-evenly'} py-12 sm:py-16 px-8 sm:px-12 md:px-16`}
        style={{ color: txtColor, textShadow, fontFamily: fontFamilies[font] }}
      >
        {/* Header */}
        <div style={isForPdf ? { flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '20px' } : {}}>
          <header 
            className={!isForPdf ? getHeaderFontSize() : 'whitespace-nowrap'}
            style={{ 
                lineHeight: line,
                fontSize: isForPdf ? pdfFontSizes.header : undefined,
            }}
          >
            <p className="font-bold">{formattedGreeting}</p>
            <p className="mt-1">{intro}</p>
          </header>
        </div>

        {/* Receiver Name */}
        <div style={isForPdf ? { flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' } : {}}>
            <main style={{ lineHeight: 1.1 }}>
            <h2 
                className={`font-bold whitespace-nowrap ${fontFamilies.classic} ${!isForPdf ? getReceiverNameFontSize() : ''}`}
                style={{ fontSize: isForPdf ? pdfFontSizes.receiverName : undefined }}
            >
                {receiverName}
            </h2>
            </main>
        </div>

        {/* Wishlist */}
        <div style={isForPdf ? { flex: '1', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: '20px' } : {}}>
            {isNameRevealed && (
            <div 
                className={`w-full space-y-1 ${!isForPdf ? getWishlistFontSize() : ''}`}
                style={{ 
                    lineHeight: line,
                    fontSize: isForPdf ? pdfFontSizes.wishlist : undefined
                }}
            >
                <h3 
                    className="font-bold text-lg mb-1"
                    style={{ fontSize: isForPdf ? pdfFontSizes.wishlistLabel : undefined }}
                >
                    {wish}
                </h3>
                <ul className="list-none text-left inline-block space-y-1 max-w-full">
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

                {eventDetails && <p className="text-sm opacity-90 break-words mt-4" style={{fontSize: isForPdf ? pdfFontSizes.eventDetails : undefined}}>{eventDetails}</p>}
            </div>
            )}
        </div>
        
        {/* Absolutely positioned watermark */}
        <div className="absolute bottom-4 left-0 right-0 px-4 text-center">
             {showWatermark && <p className="text-xs opacity-70">SecretSantaMatch.com</p>}
        </div>

      </div>
    </div>
  );
};

export default PrintableCard;
