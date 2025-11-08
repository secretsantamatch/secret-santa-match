import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { ExchangeData, Match } from '../types';

export const generateAllCardsPdf = async (exchangeData: ExchangeData) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const matches: Match[] = exchangeData.matches.map(m => ({
        giver: exchangeData.p.find(p => p.id === m.g)!,
        receiver: exchangeData.p.find(p => p.id === m.r)!,
    })).filter(m => m.giver && m.receiver);

    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const cardElement = document.getElementById(`card-${match.giver.id}`);
        
        if (cardElement) {
            try {
                const canvas = await html2canvas(cardElement, { scale: 2, useCORS: true });
                const imgData = canvas.toDataURL('image/png');
                
                const imgWidth = pdfWidth - 20; // with some margin
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                if (i > 0) {
                    pdf.addPage();
                }

                const x = (pdfWidth - imgWidth) / 2;
                let y = (pdfHeight - imgHeight) / 2;
                if (y < 10) y = 10; // Ensure some top margin

                pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

            } catch (error) {
                console.error(`Error generating canvas for ${match.giver.name}'s card:`, error);
                throw new Error("Could not generate PDF. One of the cards failed to render.");
            }
        }
    }

    pdf.save('Secret_Santa_Cards.pdf');
};

export const generateMasterListPdf = (exchangeData: ExchangeData) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.setFontSize(18);
    pdf.text("Secret Santa - Master List", 105, 20, { align: 'center' });
    
    if (exchangeData.eventDetails) {
        pdf.setFontSize(12);
        pdf.text("Event Details:", 14, 35);
        pdf.setFontSize(10);
        pdf.text(exchangeData.eventDetails, 14, 42, { maxWidth: 180 });
    }

    pdf.setFontSize(12);
    pdf.text("Matches:", 14, 60);

    const matches: Match[] = exchangeData.matches.map(m => ({
        giver: exchangeData.p.find(p => p.id === m.g)!,
        receiver: exchangeData.p.find(p => p.id === m.r)!,
    })).filter(m => m.giver && m.receiver);

    let yPosition = 70;
    matches.forEach((match, index) => {
        if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
        }
        pdf.setFontSize(10);
        pdf.text(`${index + 1}. ${match.giver.name} -> ${match.receiver.name}`, 14, yPosition);
        yPosition += 7;
    });

    pdf.save('Secret_Santa_Master_List.pdf');
};

// Helper for Party Pack
const addPageHeader = (pdf: jsPDF, title: string) => {
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, 105, 20, { align: 'center' });
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('From your friends at SecretSantaMatch.com', 105, 27, { align: 'center' });
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, 32, 190, 32);
};

// Secret Santa Bingo
const generateBingoPage = (pdf: jsPDF) => {
    pdf.addPage();
    addPageHeader(pdf, 'Secret Santa Bingo');

    pdf.setFontSize(10);
    pdf.text("How to Play: During the gift exchange, cross off a square when you see it happen. First to get five in a row wins!", 20, 45, { maxWidth: 170 });

    const squares = [
        "Someone says 'I love it!'", "Gift is a coffee mug", "Someone is wearing a Santa hat", "Gift is a pair of socks",
        "Someone asks 'Who had me?'", "Gift is a candle", "Someone mentions the budget", "Someone takes a photo",
        "Someone forgets who they had", "Gift is alcohol", "Someone says 'You shouldn't have!'", "Someone tears the wrapping paper slowly",
        "FREE SPACE",
        "Someone needs help opening their gift", "Gift is a gift card", "Someone says 'It's perfect!'", "Someone guesses who their Santa is",
        "Gift is a board game", "Someone's gift makes everyone laugh", "Gift is homemade", "Someone's pet gets involved",
        "Gift is food/candy", "Someone drops their gift", "Gift is re-gifted (jokingly or not)", "Someone says 'I almost got you that!'"
    ];
    
    const tableTop = 60;
    const tableLeft = 25;
    const cellSize = 32;
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(0);

    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            const x = tableLeft + col * cellSize;
            const y = tableTop + row * cellSize;
            const index = row * 5 + col;
            pdf.rect(x, y, cellSize, cellSize);
            pdf.setFontSize(8);
            pdf.text(squares[index], x + cellSize / 2, y + cellSize / 2, { align: 'center', maxWidth: cellSize - 4, baseline: 'middle' });
        }
    }
};

// Party Awards
const generateAwardsPage = (pdf: jsPDF) => {
    pdf.addPage();
    addPageHeader(pdf, 'Secret Santa Party Awards');
    pdf.setFontSize(10);
    pdf.text("Vote for your favorites after all the gifts are opened!", 20, 45, { maxWidth: 170 });
    
    const awards = [
        "Most Thoughtful Gift",
        "Funniest Gift",
        "Most Creative Gift",
        "Best Gift Wrapping",
        "The 'I Would Have Stolen That' Award",
        "The 'Best Reaction' Award"
    ];

    let y = 65;
    pdf.setLineWidth(0.2);
    pdf.setDrawColor(150);
    
    awards.forEach(award => {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(award, 20, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text("Winner:", 20, y + 10);
        pdf.line(38, y + 10, 190, y + 10);
        y += 25;
    });
};


export const generatePartyPackPdf = (exchangeData: ExchangeData) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Title Page
    pdf.setFontSize(36);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Secret Santa Party Pack', 105, 140, { align: 'center' });
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Have a wonderful gift exchange!', 105, 155, { align: 'center' });

    generateBingoPage(pdf);
    generateAwardsPage(pdf);

    pdf.save('Secret_Santa_Party_Pack.pdf');
};
