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
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
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
    const { backgroundOptions, bgId, customBackground } = exchangeData;
    const uniqueBgIds = new Set([bgId]);
    
    if (customBackground) {
        uniqueBgIds.add('custom');
    }

    const imagePromises: Promise<void>[] = [];

    uniqueBgIds.forEach(id => {
        let imageUrl: string | null = null;
        if (id === 'custom') {
            imageUrl = customBackground;
        } else {
            const bgOption = backgroundOptions.find(opt => opt.id === id);
            imageUrl = bgOption?.imageUrl || null;
        }

        if (imageUrl) {
            const promise = new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous'; // Important for CORS
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
                // Add an extra small delay right before capturing
                await new Promise(resolve => setTimeout(resolve, 200));

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
        const detailsLines = doc.splitTextToSize(`Event Details: ${eventDetails}`, 180);
        doc.text(detailsLines, 14, startY);
        startY += (detailsLines.length * 5) + 5;
    }

    if (exchangeDate) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
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
        headStyles: { fillColor: [200, 40, 40] },
        columnStyles: {
            0: { cellWidth: 40, halign: 'left' },
            1: { cellWidth: 40, halign: 'left' },
            2: { halign: 'left', cellWidth: 'auto' }
        },
        didParseCell: function (data) {
            if (data.section === 'head') {
                data.cell.styles.fontStyle = 'bold';
            }
            if (data.column.index < 2 && data.section === 'body') {
                data.cell.styles.fontStyle = 'bold';
            }
             if (data.column.index === 2 && data.section === 'body') {
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

const drawHeader = (doc: jsPDF, title: string) => {
    doc.setFillColor(200, 40, 40); // Festive Red
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, 'F');
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(title, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
};

const drawFooter = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150);
        doc.text('Generated by SecretSantaMatch.com', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
};

const drawBingoCard = (doc: jsPDF) => {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(48, 59, 83);
    doc.text("Secret Santa BINGO", doc.internal.pageSize.getWidth() / 2, 45, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("How to Play: Mark a square when you see it happen during the gift exchange!", doc.internal.pageSize.getWidth() / 2, 52, { align: 'center' });

    const bingoItems = [
        "Someone gets socks", "Gift is handmade", "Gift is food or drink", "Someone asks 'Who had me?'",
        "A gift is re-gifted", "Someone gets a mug", "Someone gets a book", "Gift makes everyone laugh",
        "Gift is an experience", "Someone guesses their Santa", "Gift is for a pet", "Wrapping paper is amazing",
        "Someone needs batteries", "Gift is self-care related", "Someone says 'I love it!'", "Gift is a gift card"
    ];
    const shuffledItems = [...bingoItems].sort(() => Math.random() - 0.5);

    const boxSize = (doc.internal.pageSize.getWidth() - 40) / 4;
    const startX = 20;
    const startY = 65;
    
    doc.setFontSize(9);
    let itemIndex = 0;
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const rectX = startX + col * boxSize;
            const rectY = startY + row * boxSize;
            
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(rectX, rectY, boxSize, boxSize, 3, 3, 'FD');
            
            const text = shuffledItems[itemIndex] || '';
            itemIndex++;
            const textLines = doc.splitTextToSize(text, boxSize - 6);
            doc.setTextColor(48, 59, 83);
            doc.text(textLines, rectX + boxSize / 2, rectY + boxSize / 2, { align: 'center', baseline: 'middle' });
        }
    }
};

const drawAwards = (doc: jsPDF) => {
    const drawAward = (title: string, description: string) => {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Background & Border
        doc.setDrawColor(200, 40, 40);
        doc.setLineWidth(1.5);
        doc.roundedRect(10, 10, pageWidth - 20, pageHeight - 20, 5, 5, 'D');

        // Title
        doc.setFontSize(28);
        doc.setFont('serif', 'bold');
        doc.setTextColor(48, 59, 83);
        doc.text(title, pageWidth / 2, 60, { align: 'center' });
        
        // Description
        doc.setFontSize(12);
        doc.setFont('serif', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text(description, pageWidth / 2, 75, { align: 'center' });

        // Recipient Line
        doc.setFontSize(14);
        doc.setFont('sans-serif', 'normal');
        doc.setTextColor(48, 59, 83);
        doc.text("Presented to:", 30, 120);
        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.line(70, 120, pageWidth - 30, 120);
    };

    doc.addPage(undefined, 'l');
    drawAward("Most Thoughtful Gift", "For the gift that truly captured the spirit of the recipient.");
    doc.addPage(undefined, 'l');
    drawAward("Funniest Gift", "For the gift that brought the biggest laughs of the night.");
    doc.addPage(undefined, 'l');
    drawAward("Best Wrapped Gift", "For the presentation that was a gift in itself.");
};

const drawGiftTags = (doc: jsPDF) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const tagWidth = (pageWidth - 40) / 2;
    const tagHeight = tagWidth * 0.6;
    const startX1 = 15;
    const startX2 = startX1 + tagWidth + 10;
    const startY = 45;
    const yMargin = 10;
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("Cut out these tags to add a special touch to your gifts!", 15, 40);

    for (let i = 0; i < 4; i++) {
        const currentY = startY + i * (tagHeight + yMargin);
        
        [startX1, startX2].forEach(x => {
            doc.setDrawColor(200, 40, 40);
            doc.setLineWidth(0.5);
            doc.roundedRect(x, currentY, tagWidth, tagHeight, 5, 5, 'D');
            
            // Hole punch
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(200, 40, 40);
            doc.circle(x + 10, currentY + 10, 2, 'FD');
            doc.setDrawColor(200, 40, 40);
            doc.line(x + 10, currentY + 10, x + 10, currentY); // String

            // Text
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(48, 59, 83);
            doc.text("To:", x + 10, currentY + 25);
            doc.setDrawColor(200);
            doc.line(x + 25, currentY + 25, x + tagWidth - 10, currentY + 25);
            
            doc.text("From:", x + 10, currentY + 38);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text("Your Secret Santa", x + 28, currentY + 38);
        });
    }
};

const drawGuessingGame = (doc: jsPDF, participants: ExchangeData['p']) => {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(48, 59, 83);
    doc.text("Who's My Santa?", doc.internal.pageSize.getWidth() / 2, 45, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("Write down your guess for who you think is your Secret Santa!", doc.internal.pageSize.getWidth() / 2, 52, { align: 'center' });

    const startY = 65;
    const lineHeight = 10;

    participants.forEach((p, i) => {
        const y = startY + i * lineHeight;
        if (y > doc.internal.pageSize.getHeight() - 20) {
            // This is a simple implementation. For very large groups, a second column or page would be needed.
            return;
        }
        doc.setFontSize(12);
        doc.setTextColor(48, 59, 83);
        doc.text(`${p.name}:`, 20, y);
        doc.setDrawColor(200);
        doc.line(45, y, doc.internal.pageSize.getWidth() - 20, y);
    });
};

/**
 * Generates the ultimate PDF "Party Pack" with a title page, BINGO, awards, gift tags, and a guessing game.
 * @param exchangeData The full data for the gift exchange.
 */
export const generatePartyPackPdf = (exchangeData: ExchangeData) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Page 1: Title Page
    drawHeader(doc, "Secret Santa Party Pack");
    doc.setFontSize(36);
    doc.setFont('serif', 'bold');
    doc.setTextColor(48, 59, 83);
    doc.text("Let the Fun Begin!", doc.internal.pageSize.getWidth() / 2, 100, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139);
    doc.text("Everything you need for a memorable gift exchange.", doc.internal.pageSize.getWidth() / 2, 115, { align: 'center' });
    if (exchangeData.eventDetails) {
        doc.setFontSize(12);
        doc.setFont('sans-serif', 'bold');
        doc.text("For Your Event:", doc.internal.pageSize.getWidth() / 2, 140, { align: 'center' });
        doc.setFont('sans-serif', 'normal');
        const detailsLines = doc.splitTextToSize(exchangeData.eventDetails, 150);
        doc.text(detailsLines, doc.internal.pageSize.getWidth() / 2, 148, { align: 'center' });
    }
    
    // Page 2: Secret Santa Bingo
    doc.addPage();
    drawHeader(doc, "Party Games");
    drawBingoCard(doc);
    
    // Page 3: Guessing Game
    doc.addPage();
    drawHeader(doc, "Party Games");
    drawGuessingGame(doc, exchangeData.p);

    // Page 4: Printable Gift Tags
    doc.addPage();
    drawHeader(doc, "Printable Gift Tags");
    drawGiftTags(doc);
    
    // Awards Pages (Landscape)
    drawAwards(doc);
    
    // Add footers to all pages
    drawFooter(doc);
    
    doc.save('Secret_Santa_Party_Pack.pdf');
};
