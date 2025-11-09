import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import type { ExchangeData, Match } from '../types';
import React from 'react';
import ReactDOM from 'react-dom/client';
import PrintableCard from '../components/PrintableCard';

/**
 * Renders a React component off-screen and returns a promise that resolves
 * when the component is ready to be captured. Also returns a cleanup function.
 */
const renderOffScreen = (
  component: React.ReactElement
): Promise<{ element: HTMLElement; cleanup: () => void }> => {
  return new Promise(resolve => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0px';
    // Force a specific size to ensure consistent aspect ratio
    container.style.width = '600px'; 
    container.style.height = '800px';
    document.body.appendChild(container);

    const root = ReactDOM.createRoot(container);
    const cleanup = () => {
      root.unmount();
      document.body.removeChild(container);
    };

    root.render(component);

    // Use a short timeout to allow React to render and images to start loading
    setTimeout(() => {
      const element = container.firstChild as HTMLElement;
      resolve({ element, cleanup });
    }, 100); // A small delay for initial render
  });
};

/**
 * Preloads all unique background images required for the cards.
 * @param exchangeData The full data for the gift exchange.
 */
const preloadCardImages = (exchangeData: ExchangeData): Promise<void[]> => {
    const { backgroundOptions, customBackground, bgId } = exchangeData;
    const uniqueBgIds = new Set([bgId]);
    
    if (customBackground) {
        uniqueBgIds.add('custom');
    }

    const imagePromises: Promise<void>[] = [];

    uniqueBgIds.forEach(currentBgId => {
        let imageUrl: string | null = null;
        if (currentBgId === 'custom') {
            imageUrl = customBackground;
        } else {
            const bgOption = backgroundOptions.find(opt => opt.id === currentBgId);
            imageUrl = bgOption?.imageUrl || null;
        }

        if (imageUrl) {
            const promise = new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.src = imageUrl!;
                img.onload = () => resolve();
                img.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
            });
            imagePromises.push(promise);
        }
    });

    return Promise.all(imagePromises);
};


/**
 * Generates a PDF with one styled, printable card per page for each participant.
 * This is the definitive fix for the "blank card" and "element not found" bugs.
 * @param exchangeData The full data for the gift exchange.
 */
export const generateAllCardsPdf = async (exchangeData: ExchangeData): Promise<void> => {
    const { p: participants, matches: matchIds, ...styleData } = exchangeData;
    const matches: Match[] = matchIds.map(m => ({
        giver: participants.find(p => p.id === m.g)!,
        receiver: participants.find(p => p.id === m.r)!,
    })).filter(m => m.giver && m.receiver);

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [600, 800] // Strict 3:4 aspect ratio
    });
    doc.deletePage(1); // Remove default blank page

    try {
        await preloadCardImages(exchangeData);

        for (const match of matches) {
            const cardComponent = React.createElement(PrintableCard, {
                match,
                eventDetails: styleData.eventDetails,
                isNameRevealed: true,
                backgroundOptions: styleData.backgroundOptions,
                bgId: styleData.bgId,
                bgImg: styleData.customBackground,
                txtColor: styleData.textColor,
                outline: styleData.useTextOutline,
                outColor: styleData.outlineColor,
                outSize: styleData.outlineSize,
                fontSize: styleData.fontSizeSetting,
                font: styleData.fontTheme,
                line: styleData.lineSpacing,
                greet: styleData.greetingText,
                intro: styleData.introText,
                wish: styleData.wishlistLabelText,
            });

            const { element, cleanup } = await renderOffScreen(cardComponent);
            
            try {
                const canvas = await html2canvas(element, {
                    useCORS: true,
                    allowTaint: true,
                    scale: 2, // Higher quality capture
                    backgroundColor: null,
                });
                const imgData = canvas.toDataURL('image/png');
                doc.addPage([600, 800], 'p');
                doc.addImage(imgData, 'PNG', 0, 0, 600, 800);
            } finally {
                cleanup(); // Ensure cleanup happens even if html2canvas fails
            }
        }
        doc.save('Secret_Santa_Cards.pdf');
    } catch (error) {
        console.error("Failed during PDF generation:", error);
        throw new Error("Could not generate PDF. One or more card images may have failed to load.");
    }
};


/**
 * Generates a detailed PDF master list using jspdf-autotable for a professional layout.
 * @param exchangeData The full data for the gift exchange.
 */
export const generateMasterListPdf = (exchangeData: ExchangeData): void => {
    const { p: participants, matches: matchIds, eventDetails, exchangeDate, exchangeTime } = exchangeData;
    const matches: Match[] = matchIds.map(m => ({
        giver: participants.find(p => p.id === m.g)!,
        receiver: participants.find(p => p.id === m.r)!,
    })).filter(m => m.giver && m.receiver);

    const doc = new jsPDF();
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Secret Santa - Master List', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

    let startY = 35;
    if (eventDetails) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Event Details: ${eventDetails}`, 14, startY);
        startY += 7;
    }

    if (exchangeDate) {
        let dateInfo = `Exchange Date: ${exchangeDate}`;
        if (exchangeTime) dateInfo += ` at ${exchangeTime}`;
        doc.text(dateInfo, 14, startY);
        startY += 7;
    }
    
    const tableBody = matches.map(match => {
        const details = [];
        if (match.receiver.budget) details.push(`Budget: $${match.receiver.budget}`);
        if (match.receiver.interests) details.push(`Interests: ${match.receiver.interests}`);
        if (match.receiver.likes) details.push(`Likes: ${match.receiver.likes}`);
        if (match.receiver.dislikes) details.push(`Dislikes: ${match.receiver.dislikes}`);
        if (match.receiver.links) details.push(`Links: ${match.receiver.links.split('\n')[0]}`);
        
        return [match.giver.name, match.receiver.name, details.join('\n')];
    });

    autoTable(doc, {
        startY: startY + 5,
        head: [['Giver', 'Receiver', "Receiver's Wishlist & Details"]],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [200, 40, 40], fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 40, halign: 'left' },
            1: { cellWidth: 40, halign: 'left' },
            2: { halign: 'left', cellWidth: 'auto' }
        },
        didParseCell: function (data) {
            if (data.section === 'head') {
                data.cell.styles.fontStyle = 'bold';
            }
            if (data.column.index === 2) {
                data.cell.styles.fontStyle = 'normal';
                data.cell.styles.fontSize = 8;
            }
        }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150);
        doc.text('Generated by SecretSantaMatch.com', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save('Secret_Santa_Master_List.pdf');
};


/**
 * Generates a world-class, multi-page Party Pack PDF with Bingo and printable awards.
 * This is the definitive fix for the Party Pack design.
 */
export const generatePartyPackPdf = (): void => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // --- Page 1: Secret Santa Bingo ---
    doc.setFillColor('#c62828'); // Festive Red
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text('Secret Santa Party Pack', pageWidth / 2, 25, { align: 'center' });

    doc.setFontSize(18);
    doc.setTextColor(50);
    doc.text('BINGO!', pageWidth / 2, 55, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text("How to Play:", margin, 70);
    doc.setFont('helvetica', 'normal');
    doc.text("As gifts are opened, cross off the squares that match the event. The first person to get four in a row wins!", margin, 78, { maxWidth: pageWidth - margin * 2 });


    const bingoItems = [
        'Gift is self-care related', 'Gift is a gift card', 'Gift makes everyone laugh', 'Someone gets a book',
        'Someone gets a mug', 'Gift is an experience', 'Someone guesses their Santa', 'Someone needs batteries',
        'Wrapping paper is amazing', 'A gift is re-gifted', 'Someone asks "Who had me?"', 'Gift is food or drink',
        'Gift is handmade', 'Someone gets socks', 'Gift is for a pet', "Someone says 'I love it!'"
    ];
    bingoItems.sort(() => 0.5 - Math.random()); // Shuffle for a unique card
    
    const boxSize = 40;
    const gridWidth = 4 * boxSize;
    const startX = (pageWidth - gridWidth) / 2;
    const startY = 95;

    doc.setFontSize(8);
    doc.setLineWidth(0.5);
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const x = startX + col * boxSize;
            const y = startY + row * boxSize;
            doc.setFillColor(248, 250, 252); // Light Slate
            doc.setDrawColor(226, 232, 240); // Lighter border
            doc.roundedRect(x, y, boxSize, boxSize, 3, 3, 'FD'); // Fill and Draw with rounded corners
            const text = bingoItems[row * 4 + col];
            if(text) {
                doc.text(text, x + boxSize / 2, y + boxSize / 2, { align: 'center', maxWidth: boxSize - 4, baseline: 'middle' });
            }
        }
    }

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Generated by SecretSantaMatch.com', pageWidth / 2, pageHeight - 10, { align: 'center' });


    // --- Award Pages ---
    const awards = [
        { title: 'Most Thoughtful Gift', subtitle: 'For the gift that truly captured the spirit of the recipient.' },
        { title: 'Funniest Gift', subtitle: 'For the gift that made the entire room laugh out loud.' },
        { title: 'Best Wrapped Gift', subtitle: 'For the presentation that was a gift in itself.' }
    ];

    awards.forEach(award => {
        doc.addPage(null, 'l'); // Add a new landscape page
        const landscapeWidth = doc.internal.pageSize.getWidth();
        const landscapeHeight = doc.internal.pageSize.getHeight();
        
        // Festive Borders
        doc.setFillColor('#c62828');
        doc.rect(0, 0, landscapeWidth, 15, 'F');
        doc.rect(0, landscapeHeight - 15, landscapeWidth, 15, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(36);
        doc.setTextColor(50);
        doc.text('PARTY AWARD', landscapeWidth / 2, 50, { align: 'center' });

        doc.setFontSize(24);
        doc.text(award.title, landscapeWidth / 2, 75, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(100);
        doc.text(award.subtitle, landscapeWidth / 2, 90, { align: 'center' });
        
        doc.setFontSize(16);
        doc.setTextColor(50);
        doc.text('Awarded To:', landscapeWidth / 2, 125, { align: 'center' });
        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.line(70, 145, landscapeWidth - 70, 145);

        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Generated by SecretSantaMatch.com', landscapeWidth / 2, landscapeHeight - 20, { align: 'center' });
    });

    doc.save('Secret_Santa_Party_Pack.pdf');
};
