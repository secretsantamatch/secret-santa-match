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

// A single, unified set of scaling functions that return pixel-based font sizes
const getHeaderFontSize = (len: number): string => {
    if (len > 45) return '11px';
    if (len > 35) return '13px';
    if (len > 28) return '15px';
    return '17px';
};

const getReceiverNameFontSize = (len: number): string => {
    if (len > 28) return '28px';
    if (len > 24) return '34px';
    if (len > 20) return '42px';
    if (len > 16) return '50px';
    if (len > 13) return '60px';
    if (len > 10) return '72px';
    return '80px';
};

const getWishlistFontSize = (len: number): string => {
    if (len > 200) return '9px';
    if (len > 150) return '10px';
    if (len > 120) return '11px';
    if (len > 90) return '12px';
    return '14px';
};


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
  const showWatermark = bgId === 'custom' || bgId === 'plain-white'; // Also show for plain white

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

  // Character lengths for dynamic scaling
  const greetingLength = formattedGreeting.length;
  const introLength = intro.length;
  const receiverNameLength = receiverName.length;
  const wishlistContent = [receiver.interests, receiver.likes, receiver.dislikes, receiver.budget].join(' ');
  const wishlistLength = wishlistContent.length;

  const renderWishlistItem = (label: string, value: string | undefined) => {
    if (!value || value.trim() === '') return null;
    return <li className="break-words"><strong className="font-bold">{label}:</strong> <span>{value}</span></li>;
  };
  
  const hasLinks = Array.isArray(receiver.links) && receiver.links.some(link => link && link.trim() !== '');

  return (
    <div 
        className={`printable-card-container w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg relative bg-cover bg-center transition-all duration-300`} 
        style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      <div 
        className="absolute inset-0 flex flex-col items-center text-center justify-evenly p-[12%]"
        style={{ color: txtColor, textShadow, fontFamily: fontFamilies[font] }}
      >
        {/* Header */}
        <div>
          <header 
            className="whitespace-nowrap"
            style={{ 
                lineHeight: line,
                fontSize: getHeaderFontSize(Math.max(greetingLength, introLength)),
            }}
          >
            <p className="font-bold">{formattedGreeting}</p>
            <p className="mt-1">{intro}</p>
          </header>
        </div>

        {/* Receiver Name */}
        <div>
            <main style={{ lineHeight: 1.1 }}>
            <h2 
                className={`font-bold whitespace-nowrap ${fontFamilies.classic}`}
                style={{ fontSize: getReceiverNameFontSize(receiverNameLength) }}
            >
                {receiverName}
            </h2>
            </main>
        </div>

        {/* Wishlist */}
        <div className="w-full">
            {isNameRevealed && (
            <div 
                className="w-full"
                style={{ 
                    lineHeight: line,
                    fontSize: getWishlistFontSize(wishlistLength)
                }}
            >
                <h3 className="font-bold text-lg mb-1" style={{fontSize: '1.2em'}}>{wish}</h3>
                <ul className="list-none text-left inline-block space-y-0.5 max-w-full">
                    {renderWishlistItem('Interests', receiver.interests)}
                    {renderWishlistItem('Likes', receiver.likes)}
                    {renderWishlistItem('Dislikes', receiver.dislikes)}
                    {renderWishlistItem('Budget', receiver.budget)}
                </ul>
                
                {hasLinks && showLinks && (
                    <div className="mt-2 text-left max-w-full inline-block">
                        <h4 className="font-bold text-center" style={{fontSize: '1.1em'}}>Wishlist Links:</h4>
                        <div className="space-y-2 mt-1">{receiver.links.map((link, index) => (link.trim() ? <LinkPreview key={index} url={link} isForPdf={isForPdf} /> : null))}</div>
                    </div>
                )}

                {eventDetails && <p className="opacity-90 break-words mt-4" style={{fontSize: '0.9em'}}>{eventDetails}</p>}
            </div>
            )}
        </div>
        
        <div className="absolute bottom-4 left-0 right-0 px-4 text-center">
             <p className="text-xs opacity-70" style={{ color: txtColor, textShadow }}>SecretSantaMatch.com</p>
        </div>
      </div>
    </div>
  );
};

export default PrintableCard;