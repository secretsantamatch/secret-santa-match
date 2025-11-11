import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import type { ExchangeData, Match } from '../types';

// Augment jsPDF type definition to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generatePdfFromDom = async (elementId: string, fileName: string): Promise<void> => {
    const input = document.getElementById(elementId);
    if (!input) {
        throw new Error(`Element with id '${elementId}' not found.`);
    }

    try {
        const canvas = await html2canvas(input, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(fileName);
    } catch (error) {
        console.error("Error generating PDF:", error);
        throw new Error("Could not generate the PDF. Please try again.");
    }
};

export const generateMasterListPdf = (exchangeData: ExchangeData): void => {
    const { p: participants, matches: matchIds, eventDetails } = exchangeData;
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Secret Santa - Master Match List', 14, 22);
    
    if (eventDetails) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Event Details: ${eventDetails}`, 14, 30);
    }
    
    const matches: Match[] = matchIds.map(m => ({
        giver: participants.find(p => p.id === m.g)!,
        receiver: participants.find(p => p.id === m.r)!,
    }));

    const tableColumn = ["Giver", "Receiver", "Receiver's Wishlist"];
    const tableRows: string[][] = [];

    matches.forEach(match => {
        const wishlist = [
            match.receiver.budget ? `Budget: $${match.receiver.budget}` : '',
            match.receiver.interests ? `Interests: ${match.receiver.interests}` : '',
            match.receiver.likes ? `Likes: ${match.receiver.likes}` : '',
            match.receiver.dislikes ? `Dislikes: ${match.receiver.dislikes}` : '',
            match.receiver.links ? `Links: ${match.receiver.links.split('\n')[0]}` : '',
        ].filter(Boolean).join('\n');

        const matchData = [
            match.giver.name,
            match.receiver.name,
            wishlist || 'No details provided.'
        ];
        tableRows.push(matchData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        styles: {
            font: 'helvetica',
            fontSize: 10,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [198, 40, 40], // Christmas Red
            textColor: 255,
            fontStyle: 'bold',
        },
    });

    doc.save('Secret_Santa_Master_List.pdf');
};


export const generateAllCardsPdf = async (exchangeData: ExchangeData): Promise<void> => {
    const doc = new jsPDF('p', 'in', [4, 6]); // 4x6 inch card size
    const cardElements = document.querySelectorAll<HTMLElement>('.printable-card-container');

    if (cardElements.length === 0) {
        throw new Error("Could not find any printable cards to generate the PDF.");
    }
    
    for (let i = 0; i < cardElements.length; i++) {
        const cardElement = cardElements[i];
        
        try {
            const canvas = await html2canvas(cardElement, { scale: 3, useCORS: true, backgroundColor: null });
            const imgData = canvas.toDataURL('image/png');

            if (i > 0) {
                doc.addPage();
            }
            
            doc.addImage(imgData, 'PNG', 0, 0, 4, 6, undefined, 'FAST');
        } catch (e) {
            console.error("Error processing card for PDF:", cardElement, e);
            // Don't throw, just skip the problematic card
        }
    }

    doc.save('Secret_Santa_All_Cards.pdf');
};


export const generatePartyPackPdf = async (exchangeData: ExchangeData): Promise<void> => {
    const doc = new jsPDF();
    
    // --- Page 1: Bingo Card ---
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Secret Santa Bingo!', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Mark off squares as you see these things happen during your gift exchange!', doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });

    const bingoSquares = [
        "Someone gets socks", "Gift is re-gifted", "Someone guesses their Santa", "Gift is food/drink",
        "Awkward hug", "Someone says 'Aww!'", "Wrapping paper rips", "Gift is handmade",
        "Someone drops a gift", "It's a gift card!", "The wrong person opens a gift", "Someone needs batteries",
        "FREE SPACE\n(You're having fun!)", "Someone gets a mug", "An 'inside joke' gift", "Someone is wearing a Santa hat",
        "Gift is for a pet", "Someone takes a photo", "Gift is opened upside down", "Someone looks confused",
        "Gift makes everyone laugh", "Someone can't open their gift", "The gift is booze", "Someone says 'I love it!'",
        "The gift is a candle"
    ];

    const shuffledSquares = bingoSquares.sort(() => 0.5 - Math.random());
    
    doc.autoTable({
        body: [
            shuffledSquares.slice(0, 5),
            shuffledSquares.slice(5, 10),
            shuffledSquares.slice(10, 15),
            shuffledSquares.slice(15, 20),
            shuffledSquares.slice(20, 25),
        ],
        startY: 35,
        theme: 'grid',
        styles: {
            halign: 'center',
            valign: 'middle',
            font: 'helvetica',
            fontSize: 9,
            cellHeight: 35,
            minCellHeight: 35,
            cellWidth: 35,
        },
        didParseCell: (data: any) => {
            if (data.cell.raw === "FREE SPACE\n(You're having fun!)") {
                data.cell.styles.fillColor = '#f1f5f9';
                data.cell.styles.fontStyle = 'bold';
            }
        }
    });

    // --- Page 2: Awards ---
    doc.addPage();
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Secret Santa Party Awards', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    
    const awards = [
        { title: "Most Thoughtful Gift", description: "For the Santa who clearly did their homework." },
        { title: "Funniest Gift", description: "For the gift that made everyone laugh out loud." },
        { title: "Best Presentation", description: "For the most beautifully wrapped or presented gift." },
        { title: "Most Creative Gift", description: "For the Santa who thought way outside the box." },
    ];
    
    let yPos = 40;
    awards.forEach(award => {
        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.roundedRect(14, yPos - 15, 182, 50, 3, 3, 'S');
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(award.title, 105, yPos, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'italic');
        doc.text(award.description, 105, yPos + 8, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text("Awarded to:", 30, yPos + 25);
        doc.setLineWidth(0.2);
        doc.line(60, yPos + 25, 180, yPos + 25);
        
        yPos += 65;
    });

    doc.save('Secret_Santa_Party_Pack.pdf');
};