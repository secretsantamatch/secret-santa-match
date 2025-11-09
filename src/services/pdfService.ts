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
    const { backgroundOptions, p: participants } = exchangeData;
    const uniqueBgIds = new Set(participants.map(() => exchangeData.bgId));
    
    if (exchangeData.customBackground) {
        uniqueBgIds.add('custom');
    }

    const imagePromises: Promise<void>[] = [];

    uniqueBgIds.forEach(bgId => {
        let imageUrl: string | null = null;
        if (bgId === 'custom') {
            imageUrl = exchangeData.customBackground;
        } else {
            const bgOption = backgroundOptions.find(opt => opt.id === bgId);
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
            // FIX: The spread operator `...styleData` passed props with incorrect names.
            // This has been corrected by explicitly mapping `styleData` properties from the
            // `exchangeData` object to the corresponding props required by `PrintableCard`.
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

    const finalY = (doc as any).lastAutoTable.finalY || doc.internal.pageSize.getHeight() - 20;
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


// Helper to draw a BINGO card on a jsPDF document
const drawBingoCard = (doc: jsPDF, title: string, items: string[], x: number, y: number, width: number) => {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, x + width / 2, y + 8, { align: 'center' });
    
    const boxSize = (width - 10) / 4; // 4x4 grid
    const startX = x + 5;
    const startY = y + 15;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    let itemIndex = 0;
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const rectX = startX + col * boxSize;
            const rectY = startY + row * boxSize;
            
            // Draw rounded rectangle
            doc.setFillColor(248, 250, 252); // slate-50
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.roundedRect(rectX, rectY, boxSize, boxSize, 3, 3, 'FD');
            
            const text = items[itemIndex] || '';
            itemIndex++;
            const textLines = doc.splitTextToSize(text, boxSize - 6);
            doc.setTextColor(48, 59, 83); // slate-800
            doc.text(textLines, rectX + boxSize / 2, rectY + boxSize / 2, { align: 'center', baseline: 'middle' });
        }
    }
};

// Helper to draw a party award certificate
const drawAward = (doc: jsPDF, title: string, description: string, y: number) => {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, y, 180, 50, 5, 5, 'F');

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(200, 40, 40);
    doc.text(title, 105, y + 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(description, 105, y + 25, { align: 'center', maxWidth: 160 });

    doc.setFontSize(12);
    doc.setTextColor(48, 59, 83);
    doc.text("Presented to:", 30, y + 40);
    doc.setDrawColor(200);
    doc.line(65, y + 40, 180, y + 40);
};

/**
 * Generates a PDF "Party Pack" with BINGO cards and award certificates.
 */
export const generatePartyPackPdf = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Page 1: Secret Santa Bingo
    doc.setFillColor(200, 40, 40);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text("Secret Santa Party Pack", 105, 25, { align: 'center' });

    const bingoItems = [
        "Someone gets socks", "Gift is handmade", "Gift is food or drink", "Someone asks 'Who had me?'",
        "A gift is re-gifted", "Someone gets a mug", "Someone gets a book", "Gift makes everyone laugh",
        "Gift is an experience", "Someone guesses their Santa", "Gift is for a pet", "Wrapping paper is amazing",
        "Someone needs batteries", "Gift is self-care related", "Someone says 'I love it!'", "Gift is a gift card"
    ];

    // Create a unique bingo card
    const shuffledItems = [...bingoItems].sort(() => Math.random() - 0.5);
    drawBingoCard(doc, "Secret Santa BINGO", shuffledItems, 10, 50, 190);
    
    // Page 2: Awards
    doc.addPage();
    doc.setFillColor(200, 40, 40);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text("Secret Santa Party Awards", 105, 25, { align: 'center' });
    
    drawAward(doc, "Most Thoughtful Gift", "For the gift that truly captured the spirit of the recipient.", 50);
    drawAward(doc, "Funniest Gift", "For the gift that brought the biggest laughs of the night.", 110);
    drawAward(doc, "Best Wrapped Gift", "For the presentation that was a gift in itself.", 170);
    
    // Add footers to all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150);
        doc.text('Generated by SecretSantaMatch.com', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
    
    doc.save('Secret_Santa_Party_Pack.pdf');
};
