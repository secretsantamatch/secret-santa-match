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

// More aggressive scaling for wishlist text
const getWishlistFontSize = (len: number): string => {
    if (len > 250) return '8px';
    if (len > 200) return '9px';
    if (len > 150) return '10px';
    if (len > 120) return '11px';
    if (len > 90) return '12px';
    return '14px';
};

// SVG Text component to handle automatic scaling for single lines of text
const ScalableText: React.FC<{
    text: string;
    fontFamily: string;
    color: string;
    textShadow: string;
    fontWeight?: string;
    initialFontSize: string;
}> = ({ text, fontFamily, color, textShadow, fontWeight = 'normal', initialFontSize }) => (
    <svg 
        viewBox="0 0 1000 120" 
        width="100%" 
        preserveAspectRatio="xMidYMid meet"
        style={{ fontFamily, fontWeight, overflow: 'visible' }}
    >
        <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            lengthAdjust="spacingAndGlyphs"
            textLength="990"
            style={{ fill: color, textShadow, fontSize: initialFontSize }}
        >
            {text}
        </text>
    </svg>
);


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
        className="absolute inset-0 flex flex-col items-center text-center justify-evenly p-[10%]"
        style={{ color: txtColor, fontFamily: fontFamilies[font] }}
      >
        {/* Header */}
        <div className="w-full" style={{ lineHeight: line }}>
            <ScalableText
                text={formattedGreeting}
                fontFamily={fontFamilies[font]}
                color={txtColor}
                textShadow={textShadow}
                fontWeight="bold"
                initialFontSize="32px"
            />
            <ScalableText
                text={intro}
                fontFamily={fontFamilies[font]}
                color={txtColor}
                textShadow={textShadow}
                initialFontSize="32px"
            />
        </div>

        {/* Receiver Name */}
        <div className="w-full" style={{ lineHeight: 1.1 }}>
            <ScalableText
                text={receiverName}
                fontFamily={fontFamilies.classic}
                color={txtColor}
                textShadow={textShadow}
                fontWeight="bold"
                initialFontSize="100px"
            />
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
                <ul className="list-none text-left block w-full space-y-px max-w-full">
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