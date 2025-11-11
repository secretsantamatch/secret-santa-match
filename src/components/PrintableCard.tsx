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

  const fontStyles: Record<FontTheme, React.CSSProperties> = {
    classic: { fontFamily: "'Playfair Display', serif" },
    modern: { fontFamily: "'Montserrat', sans-serif" },
    elegant: { fontFamily: 'Garamond, serif' },
    whimsical: { fontFamily: 'cursive' },
  };

  const fontSizeClasses: Record<FontSizeSetting, string> = {
    normal: 'text-base',
    large: 'text-lg',
    'extra-large': 'text-xl',
  };

  const outlineSizeMap: Record<OutlineSizeSetting, string> = {
      'thin': '1px',
      'normal': '1.5px',
      'thick': '2px',
  };

  const createTextShadow = (size: OutlineSizeSetting, color: string): string => {
    const s = outlineSizeMap[size];
    const shadows = [
        `-${s} -${s} 0 ${color}`, `${s} -${s} 0 ${color}`,
        `-${s} ${s} 0 ${color}`, `${s} ${s} 0 ${color}`
    ];
    if (size === 'thick') {
        shadows.push(`-${s} 0 0 ${color}`, `${s} 0 0 ${color}`, `0 -${s} 0 ${color}`, `0 ${s} 0 ${color}`);
    }
    return shadows.join(', ');
  };
  
  const textShadow = outline ? createTextShadow(outSize, outColor) : 'none';
  
  const receiverName = isNameRevealed ? receiver.name : '????????';
  const formattedGreeting = greet.replace('{secret_santa}', giver.name);

  const renderWishlistItem = (label: string, value: string) => {
    if (!value || value.trim() === '') return null;
    return (
      <div className="mt-1">
        <p className="font-bold opacity-90 text-[0.8em]">{label}:</p>
        <p className="text-[0.9em] whitespace-pre-wrap">{value}</p>
      </div>
    );
  };
  
  const wishlistLinks = receiver.links?.split('\n').filter(link => link.trim() !== '');

  return (
    <div className={`printable-card-container w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg relative bg-cover bg-center ${isForPdf ? '' : 'transition-all duration-300'}`} style={{ backgroundImage: `url(${backgroundUrl})` }}>
      <div
        className={`absolute inset-0 flex flex-col justify-between p-6 text-center ${fontSizeClasses[fontSize]}`}
        style={{ color: txtColor, textShadow, lineHeight: line, ...fontStyles[font] }}
      >
        <header>
          <p className="font-bold text-[1.1em]">{formattedGreeting}</p>
          <p className="mt-1 text-[0.9em]">{intro}</p>
        </header>

        <main className="flex-grow flex flex-col justify-center my-2">
          <div className="my-2">
            <h2 className="text-[2.5em] font-bold leading-tight">
              {receiverName}
            </h2>
          </div>
          {isNameRevealed && (
            <div className="text-left text-[0.8em] bg-black/20 p-3 rounded-lg backdrop-blur-sm max-h-48 overflow-y-auto">
                <h3 className="font-bold text-[1.2em] mb-1">{wish}</h3>
                {renderWishlistItem('Interests', receiver.interests)}
                {renderWishlistItem('Likes', receiver.likes)}
                {renderWishlistItem('Dislikes', receiver.dislikes)}
                {wishlistLinks && wishlistLinks.length > 0 && (
                     <div className="mt-1">
                        <p className="font-bold opacity-90 text-[0.8em]">Links:</p>
                        <ul className="list-disc list-inside text-[0.9em]">
                            {wishlistLinks.map((link, index) => <li key={index} className="truncate"><a href={link.startsWith('http') ? link : `//${link}`} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">{link}</a></li>)}
                        </ul>
                    </div>
                )}
                {renderWishlistItem('Budget', receiver.budget)}
            </div>
          )}
        </main>

        <footer>
          <p className="text-[0.7em] opacity-80">{eventDetails}</p>
        </footer>
      </div>
    </div>
  );
};

export default PrintableCard;
