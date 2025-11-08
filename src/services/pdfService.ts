// FIX: This file was corrupted. It has been restored with the necessary PDF generation functions.
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { ExchangeData } from '../types';

/**
 * Generates a multi-page PDF with one styled card for each participant.
 * It finds rendered <PrintableCard> components in the DOM and captures them.
 */
export const generateAllCardsPdf = async (exchangeData: ExchangeData): Promise<void> => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const { matches, p: participants } = exchangeData;
    
    // Reconstruct full Match objects
    const fullMatches = matches.map(m => ({
        giver: participants.find(p => p.id === m.g)!,
        receiver: participants.find(p => p.id === m.r)!,
    })).filter(m => m.giver && m.receiver);

    if (fullMatches.length === 0) {
        alert("No matches found to generate cards.");
        return;
    }

    for (let i = 0; i < fullMatches.length; i++) {
        const match = fullMatches[i];
        // The PrintableCard component should have an ID like `card-${giver.id}`
        const cardElement = document.getElementById(`card-${match.giver.id}`);
        
        if (!cardElement) {
            console.error(`Card element not found for participant ${match.giver.name}`);
            // Throw an error to be caught in the UI
            throw new Error(`Could not find the printable card for ${match.giver.name}. Please try again.`);
        }

        try {
            const canvas = await html2canvas(cardElement, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            if (i > 0) {
                pdf.addPage();
            }
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        } catch (error) {
            console.error("Error generating canvas for PDF:", error);
            throw new Error("There was an error generating the PDF image. Please ensure you are not using an ad blocker, which can sometimes interfere.");
        }
    }
    pdf.save('Secret_Santa_Cards.pdf');
};

/**
 * Generates a simple, text-based master list of all matches for the organizer.
 */
export const generateMasterListPdf = (exchangeData: ExchangeData): void => {
    const pdf = new jsPDF();
    const { matches, p: participants, eventDetails } = exchangeData;

    const fullMatches = matches.map(m => ({
        giver: participants.find(p => p.id === m.g)!,
        receiver: participants.find(p => p.id === m.r)!,
    })).filter(m => m.giver && m.receiver);

    pdf.setFontSize(18);
    pdf.text("Secret Santa Master List", 14, 22);
    pdf.setFontSize(11);
    if (eventDetails) {
        pdf.text(`Event: ${eventDetails}`, 14, 30);
    }
    
    let y = 40;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text("Giver (Secret Santa)", 14, y);
    pdf.text("Is giving to (Receiver)", 80, y);
    pdf.setFont('helvetica', 'normal');
    
    fullMatches.forEach(match => {
        y += 8;
        if (y > 280) { // page break logic
            pdf.addPage();
            y = 20;
        }
        pdf.text(match.giver.name, 14, y);
        pdf.text(match.receiver.name, 80, y);
    });

    pdf.save('Secret_Santa_Master_List.pdf');
};

/**
 * Generates a PDF party pack with fun extras like Bingo and Awards.
 */
export const generatePartyPackPdf = (exchangeData: ExchangeData): void => {
    const pdf = new jsPDF();

    // Page 1: Title
    pdf.setFontSize(22);
    pdf.text("Secret Santa Party Pack", 105, 20, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text("Fun extras for your gift exchange!", 105, 30, { align: 'center' });
    pdf.text("Provided by SecretSantaMatch.com", 105, 38, { align: 'center' });

    // Page 2: Bingo
    pdf.addPage();
    pdf.setFontSize(18);
    pdf.text("Secret Santa Gift Bingo", 14, 22);
    pdf.setFontSize(10);
    pdf.text("During the gift exchange, cross off squares as gifts are opened. First to get 5 in a row wins!", 14, 30);
    
    // Draw a 5x5 grid
    const startX = 14;
    const startY = 40;
    const cellSize = 35;
    const bingoTerms = [
        "Something Red", "Socks", "Mug", "Coffee or Tea", "A Book",
        "Funny Gift", "Handmade Gift", "Gift Card", "Something Sweet", "A Candle",
        "Alcohol", "A Game", "FREE SPACE", "Something Cozy", "A Plant",
        "Tech Gadget", "Lotion/Soap", "Kitchen Item", "Something Local", "Regifted Item?",
        "Pet-related", "Experience Gift", "Clothing Item", "Picture Frame", "Something That Smells Good"
    ];

    pdf.setFontSize(9);
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            const index = row * 5 + col;
            pdf.rect(startX + col * cellSize, startY + row * cellSize, cellSize, cellSize);
            // Split long text
            const textLines = pdf.splitTextToSize(bingoTerms[index], cellSize - 4);
            pdf.text(textLines, startX + col * cellSize + cellSize / 2, startY + row * cellSize + cellSize / 2, { align: 'center', baseline: 'middle' });
        }
    }
    
    // Page 3: Awards
    pdf.addPage();
    pdf.setFontSize(18);
    pdf.text("Secret Santa Party Awards", 14, 22);
    pdf.setFontSize(12);
    pdf.text("Vote for a winner in each category at the end of your party!", 14, 30);
    
    const awards = [
        "Most Thoughtful Gift",
        "Funniest Gift",
        "Most Creative Gift",
        "Best Wrapped Gift",
        "The 'Most Likely to Be Stolen' Award (for White Elephant)",
        "The 'What Is It?' Award"
    ];
    let awardY = 45;
    awards.forEach(award => {
        pdf.setFontSize(14);
        pdf.text(award, 14, awardY);
        pdf.setFontSize(10);
        pdf.text("Winner: _________________________________", 20, awardY + 8);
        awardY += 25;
    });

    pdf.save('Secret_Santa_Party_Pack.pdf');
};
