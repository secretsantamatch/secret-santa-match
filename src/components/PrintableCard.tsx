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

  const fontFamilies: Record<FontTheme, string> = {
    classic: "'Playfair Display', serif",
    modern: "'Montserrat', sans-serif",
    elegant: "'Cormorant Garamond', serif",
    whimsical: "'Patrick Hand', cursive",
  };
  
  const outlineSizeMap: Record<OutlineSizeSetting, string> = { 'thin': '1px', 'normal': '1.5px', 'thick': '2px' };
  const textShadow = outline ? [`-${outlineSizeMap[outSize]} 0 ${outColor}`, `${outlineSizeMap[outSize]} 0 ${outColor}`, `0 -${outlineSizeMap[outSize]} ${outColor}`, `0 ${outlineSizeMap[outSize]} ${outColor}`].join(', ') : 'none';
  
  const receiverName = isNameRevealed ? receiver.name : '????????';
  const formattedGreeting = greet.replace('{secret_santa}', giver.name);

  // --- FONT SCALING LOGIC ---
  const baseFontSizeMap: Record<FontSizeSetting, { header: number, name: number, wishlist: number, event: number }> = {
    'normal': { header: 3, name: 10, wishlist: 2.2, event: 2 },
    'large': { header: 3.4, name: 11, wishlist: 2.4, event: 2.2 },
    'extra-large': { header: 3.8, name: 12, wishlist: 2.6, event: 2.4 },
  };
  const baseSizes = baseFontSizeMap[fontSize];

  // Function to calculate scaled font size to prevent overflow
  const getScaledFontSize = (baseVmin: number, text: string, maxLengthThreshold: number) => {
    const scaleFactor = text.length > maxLengthThreshold ? maxLengthThreshold / text.length : 1;
    const finalSize = baseVmin * Math.max(scaleFactor, 0.5); // Don't let it get too small
    return `${finalSize}vmin`;
  };

  const headerFontSize = getScaledFontSize(baseSizes.header, formattedGreeting, 25);
  const introFontSize = getScaledFontSize(baseSizes.header * 0.8, intro, 35);
  const nameFontSize = getScaledFontSize(baseSizes.name, receiverName, 15);
  // --- END FONT SCALING ---

  const renderWishlistItem = (label: string, value: string | undefined) => {
    if (!value || value.trim() === '') return null;
    return <li className="break-words"><strong className="font-semibold">{label}:</strong> <span>{value}</span></li>;
  };
  
  const hasLinks = Array.isArray(receiver.links) && receiver.links.some(link => link && link.trim() !== '');

  return (
    <div 
        className={`w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg relative bg-cover bg-center transition-all duration-300`} 
        style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      <div 
        className="absolute inset-0 flex flex-col items-center justify-evenly text-center p-[8%]"
        style={{ color: txtColor, fontFamily: fontFamilies[font] }}
      >
        {/* Header */}
        <div style={{ lineHeight: line }}>
            <p style={{ fontSize: headerFontSize, textShadow, whiteSpace: 'nowrap' }} className="font-bold">{formattedGreeting}</p>
            <p style={{ fontSize: introFontSize, textShadow, whiteSpace: 'nowrap' }}>{intro}</p>
        </div>

        {/* Receiver Name */}
        <div style={{ fontFamily: fontFamilies.classic, fontWeight: 'bold' }}>
             <p style={{ fontSize: nameFontSize, textShadow, whiteSpace: 'nowrap' }}>{receiverName}</p>
        </div>

        {/* Wishlist & Details - This container allows internal scrolling if content overflows */}
        <div className="w-full text-left self-center min-h-0" style={{ lineHeight: 1.4 }}>
            {isNameRevealed && (
            <div className="overflow-y-auto max-h-full px-2">
                <h3 className="font-bold text-center" style={{fontSize: `${baseSizes.header}vmin`, textShadow, marginBottom: '0.25em' }}>{wish}</h3>
                <ul className="list-none space-y-0" style={{ fontSize: `${baseSizes.wishlist}vmin`, textShadow }}>
                    {renderWishlistItem('Interests', receiver.interests)}
                    {renderWishlistItem('Likes', receiver.likes)}
                    {renderWishlistItem('Dislikes', receiver.dislikes)}
                    {renderWishlistItem('Budget', receiver.budget)}
                </ul>
                
                {hasLinks && showLinks && (
                    <div className="mt-2">
                        <h4 className="font-bold text-center" style={{fontSize: `${baseSizes.header}vmin`, textShadow}}>Wishlist Links:</h4>
                        <div className="space-y-1 mt-1">{receiver.links.map((link, index) => (link.trim() ? <LinkPreview key={index} url={link} isForPdf={isForPdf} /> : null))}</div>
                    </div>
                )}

                {eventDetails && <p className="text-center opacity-90 break-words mt-2" style={{fontSize: `${baseSizes.event}vmin`, textShadow }}>{eventDetails}</p>}
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
