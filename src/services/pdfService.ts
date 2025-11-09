
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


// START: Party Pack Generation Logic
const drawPageHeader = (doc: jsPDF, title: string) => {
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
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150);
        doc.text('Generated by SecretSantaMatch.com', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
};

const drawBingoCard = (doc: jsPDF) => {
    drawPageHeader(doc, "Secret Santa BINGO");

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(48, 59, 83);
    doc.text("How to Play:", 15, 45);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("Cross off squares as you watch the gift exchange happen. The first to get four in a row wins!", 15, 52, { maxWidth: 180 });

    const bingoItems = [
        "Someone gets socks", "Gift is handmade", "Gift is food or drink", "Someone asks 'Who had me?'",
        "A gift is re-gifted", "Someone gets a mug", "Someone gets a book", "Gift makes everyone laugh",
        "Gift is an experience", "Someone guesses their Santa", "Gift is for a pet", "Wrapping paper is amazing",
        "Someone needs batteries", "Gift is self-care related", "Someone says 'I love it!'", "Gift is a gift card"
    ];

    const shuffledItems = [...bingoItems].sort(() => Math.random() - 0.5);
    
    const boxSize = 45;
    const startX = 15;
    const startY = 65;
    
    doc.setFontSize(9);
    let itemIndex = 0;
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            if (itemIndex >= shuffledItems.length) break;
            const rectX = startX + col * boxSize;
            const rectY = startY + row * boxSize;
            
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(rectX, rectY, boxSize, boxSize, 3, 3, 'FD');
            
            const textLines = doc.splitTextToSize(shuffledItems[itemIndex], boxSize - 6);
            doc.setTextColor(48, 59, 83);
            doc.text(textLines, rectX + boxSize / 2, rectY + boxSize / 2, { align: 'center', baseline: 'middle' });
            itemIndex++;
        }
    }
};

const drawGuessingGame = (doc: jsPDF, participants: ExchangeData['p']) => {
    drawPageHeader(doc, "Who's My Santa? Guessing Game");
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(48, 59, 83);
    doc.text("Everyone writes down who they think their Secret Santa is. Reveal the answers after all the gifts have been opened!", 15, 45, { maxWidth: 180 });

    const tableBody = participants.map(p => [p.name, '']);
    
    autoTable(doc, {
        startY: 55,
        head: [['Participant Name', 'My Secret Santa Is...']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105], fontStyle: 'bold' },
    });
};

const drawGiftTags = (doc: jsPDF) => {
    drawPageHeader(doc, "Printable Gift Tags");

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(48, 59, 83);
    doc.text("Cut out these tags to add a special touch to your gifts!", 15, 45);

    const tagWidth = 80;
    const tagHeight = 45;
    const xPositions = [20, 110];
    const yPositions = [55, 105, 155, 205];

    for (const y of yPositions) {
        for (const x of xPositions) {
            doc.setDrawColor(200, 40, 40);
            doc.setLineWidth(0.5);
            doc.roundedRect(x, y, tagWidth, tagHeight, 5, 5, 'D');

            doc.setFillColor(String(240));
            doc.circle(x + 10, y + 10, 2.5, 'F');
            doc.setDrawColor(150);
            doc.setLineWidth(0.2);
            doc.line(x + 10, y + 10, x + 10, y + 2);

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(48, 59, 83);
            doc.text("To:", x + 10, y + 25);
            doc.setDrawColor(200);
            doc.setLineWidth(0.2);
            doc.line(x + 25, y + 25, x + tagWidth - 10, y + 25);
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text("From:", x + 10, y + 35);
            doc.setFont('helvetica', 'normal');
            doc.text("Your Secret Santa 🤫", x + 32, y + 35);
        }
    }
};

const drawAward = (doc: jsPDF, title: string, description: string) => {
    doc.setDrawColor(200, 40, 40);
    doc.setLineWidth(2);
    doc.rect(10, 10, 277, 190); // Outer border

    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(48, 59, 83);
    doc.text("Secret Santa Award", 148.5, 40, { align: 'center' });

    doc.setFontSize(22);
    doc.setTextColor(200, 40, 40);
    doc.text(title, 148.5, 70, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(description, 148.5, 85, { align: 'center' });

    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(48, 59, 83);
    doc.text("Presented to:", 50, 130);
    doc.setDrawColor(150);
    doc.setLineWidth(0.5);
    doc.line(95, 130, 250, 130);

    doc.text("Date:", 50, 150);
    doc.line(70, 150, 150, 150);
};

export const generatePartyPackPdf = (exchangeData: ExchangeData) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Page 1: Title Page
    drawPageHeader(doc, "Secret Santa Party Pack");
    doc.setFontSize(40);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(48, 59, 83);
    doc.text("Let the Fun Begin!", 105, 120, { align: 'center' });
    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    if (exchangeData.eventDetails) {
      const eventLines = doc.splitTextToSize(`For: ${exchangeData.eventDetails}`, 180);
      doc.text(eventLines, 105, 140, { align: 'center' });
    }
    
    // Page 2: BINGO
    doc.addPage();
    drawBingoCard(doc);

    // Page 3: Guessing Game
    doc.addPage();
    drawGuessingGame(doc, exchangeData.p);

    // Page 4: Gift Tags
    doc.addPage();
    drawGiftTags(doc);
    
    // Page 5-7: Awards (Landscape)
    doc.addPage(undefined, 'l');
    drawAward(doc, "Most Thoughtful Gift", "For the gift that truly captured the spirit of the recipient.");
    doc.addPage(undefined, 'l');
    drawAward(doc, "Funniest Gift", "For the gift that brought the biggest laughs of the night.");
    doc.addPage(undefined, 'l');
    drawAward(doc, "Best Wrapped Gift", "For the presentation that was a gift in itself.");

    drawFooter(doc);
    doc.save('Secret_Santa_Party_Pack.pdf');
};
// END: Party Pack Generation Logic
