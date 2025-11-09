import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import type { Match, ExchangeData, BackgroundOption } from '../types';
import React from 'react';
import ReactDOM from 'react-dom/client';
import PrintableCard from '../components/PrintableCard';

const renderComponentToCanvas = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
    // New: Preload background image if it exists
    const bgImageStyle = window.getComputedStyle(element).backgroundImage;
    if (bgImageStyle && bgImageStyle !== 'none') {
        const imageUrlMatch = bgImageStyle.match(/url\("?(.+?)"?\)/);
        if (imageUrlMatch) {
            const imageUrl = imageUrlMatch[1];
            await new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve();
                img.onerror = () => reject(new Error(`Could not load image at ${imageUrl}`));
                img.src = imageUrl;
            });
        }
    }
    
    // Fallback delay just in case
    await new Promise(resolve => setTimeout(resolve, 300));

    return await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        scale: 2, // Higher scale for better quality
        backgroundColor: null,
    });
};

export const generateAllCardsPdf = async (exchangeData: ExchangeData): Promise<void> => {
    const { matches: matchIds, p: participants, ...styleData } = exchangeData;
    const matches: Match[] = matchIds.map(m => ({
        giver: participants.find(p => p.id === m.g)!,
        receiver: participants.find(p => p.id === m.r)!,
    })).filter(m => m.giver && m.receiver);

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [600, 800] // Strict 3:4 aspect ratio
    });
    doc.deletePage(1);

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '600px'; 
    tempContainer.style.height = '800px';
    document.body.appendChild(tempContainer);

    const root = ReactDOM.createRoot(tempContainer);

    for (const match of matches) {
        await new Promise<void>(resolve => {
            root.render(
                React.createElement(PrintableCard, {
                    match,
                    isNameRevealed: true,
                    eventDetails: styleData.eventDetails,
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
                })
            );
            
            setTimeout(async () => {
                const cardElement = tempContainer.firstChild as HTMLElement;
                if (cardElement) {
                    try {
                        const canvas = await renderComponentToCanvas(cardElement);
                        const imgData = canvas.toDataURL('image/png');
                        doc.addPage();
                        doc.addImage(imgData, 'PNG', 0, 0, 600, 800);
                    } catch (e) {
                         console.error("Failed to render card for PDF:", e);
                    }
                } else {
                     console.error("Could not find rendered card element for PDF.");
                }
                resolve();
            }, 500); // Allow time for render
        });
    }

    root.unmount();
    document.body.removeChild(tempContainer);
    doc.save('Secret_Santa_Cards.pdf');
};

export const generateMasterListPdf = (exchangeData: ExchangeData): void => {
    const { matches: matchIds, p: participants, eventDetails } = exchangeData;
     const matches: Match[] = matchIds.map(m => ({
        giver: participants.find(p => p.id === m.g)!,
        receiver: participants.find(p => p.id === m.r)!,
    })).filter(m => m.giver && m.receiver);

    const doc = new jsPDF();
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Secret Santa - Master List', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

    if (eventDetails) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Event Details: ${eventDetails}`, 14, 35);
    }
    
    const tableBody = matches.map(match => {
        const details = [];
        if (match.receiver.budget) details.push(`Budget: $${match.receiver.budget}`);
        if (match.receiver.interests) details.push(`Interests: ${match.receiver.interests}`);
        if (match.receiver.likes) details.push(`Likes: ${match.receiver.likes}`);
        if (match.receiver.dislikes) details.push(`Dislikes: ${match.receiver.dislikes}`);
        if (match.receiver.links) details.push(`Links: ${match.receiver.links.split('\n')[0]}`); // Only first link
        
        return [match.giver.name, match.receiver.name, details.join('\n')];
    });

    autoTable(doc, {
        startY: 50,
        head: [['Giver (Secret Santa)', 'Is giving to (Receiver)', "Receiver's Wishlist & Details"]],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: '#c62828' },
        didParseCell: (data) => {
            if (data.section === 'head') {
                data.cell.styles.fontStyle = 'bold';
            }
        },
        columnStyles: {
            2: { cellWidth: 'auto' }
        },
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


export const generatePartyPackPdf = (exchangeData: ExchangeData): void => {
    const doc = new jsPDF();
    const { p: participants, eventDetails } = exchangeData;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // --- Page 1: Bingo ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Secret Santa Bingo!', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Cross off squares as you watch people open their gifts!', pageWidth / 2, 30, { align: 'center' });

    const bingoSquares = [
        "Someone says 'I love it!'", "Gift is a mug", "Gift is socks", "Someone asks 'Who had me?'",
        "Gift is a candle", "Gift is a gift card", "Someone says 'You shouldn't have!'", "Gift makes everyone laugh",
        "FREE SPACE (Enjoy the party!)", "Gift is food or candy", "Someone guesses who had them", "Gift is alcohol",
        "Someone needs help opening their gift", "Gift is handmade", "Someone takes a photo of their gift", "Gift is a book or a game"
    ];
    bingoSquares.sort(() => 0.5 - Math.random()); // Shuffle
    
    autoTable(doc, {
        startY: 40,
        body: [
            bingoSquares.slice(0, 4),
            bingoSquares.slice(4, 8),
            bingoSquares.slice(8, 12),
            bingoSquares.slice(12, 16)
        ],
        theme: 'grid',
        styles: {
            halign: 'center',
            valign: 'middle',
            font: 'helvetica',
            fontSize: 10,
            cellPadding: 8,
            minCellHeight: 40
        },
        headStyles: {
            fillColor: '#c62828'
        }
    });

    // --- Page 2: Awards ---
    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Secret Santa Party Awards', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text("Fill these out and present them at the end of your exchange!", pageWidth / 2, 30, { align: 'center' });

    const awards = [
        { title: 'Most Creative Gift', desc: 'For the gift that was truly outside the box.' },
        { title: 'Funniest Gift', desc: 'For the gift that made everyone laugh the hardest.' },
        { title: 'Most Thoughtful Gift', desc: 'For the gift that perfectly matched the recipient.' },
        { title: 'Best Gift-Giver Award', desc: 'For the person who clearly did their homework!' }
    ];
    
    let yPos = 50;
    awards.forEach(award => {
        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, yPos, pageWidth - 40, 40, 3, 3, 'S');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(award.title, 25, yPos + 15);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(award.desc, 25, yPos + 22);

        doc.text("Awarded to: ____________________", 25, yPos + 32);

        yPos += 50;
    });
    
    // Footer for all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150);
        doc.text('Generated by SecretSantaMatch.com', pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    doc.save('Secret_Santa_Party_Pack.pdf');
};
