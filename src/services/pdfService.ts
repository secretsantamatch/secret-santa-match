import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import ReactDOM from 'react-dom/client';
import React from 'react';
import PrintableCard from '../components/PrintableCard';
import type { Match, ExchangeData } from '../types';


// FIX: Removed the manual module augmentation for 'jspdf' as it was causing a
// module resolution error. The 'jspdf-autotable' import should handle this
// automatically. Calls to 'autoTable' are now cast to 'any' to ensure
// compilation even if type definitions are not picked up correctly.

export const generateAllCardsPdf = async (matches: Match[], options: ExchangeData): Promise<void> => {
    if (matches.length === 0) {
        alert("No valid matches to generate cards for.");
        return;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
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

        // FIX: Replaced JSX with React.createElement to support rendering within a .ts file
        // which may not have JSX processing enabled. This resolves parsing errors.
        const cardElement = React.createElement(
            'div',
            { style: { width: '600px' } }, // Render at a fixed high-res width
            React.createElement(PrintableCard, {
                match: match,
                isNameRevealed: true,
                eventDetails: options.eventDetails,
                backgroundOptions: options.backgroundOptions,
                bgId: options.bgId,
                bgImg: options.customBackground,
                txtColor: options.textColor,
                outline: options.useTextOutline,
                outColor: options.outlineColor,
                outSize: options.outlineSize,
                fontSize: options.fontSizeSetting,
                font: options.fontTheme,
                line: options.lineSpacing,
                greet: options.greetingText,
                intro: options.introText,
                wish: options.wishlistLabelText,
            })
        );
        
        await new Promise<void>(resolve => {
            tempRoot.render(cardElement);
            // Give it a moment to render images, especially from external sources
            setTimeout(resolve, 200); 
        });
        
        const cardNode = tempContainer.children[0] as HTMLElement;
        if (!cardNode) continue;
        
        try {
            const canvas = await html2canvas(cardNode, {
                scale: 2,
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

    tempRoot.unmount();
    document.body.removeChild(tempContainer);
};

export const generateMasterListPdf = async (matches: Match[], options: ExchangeData): Promise<void> => {
    const pdf = new jsPDF();
    
    const body = matches.map(match => {
        const details = [
            `Budget: $${match.receiver.budget || 'N/A'}`,
            `Interests: ${match.receiver.interests || 'N/A'}`,
            `Likes: ${match.receiver.likes || 'N/A'}`,
            `Dislikes: ${match.receiver.dislikes || 'N/A'}`,
            `Links: ${match.receiver.links.split('\n')[0] || 'N/A'}`
        ].join('\n');
        return [match.giver.name, match.receiver.name, details];
    });

    pdf.setFontSize(18);
    pdf.text("Secret Santa - Organizer's Master List", 14, 15);
    pdf.setFontSize(10);
    pdf.text(`Event: ${options.eventDetails || 'N/A'}`, 14, 22);

    (pdf as any).autoTable({
        head: [['Giver (Secret Santa)', 'Receiver', "Receiver's Wishlist & Details"]],
        body: body,
        startY: 28,
        styles: {
            cellPadding: 2,
            fontSize: 8,
            valign: 'middle'
        },
        headStyles: {
            fillColor: '#2d3748', // slate-800
            textColor: 255,
            fontStyle: 'bold',
        },
        alternateRowStyles: {
            fillColor: [241, 245, 249] // slate-100
        },
        columnStyles: {
            2: { cellWidth: 70 }
        }
    });

    pdf.save("Secret_Santa_Master_List.pdf");
};

const drawPageBorder = (pdf: jsPDF) => {
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();
    pdf.setDrawColor('#e2e8f0'); // slate-200
    pdf.setLineWidth(1);
    pdf.rect(5, 5, width - 10, height - 10);
};

const drawFooter = (pdf: jsPDF) => {
    const pageCount = pdf.internal.pages.length;
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor('#94a3b8'); // slate-400
        pdf.text(
            'Generated by SecretSantaMatch.com | The Easiest Free Secret Santa Generator',
            pdf.internal.pageSize.getWidth() / 2,
            pdf.internal.pageSize.getHeight() - 7,
            { align: 'center' }
        );
    }
};

export const generatePartyPackPdf = (data: ExchangeData): void => {
    const pdf = new jsPDF();

    // --- Page 1: Title Page ---
    drawPageBorder(pdf);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(26);
    pdf.setTextColor('#c62828'); // Red
    pdf.text('Secret Santa Party Pack', pdf.internal.pageSize.getWidth() / 2, 80, { align: 'center' });
    pdf.setFontSize(14);
    pdf.setTextColor('#334155'); // slate-700
    pdf.text('Fun Games for Your Gift Exchange!', pdf.internal.pageSize.getWidth() / 2, 95, { align: 'center' });

    // --- Page 2: Anonymous Hints Game ---
    pdf.addPage();
    drawPageBorder(pdf);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor('#c62828');
    pdf.text("Guessing Game: Who Am I?", 14, 25);
    pdf.setFontSize(10);
    pdf.setTextColor('#475569');
    pdf.text("Instructions: Cut out these hints and have each person read one aloud. Can you guess who the hint is about?", 14, 35);
    
    const hints = data.p.map(p => {
        const allInterests = [...(p.interests || '').split(','), ...(p.likes || '').split(',')].map(i => i.trim()).filter(Boolean);
        if (allInterests.length > 0) {
            const randomInterest = allInterests[Math.floor(Math.random() * allInterests.length)];
            return `My Secret Santa should know that I'm a big fan of... ${randomInterest}.`;
        }
        return `My Secret Santa will have to be extra creative with my gift!`;
    });

    (pdf as any).autoTable({
        body: hints.map(hint => [hint]),
        startY: 45,
        theme: 'grid',
        styles: {
            cellPadding: 4,
            fontSize: 10,
            lineColor: '#cbd5e1',
            lineWidth: 0.2
        },
        headStyles: {
            fillColor: '#ffffff',
            textColor: '#ffffff',
            lineWidth: 0
        }
    });

    // --- Page 3: Secret Santa Bingo ---
    pdf.addPage();
    drawPageBorder(pdf);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor('#c62828');
    pdf.text("Secret Santa Bingo", 14, 25);
    pdf.setFontSize(10);
    pdf.setTextColor('#475569');
    pdf.text("Instructions: Cross off a square as you see it happen during the gift exchange. First one to get five in a row wins!", 14, 35);

    const bingoSquares = [
        "Someone gets socks", "A gift is food-related", "Someone has to guess their Santa", "A gift makes everyone laugh", "Someone steals a gift",
        "A gift is re-gifted", "Someone gets a mug", "The wrapping is amazing", "A gift has batteries", "FREE SPACE",
        "Someone gets a candle", "A gift is handmade", "Someone is surprised", "A gift is a gadget", "Someone gets a book",
        "A gift is red or green", "Someone takes a photo", "A gift card is given", "Someone says 'Aww!'", "A pet-related gift",
        "Someone wears their gift", "The budget was ignored", "A gift is an inside joke", "Someone sings a carol", "A gift is a game"
    ].sort(() => 0.5 - Math.random());
    bingoSquares.splice(12, 0, 'FREE SPACE 🌟');

    const bingoBody = [];
    for(let i = 0; i < 5; i++) {
        bingoBody.push(bingoSquares.slice(i * 5, i * 5 + 5));
    }

    (pdf as any).autoTable({
        body: bingoBody,
        startY: 45,
        theme: 'grid',
        styles: {
            halign: 'center',
            valign: 'middle',
            fontSize: 8,
            cellPadding: 2,
            minCellHeight: 30,
            lineWidth: 0.5,
            lineColor: '#94a3b8'
        }
    });
    
    // --- Page 4: Party Awards ---
    pdf.addPage();
    drawPageBorder(pdf);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor('#c62828');
    pdf.text("Party Awards", 14, 25);
    pdf.setFontSize(10);
    pdf.setTextColor('#475569');
    pdf.text("Instructions: After all the gifts are opened, vote as a group and fill out these fun awards!", 14, 35);
    
    const awards = ["Funniest Gift", "Most Creative Gift", "Most Thoughtful Gift", "Most Likely to be Stolen"];
    let awardY = 50;
    awards.forEach(award => {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`The "${award}" Award Goes To:`, 20, awardY);
        pdf.setDrawColor('#cbd5e1');
        pdf.line(20, awardY + 8, 190, awardY + 8);
        awardY += 40;
    });
    
    drawFooter(pdf);
    pdf.save("Secret_Santa_Party_Pack.pdf");
};