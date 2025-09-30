import React, { useEffect, useRef } from 'react';
import type { Match, FontSizeSetting, OutlineSizeSetting, FontTheme } from '../types';

interface PrintableCardProps {
    match: Match;
    eventDetails: string;
    backgroundId: string;
    backgroundImageUrl: string | null;
    customBackground: string | null;
    textColor: string;
    useTextOutline: boolean;
    outlineColor: string;
    outlineSize: OutlineSizeSetting;
    fontSizeSetting: FontSizeSetting;
    fontTheme: FontTheme;
    lineSpacing: number;
    greetingText: string;
    introText: string;
    wishlistLabelText: string;
    onRendered?: () => void;
    isPdfMode?: boolean;
}

const getFontSizeClass = (setting: FontSizeSetting, element: 'h1' | 'h2' | 'label' | 'body' | 'small') => {
    const sizes = {
        normal: { h1: 'text-[28px]', h2: 'text-[16px]', label: 'text-[12px]', body: 'text-[12px]', small: 'text-[10px]' },
        large: { h1: 'text-[32px]', h2: 'text-[18px]', label: 'text-[14px]', body: 'text-[14px]', small: 'text-[12px]' },
        'extra-large': { h1: 'text-[36px]', h2: 'text-[20px]', label: 'text-[16px]', body: 'text-[16px]', small: 'text-[14px]' },
    };
    return sizes[setting][element];
};

const getFontStyles = (theme: FontTheme) => {
    switch (theme) {
        case 'elegant': return { heading: { fontFamily: "'Great Vibes', cursive" }, body: { fontFamily: "'Lato', sans-serif" } };
        case 'modern': return { heading: { fontFamily: "'Oswald', sans-serif", fontWeight: 700, textTransform: 'uppercase' as const }, body: { fontFamily: "'Lato', sans-serif" } };
        case 'whimsical': return { heading: { fontFamily: "'Lobster', cursive" }, body: { fontFamily: "'Cabin', sans-serif" } };
        case 'classic': default: return { heading: { fontFamily: "'Playfair Display', serif", fontWeight: 700 }, body: { fontFamily: "'Montserrat', sans-serif" } };
    }
};

const generateTextShadow = (use: boolean, size: OutlineSizeSetting, color: string) => {
    if (!use) return 'none';
    const thickness = { thin: '1px', normal: '1.5px', thick: '2px' }[size];
    const t = thickness;
    return `-1px -1px 0 ${color}, 1px -1px 0 ${color}, -1px 1px 0 ${color}, 1px 1px 0 ${color}, -${t} -${t} 0 ${color}, ${t} -${t} 0 ${color}, -${t} ${t} 0 ${color}, ${t} ${t} 0 ${color}`;
};

const PrintableCard: React.FC<PrintableCardProps> = ({
    match, eventDetails, backgroundId, backgroundImageUrl, customBackground,
    textColor, useTextOutline, outlineColor, outlineSize, fontSizeSetting,
    fontTheme, lineSpacing, greetingText, introText, wishlistLabelText,
    onRendered,
    isPdfMode = false
}) => {
    const getProxiedUrl = (url: string) => `https://wsrv.nl/?url=${url}`;
    const imageUrl = backgroundId === 'custom-image' ? customBackground : (backgroundImageUrl ? getProxiedUrl(backgroundImageUrl) : null);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // This effect is only for PDF generation. It calls onRendered when the card is ready.
        if (!onRendered) return;

        const imageElement = cardRef.current?.querySelector('img');

        // If there's no image element (e.g., plain white background), we're ready.
        if (!imageElement) {
            onRendered();
            return;
        }
        
        // Callback to signal that rendering is complete.
        const onImageReady = () => {
            // A small timeout helps ensure the browser has fully painted the image before capture.
            setTimeout(onRendered, 100);
        };

        // If the image is already loaded (e.g., from browser cache), we're good to go.
        if (imageElement.complete) {
            onImageReady();
        } else {
            // Otherwise, we wait for the image to load (or fail to load).
            imageElement.addEventListener('load', onImageReady);
            imageElement.addEventListener('error', onImageReady); // Also fire on error to prevent hangs.

            // Cleanup function to remove listeners.
            return () => {
                imageElement.removeEventListener('load', onImageReady);
                imageElement.removeEventListener('error', onImageReady);
            };
        }
    }, [imageUrl, onRendered]);

    const fontStyles = getFontStyles(fontTheme);
    const greetingRaw = greetingText.replace('{secret_santa}', match.giver.name);
    const greetingParts = greetingRaw.includes(',') ? greetingRaw.split(',') : [greetingRaw];
    const receiverBudget = match.receiver.budget;

    const cardTextStyle: React.CSSProperties = {
        color: textColor,
        textShadow: generateTextShadow(useTextOutline, outlineSize, outlineColor),
    };

    return (
        <div
            ref={cardRef}
            className={`relative aspect-[3/4] w-full max-w-sm mx-auto rounded-xl overflow-hidden text-center ${!isPdfMode && 'shadow-lg'}`}
            style={cardTextStyle}
        >
            {/* Layer 1: Background Image or Color */}
            {imageUrl ? (
                <img 
                    src={imageUrl}
                    alt=""
                    crossOrigin="anonymous"
                    className="absolute inset-0 w-full h-full z-0 rounded-xl object-cover" 
                />
            ) : (
                <div
                    className={`absolute inset-0 w-full h-full z-0 rounded-xl ${backgroundId === 'plain-white' ? 'bg-white' : 'bg-gray-100'}`}
                />
            )}
            
            {/* Layer 2: Text Content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center bg-transparent">
                <div className="w-full p-[8%]">
                    {/* Top Block */}
                    <div className="w-full">
                        <p className={getFontSizeClass(fontSizeSetting, 'h2')} style={fontStyles.body}>
                            {greetingParts[0] + (greetingParts.length > 1 ? ',' : '')}
                        </p>
                        {greetingParts.length > 1 && (
                            <p className={getFontSizeClass(fontSizeSetting, 'h2')} style={{ ...fontStyles.body, marginTop: '0.1em' }}>
                                {greetingParts.slice(1).join(',').trim()}
                            </p>
                        )}
                        <p className={`mt-1 ${getFontSizeClass(fontSizeSetting, 'body')}`} style={fontStyles.body}>{introText}</p>
                    </div>

                    {/* Center Block */}
                    <div className="w-full flex flex-col justify-center items-center py-4">
                        <p className={getFontSizeClass(fontSizeSetting, 'h1')} style={fontStyles.heading}>{match.receiver.name}</p>
                        <div className="mt-1">
                            <p className={`font-semibold ${getFontSizeClass(fontSizeSetting, 'label')}`} style={fontStyles.body}>{wishlistLabelText}</p>
                            <p className={`${getFontSizeClass(fontSizeSetting, 'body')} mt-px`} style={{ ...fontStyles.body, lineHeight: lineSpacing }}>{match.receiver.notes || '-'}</p>
                        </div>
                        {receiverBudget && (
                            <div className="mt-2">
                                <p className={`font-semibold ${getFontSizeClass(fontSizeSetting, 'label')}`} style={fontStyles.body}>Budget:</p>
                                <p className={`${getFontSizeClass(fontSizeSetting, 'body')} mt-px`} style={fontStyles.body}>
                                    {receiverBudget.startsWith('$') ? receiverBudget : `$${receiverBudget}`}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Bottom Block */}
                    <div className="w-full">
                        {eventDetails && (
                            <p className={`italic ${getFontSizeClass(fontSizeSetting, 'small')}`} style={fontStyles.body}>
                                {eventDetails}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Layer 3: Watermark */}
            {(backgroundId === 'plain-white' || backgroundId === 'custom-image') && (
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-gray-400/80 z-20">SecretSantaMatch.com</p>
            )}
        </div>
    );
};

export default PrintableCard;
