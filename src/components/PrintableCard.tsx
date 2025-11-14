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

// A component to render text that auto-shrinks to fit a single line.
const ScalableText: React.FC<{ text: string, style: React.CSSProperties }> = ({ text, style }) => {
  return (
    <svg width="100%" height="100%" viewBox="0 0 1000 100" preserveAspectRatio="xMidYMid meet">
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        style={style}
        // This is the magic part: it tells the SVG to shrink the text to fit if it's too long.
        textLength="1000"
        lengthAdjust="spacingAndGlyphs"
      >
        {text}
      </text>
    </svg>
  );
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

  const renderWishlistItem = (label: string, value: string | undefined) => {
    if (!value || value.trim() === '') return null;
    return <li className="break-words"><strong className="font-semibold">{label}:</strong> <span>{value}</span></li>;
  };
  
  const hasLinks = Array.isArray(receiver.links) && receiver.links.some(link => link && link.trim() !== '');

  const baseFontSizeMap: Record<FontSizeSetting, { header: string, name: string, wishlist: string, event: string }> = {
    'normal': { header: '3vmin', name: '11vmin', wishlist: '2.4vmin', event: '2vmin' },
    'large': { header: '3.4vmin', name: '12vmin', wishlist: '2.6vmin', event: '2.2vmin' },
    'extra-large': { header: '3.8vmin', name: '13vmin', wishlist: '2.8vmin', event: '2.4vmin' },
  };
  const baseSizes = baseFontSizeMap[fontSize];

  const commonTextStyle = { fill: txtColor, textShadow };

  return (
    <div 
        className={`w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg relative bg-cover bg-center transition-all duration-300`} 
        style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      <div 
        className="absolute inset-0 flex flex-col items-center text-center p-[8%] gap-y-2"
        style={{ color: txtColor, fontFamily: fontFamilies[font] }}
      >
        {/* Header */}
        <div className="w-full flex-[1.5] flex flex-col justify-center" style={{ lineHeight: line }}>
            <div className="h-[45%] w-full">
                <ScalableText text={formattedGreeting} style={{ ...commonTextStyle, fontFamily: fontFamilies[font], fontSize: '70px', fontWeight: 'bold' }}/>
            </div>
             <div className="h-[40%] w-full">
                <ScalableText text={intro} style={{ ...commonTextStyle, fontFamily: fontFamilies[font], fontSize: '50px' }}/>
            </div>
        </div>

        {/* Receiver Name */}
        <div className="w-full flex-[2] flex items-center justify-center">
             <ScalableText text={receiverName} style={{ ...commonTextStyle, fontFamily: fontFamilies.classic, fontSize: '100px', fontWeight: 'bold' }}/>
        </div>

        {/* Wishlist */}
        <div className="w-full max-h-[45%] flex-[4] flex flex-col justify-start overflow-hidden text-left" style={{ lineHeight: 1.3 }}>
            {isNameRevealed && (
            <div className="w-full h-full overflow-y-auto">
                <h3 className="font-bold text-center" style={{fontSize: baseSizes.header, textShadow }}>{wish}</h3>
                <ul className="list-none space-y-0.5 mt-1" style={{ fontSize: baseSizes.wishlist, textShadow }}>
                    {renderWishlistItem('Interests', receiver.interests)}
                    {renderWishlistItem('Likes', receiver.likes)}
                    {renderWishlistItem('Dislikes', receiver.dislikes)}
                    {renderWishlistItem('Budget', receiver.budget)}
                </ul>
                
                {hasLinks && showLinks && (
                    <div className="mt-2">
                        <h4 className="font-bold text-center" style={{fontSize: baseSizes.header, textShadow}}>Wishlist Links:</h4>
                        <div className="space-y-1 mt-1">{receiver.links.map((link, index) => (link.trim() ? <LinkPreview key={index} url={link} isForPdf={isForPdf} /> : null))}</div>
                    </div>
                )}

                {eventDetails && <p className="text-center opacity-90 break-words mt-2" style={{fontSize: baseSizes.event, textShadow }}>{eventDetails}</p>}
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