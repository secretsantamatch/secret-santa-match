import React, { useRef, useEffect, useState } from 'react';
import type { Match, BackgroundOption, OutlineSizeSetting, FontSizeSetting, FontTheme } from '../types';

interface PrintableCardProps {
  match: Match | { giver: { name: string }, receiver: { name: string, interests: string, likes: string, dislikes: string, links: string, budget: string } };
  eventDetails: string;
  isNameRevealed: boolean;
  onReveal?: () => void;
  backgroundOptions: BackgroundOption[];
  // Style props are now individual
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
}

const PrintableCard: React.FC<PrintableCardProps> = ({ 
  match, eventDetails, isNameRevealed, onReveal, backgroundOptions,
  bgId, bgImg, txtColor, outline, outColor, outSize, fontSize, font, line, greet, intro, wish 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [isRevealing, setIsRevealing] = useState(false);

  const fontFamilies: Record<string, string> = {
    classic: '"Playfair Display", serif',
    elegant: '"Cormorant Garamond", serif',
    modern: '"Montserrat", sans-serif',
    whimsical: '"Patrick Hand", cursive',
  };

  const fontSizes: Record<string, string> = {
    normal: '1rem',
    large: '1.15rem',
    'extra-large': '1.3rem',
  };

  const outlineSizes: Record<string, string> = {
    thin: '0.5px',
    normal: '1px',
    thick: '2px',
  };

  const dynamicStyles = {
    '--base-font-size': fontSizes[fontSize] || '1rem',
    '--line-spacing': line,
    '--text-color': txtColor,
    '--font-family': fontFamilies[font] || '"Playfair Display", serif',
    textShadow: outline ? `${outSize === 'thin' ? `0 0 ${outlineSizes[outSize]}` : `${outlineSizes[outSize]} ${outlineSizes[outSize]} 0`} ${outColor}, ${outSize === 'thin' ? `0 0 ${outlineSizes[outSize]}` : `-${outlineSizes[outSize]} -${outlineSizes[outSize]} 0`} ${outColor}, ${outSize === 'thin' ? `0 0 ${outlineSizes[outSize]}` : `${outlineSizes[outSize]} -${outlineSizes[outSize]} 0`} ${outColor}, ${outSize === 'thin' ? `0 0 ${outlineSizes[outSize]}` : `-${outlineSizes[outSize]} ${outlineSizes[outSize]} 0`} ${outColor}` : 'none',
  } as React.CSSProperties;

  const backgroundImageUrlRaw = bgImg || (bgId !== 'plain-white' && backgroundOptions.find(b => b.id === bgId)?.imageUrl);
  
  let backgroundImageUrl = backgroundImageUrlRaw;
  if (backgroundImageUrl && !backgroundImageUrl.startsWith('http') && !backgroundImageUrl.startsWith('data:') && !backgroundImageUrl.startsWith('/')) {
    backgroundImageUrl = `/${backgroundImageUrl}`;
  }

  // Combine interests, likes and dislikes for the printable card view
  const combinedNotes = [
    match.receiver.interests ? `Interests: ${match.receiver.interests}` : '',
    match.receiver.likes ? `Likes: ${match.receiver.likes}` : '',
    match.receiver.dislikes ? `Dislikes: ${match.receiver.dislikes}` : ''
  ].filter(Boolean).join('\n');


  useEffect(() => {
    if (isNameRevealed || !onReveal) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Create a silver-like gradient for the scratch-off surface
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#d1d5db');
    gradient.addColorStop(0.5, '#9ca3af');
    gradient.addColorStop(1, '#d1d5db');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add text overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 20px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Scratch to Reveal!', canvas.width / 2, canvas.height / 2);


    const getCoordinates = (event: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        if (event instanceof MouseEvent) {
            return { x: event.clientX - rect.left, y: event.clientY - rect.top };
        } else if (event.touches[0]) {
            return { x: event.touches[0].clientX - rect.left, y: event.touches[0].clientY - rect.top };
        }
        return null;
    };

    const scratch = (e: MouseEvent | TouchEvent) => {
        if (!isDrawing.current) return;
        e.preventDefault();
        const coords = getCoordinates(e);
        if (coords) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(coords.x, coords.y, 25, 0, Math.PI * 2, true);
            ctx.fill();
        }
    };

    const checkReveal = () => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixelData = imageData.data;
        let transparentPixels = 0;
        for (let i = 3; i < pixelData.length; i += 4) {
            if (pixelData[i] === 0) {
                transparentPixels++;
            }
        }
        const revealedPercentage = (transparentPixels / (canvas.width * canvas.height));
        
        if (revealedPercentage > 0.6) {
            setIsRevealing(true);
            setTimeout(() => {
                onReveal();
            }, 300); // Animation delay
        }
    };

    const startScratching = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        isDrawing.current = true;
        scratch(e);
    };

    const stopScratching = () => {
        isDrawing.current = false;
        checkReveal();
    };

    canvas.addEventListener('mousedown', startScratching);
    canvas.addEventListener('touchstart', startScratching, { passive: false });
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('touchmove', scratch, { passive: false });
    window.addEventListener('mouseup', stopScratching);
    window.addEventListener('touchend', stopScratching);

    return () => {
        if (canvas) {
            canvas.removeEventListener('mousedown', startScratching);
            canvas.removeEventListener('touchstart', startScratching);
            canvas.removeEventListener('mousemove', scratch);
            canvas.removeEventListener('touchmove', scratch);
        }
        window.removeEventListener('mouseup', stopScratching);
        window.removeEventListener('touchend', stopScratching);
    };

  }, [isNameRevealed, onReveal]);

  return (
    <div 
        className="printable-card aspect-[3/4] w-full max-w-sm mx-auto rounded-2xl shadow-lg relative overflow-hidden bg-white flex flex-col items-center justify-center p-6" 
        style={dynamicStyles}
    >
      {backgroundImageUrl && (
        <img 
          src={backgroundImageUrl} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover" 
          crossOrigin="anonymous" 
          loading="lazy"
          width="338"
          height="450"
        />
      )}
      <div className="relative z-10 text-center flex flex-col h-full w-full">
        <div className="flex-grow flex flex-col items-center justify-center text-center">
            <p style={{ color: 'var(--text-color)', fontFamily: 'var(--font-family)', fontSize: 'calc(var(--base-font-size) * 0.9)', lineHeight: 'var(--line-spacing)' }} className="opacity-90">
                {greet.replace('{secret_santa}', match.giver.name)}
            </p>
            <p style={{ color: 'var(--text-color)', fontFamily: 'var(--font-family)', fontSize: 'calc(var(--base-font-size) * 1.1)', lineHeight: 'var(--line-spacing)' }} className="mt-1">
                {intro.replace('{secret_santa}', match.giver.name)}
            </p>
            
            <div className="my-4 w-full relative">
                {isNameRevealed ? (
                    <>
                      <h2 style={{ color: 'var(--text-color)', fontFamily: 'var(--font-family)', fontSize: 'calc(var(--base-font-size) * 2.25)' }} className="font-bold break-words">
                          {match.receiver.name}
                      </h2>
                      
                      {(combinedNotes || match.receiver.budget) && (
                          <div className="mt-4 w-full text-center">
                              <h3 style={{ color: 'var(--text-color)', fontFamily: 'var(--font-family)', fontSize: 'calc(var(--base-font-size) * 0.8)'}} className="font-bold tracking-widest uppercase opacity-70">
                                  {wish}
                              </h3>
                              <div style={{ color: 'var(--text-color)', fontFamily: 'var(--font-family)', fontSize: 'calc(var(--base-font-size) * 0.9)' }} className="mt-1 opacity-90 break-words px-4 whitespace-pre-wrap">
                                  {combinedNotes && <p>{combinedNotes}</p>}
                                  {match.receiver.budget && <p className="mt-1">{`Budget: $${match.receiver.budget}`}</p>}
                              </div>
                          </div>
                      )}

                      {eventDetails && (
                        <div className="w-full text-center px-4 mt-4">
                          <p style={{ color: 'var(--text-color)', fontFamily: 'var(--font-family)', fontSize: 'calc(var(--base-font-size) * 0.8)' }} className="opacity-80 break-words">
                            {eventDetails}
                          </p>
                        </div>
                      )}
                    </>
                ) : (
                    <div className="w-full aspect-[3/1] max-w-[80%] mx-auto relative cursor-pointer group">
                         <div className="w-full h-full flex items-center justify-center rounded-xl bg-white/30 backdrop-blur-sm border border-white/50">
                            {/* This is the content that will be revealed */}
                         </div>
                         <canvas 
                            ref={canvasRef} 
                            className={`absolute inset-0 w-full h-full rounded-xl transition-opacity duration-300 ${isRevealing ? 'opacity-0' : 'opacity-100'}`}
                         ></canvas>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableCard;
