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

// A robust, self-contained component to scale single-line text to fit its container.
const ScalableSingleLineText: React.FC<{ text: string; style: React.CSSProperties; className?: string; viewBoxHeight?: number; }> = ({ text, style, className = '', viewBoxHeight = 10 }) => {
    // We use an SVG text element because it has built-in features to scale text to fit a given length.
    // This is far more reliable than JavaScript-based calculations for single lines.
    return (
        <svg viewBox={`0 0 100 ${viewBoxHeight}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', overflow: 'visible', height: 'auto' }}>
            <text
                x="50"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                textLength="98" // Use slightly less than 100 to avoid clipping at the edges
                lengthAdjust="spacingAndGlyphs" // This tells the SVG to shrink the text to fit the textLength
                style={style}
                className={className}
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

  // Base font sizes (as a relative unit)
  const baseFontSizeMap: Record<FontSizeSetting, { header: number, name: number, wishlist: number, event: number }> = {
    'normal': { header: 1.1, name: 3, wishlist: 0.8, event: 0.7 },
    'large': { header: 1.2, name: 3.5, wishlist: 0.9, event: 0.8 },
    'extra-large': { header: 1.3, name: 4, wishlist: 1.0, event: 0.9 },
  };
  const baseSizes = baseFontSizeMap[fontSize];

  const renderWishlistItem = (label: string, value: string | undefined) => {
    if (!value || value.trim() === '') return null;
    return <li className="break-words"><strong className="font-semibold">{label}:</strong> <span>{value}</span></li>;
  };
  
  const hasLinks = Array.isArray(receiver.links) && receiver.links.some(link => link && link.trim() !== '');

  const commonTextStyle = { color: txtColor, textShadow };

  return (
    <div 
        className={`w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg relative bg-cover bg-center transition-all duration-300`} 
        style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      <div 
        className="absolute inset-0 flex flex-col items-center text-center p-[8%]"
        style={{ fontFamily: fontFamilies[font] }}
      >
        {/* Using flex-grow on spacers allows content to be spaced out vertically without overlapping */}
        <div className="w-full" style={{ lineHeight: line }}>
            <ScalableSingleLineText 
                text={formattedGreeting} 
                style={{ ...commonTextStyle, fontSize: `${baseSizes.header}rem` }}
                className="font-bold"
            />
             <ScalableSingleLineText 
                text={intro} 
                style={{ ...commonTextStyle, fontSize: `${baseSizes.header * 0.8}rem` }}
            />
        </div>

        <div className="flex-grow w-full flex items-center justify-center" style={{ minHeight: '1rem' }}>
             <ScalableSingleLineText 
                text={receiverName} 
                style={{ ...commonTextStyle, fontFamily: fontFamilies.classic, fontSize: `${baseSizes.name}rem` }}
                className="font-bold"
                viewBoxHeight={15}
            />
        </div>
        
        {isNameRevealed && (
          <div className="w-full text-left self-center" style={{ lineHeight: 1.3 }}>
              <h3 className="font-bold text-center" style={{...commonTextStyle, fontSize: `${baseSizes.header}rem`, marginBottom: '0.25em' }}>{wish}</h3>
              <ul className="list-none space-y-0" style={{ ...commonTextStyle, fontSize: `${baseSizes.wishlist}rem` }}>
                  {renderWishlistItem('Interests', receiver.interests)}
                  {renderWishlistItem('Likes', receiver.likes)}
                  {renderWishlistItem('Dislikes', receiver.dislikes)}
                  {renderWishlistItem('Budget', receiver.budget)}
              </ul>
              
              {hasLinks && showLinks && (
                  <div className="mt-2">
                      <h4 className="font-bold text-center" style={{...commonTextStyle, fontSize: `${baseSizes.header * 0.9}rem`}}>Wishlist Links:</h4>
                      <div className="space-y-1 mt-1">{receiver.links.map((link, index) => (link.trim() ? <LinkPreview key={index} url={link} isForPdf={isForPdf} /> : null))}</div>
                  </div>
              )}
          </div>
        )}
        
        <div className="flex-grow" style={{minHeight: '0.5rem'}}></div>

        {eventDetails && isNameRevealed && <p className="text-center opacity-90 break-words" style={{...commonTextStyle, fontSize: `${baseSizes.event}rem` }}>{eventDetails}</p>}
        
        <div className="absolute bottom-3 left-0 right-0 px-4 text-center">
             <p className="text-xs opacity-70" style={{ color: txtColor, textShadow }}>SecretSantaMatch.com</p>
        </div>
      </div>
    </div>
  );
};

export default PrintableCard;
