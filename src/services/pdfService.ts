import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactDOM from 'react-dom/client';
import React from 'react';
import PrintableCard from '../components/PrintableCard';
import type { Match, PdfCardOptions, ExchangeData } from '../types';

export const generateAllCardsPdf = async (matches: Match[], options: ExchangeData): Promise<void> => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // A4 aspect ratio is approx 1 / 1.414. Card aspect ratio is 3/4.
    // We'll fit the card width-wise and center it vertically.
    const cardWidthMm = pdfWidth - 20; // with 10mm margins
    const cardHeightMm = cardWidthMm * (4 / 3);
    const yOffset = (pdfHeight - cardHeightMm) / 2;

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    document.body.appendChild(tempContainer);
    
    const tempRoot = ReactDOM.createRoot(tempContainer);

    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];

        // Render card to offscreen div
        const cardElement = (
            <div style={{ width: '600px' }}> {/* Render at a fixed high-res width */}
                <PrintableCard
                    match={match}
                    isNameRevealed={true}
                    eventDetails={options.eventDetails}
                    backgroundOptions={options.backgroundOptions}
                    bgId={options.bgId}
                    bgImg={options.customBackground}
                    txtColor={options.textColor}
                    outline={options.useTextOutline}
                    outColor={options.outlineColor}
                    outSize={options.outlineSize}
                    fontSize={options.fontSizeSetting}
                    font={options.fontTheme}
                    line={options.lineSpacing}
                    greet={options.greetingText}
                    intro={options.introText}
                    wish={options.wishlistLabelText}
                />
            </div>
        );
        
        await new Promise<void>(resolve => {
            tempRoot.render(cardElement);
            setTimeout(resolve, 100); // Give it a moment to render images
        });
        
        const cardNode = tempContainer.children[0] as HTMLElement;
        if (!cardNode) continue;
        
        try {
            const canvas = await html2canvas(cardNode, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
            });

            const imgData = canvas.toDataURL('image/png');

            if (i > 0) {
                pdf.addPage();
            }
            
            pdf.addImage(imgData, 'PNG', 10, yOffset, cardWidthMm, cardHeightMm);

        } catch (error) {
            console.error('Failed to capture card for PDF:', error);
        }
    }

    pdf.save('Secret_Santa_Assignments.pdf');

    // Cleanup
    tempRoot.unmount();
    document.body.removeChild(tempContainer);
};

export const generateMasterListPdf = async (matches: Match[], options: ExchangeData): Promise<void> => {
    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text('Secret Santa - Master List', 10, 20);
    pdf.setFontSize(12);
    pdf.text(`Event: ${options.eventDetails || 'N/A'}`, 10, 30);
    
    let y = 40;
    matches.forEach((match, index) => {
        if (y > 280) {
            pdf.addPage();
            y = 20;
        }
        pdf.text(`${index + 1}. ${match.giver.name} -> ${match.receiver.name}`, 10, y);
        y += 10;
    });
    
    pdf.save('Secret_Santa_Master_List.pdf');
};

export const generatePartyPackPdf = async (interests: string[]): Promise<void> => {
    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text('Secret Santa - Party Pack Icebreaker', 10, 20);
    pdf.setFontSize(12);
    pdf.text("Guess who has these interests!", 10, 30);

    let y = 40;
    const uniqueInterests = [...new Set(interests.flatMap(i => i.split(',')).map(s => s.trim()).filter(Boolean))];
    
    uniqueInterests.forEach((interest, index) => {
        if (y > 280) {
            pdf.addPage();
            y = 20;
        }
        pdf.text(`${index + 1}. ${interest}`, 10, y);
        y += 10;
    });

    pdf.save('Secret_Santa_Party_Pack.pdf');
};

// Renaming original function for backward compatibility if it was used elsewhere, though it is now superseded.
export const generatePdfFromMatches = generateAllCardsPdf;
