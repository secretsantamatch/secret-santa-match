import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
// FIX: Update imports to include ExchangeData and Match for new functions.
import type { Match, ExchangeData } from '../types';

// A helper function to add a card to the PDF, handling page breaks.
const addCardToPdf = async (pdf: jsPDF, cardElement: HTMLElement, yOffset: number, pageHeight: number, cardHeight: number) => {
    let currentOffset = yOffset;
    if (yOffset + cardHeight > pageHeight - 10) { // 10mm margin at bottom
        pdf.addPage();
        currentOffset = 10; // 10mm margin at top of new page
    }

    try {
        const canvas = await html2canvas(cardElement, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            backgroundColor: null, // Use transparent background
        });
        const imgData = canvas.toDataURL('image/png');
        
        // A4 page is 210mm wide. Use 190mm for content width (10mm margins).
        const pdfWidth = 190;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 10, currentOffset, pdfWidth, pdfHeight);
        return currentOffset + pdfHeight + 10; // Return the next Y offset, with 10mm spacing
    } catch (error) {
        console.error("Error capturing card element:", error);
        return currentOffset;
    }
};

/**
 * Generates a PDF from a list of match cards.
 * @param matches The array of matches.
 * @param setProgress A callback to update the generation progress (0 to 1).
 */
export const generatePdf = async (
    matches: Match[], 
    setProgress: (progress: number) => void
): Promise<void> => {
    setProgress(0);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yOffset = 10; // Start with a 10mm margin

    const cardElements = matches.map(match => document.getElementById(`card-${match.giver.id}`));
    
    if (cardElements.some(el => !el)) {
        console.error("Some card elements could not be found in the DOM.");
        return;
    }

    for (let i = 0; i < cardElements.length; i++) {
        const cardElement = cardElements[i];
        if (cardElement) {
            // A typical card on a standard letter/A4 page might be around 90mm wide.
            // Height would be (4/3) * 90 = 120mm. This allows two cards per page vertically.
            const cardHeightInMm = 120;
            
            yOffset = await addCardToPdf(pdf, cardElement, yOffset, pageHeight, cardHeightInMm);
            setProgress((i + 1) / matches.length);
        }
    }
    
    pdf.save('Secret-Santa-Assignments.pdf');
    setProgress(1);
};

// FIX: Add generateAllCardsPdf function to export.
/**
 * Generates a PDF of all styled cards for the exchange.
 * Relies on the cards being rendered in the DOM with IDs `card-${giver.id}`.
 * @param exchangeData The complete data for the exchange.
 */
export const generateAllCardsPdf = async (exchangeData: ExchangeData): Promise<void> => {
    const { p: participants, matches: matchIds } = exchangeData;

    const matches: Match[] = matchIds.map(m => ({
        giver: participants.find(p => p.id === m.g)!,
        receiver: participants.find(p => p.id === m.r)!,
    })).filter(m => m.giver && m.receiver);
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yOffset = 10;

    const cardElements = matches.map(match => document.getElementById(`card-${match.giver.id}`));
    
    if (cardElements.some(el => !el)) {
        console.error("Some card elements could not be found. Ensure they are rendered before generating the PDF.");
        alert("Error: Could not find the card elements to generate the PDF. This may be a bug.");
        return;
    }

    for (const cardElement of cardElements) {
        if (cardElement) {
            const cardHeightInMm = 120; // Approx height of a card
            yOffset = await addCardToPdf(pdf, cardElement, yOffset, pageHeight, cardHeightInMm);
        }
    }
    
    pdf.save('Secret-Santa-All-Cards.pdf');
};

// FIX: Add generateMasterListPdf function to export.
/**
 * Generates a simple text-based PDF of the master match list.
 * @param exchangeData The complete data for the exchange.
 */
export const generateMasterListPdf = (exchangeData: ExchangeData): void => {
    const { p: participants, matches: matchIds, eventDetails } = exchangeData;

    const matches: Match[] = matchIds.map(m => ({
        giver: participants.find(p => p.id === m.g)!,
        receiver: participants.find(p => p.id === m.r)!,
    })).filter(m => m.giver && m.receiver);

    const pdf = new jsPDF();
    pdf.setFontSize(22);
    pdf.text("Secret Santa Master List", 105, 20, { align: 'center' });
    if (eventDetails) {
        pdf.setFontSize(12);
        const splitDetails = pdf.splitTextToSize(eventDetails, 180);
        pdf.text(splitDetails, 105, 30, { align: 'center' });
    }
    
    pdf.setFontSize(14);
    let y = eventDetails ? 45 : 40;
    pdf.text("Giver", 20, y);
    pdf.text("Receiver", 100, y);
    y += 5;
    pdf.line(15, y, 195, y); // horizontal line
    y += 8;


    matches.forEach(match => {
        if (y > 280) {
            pdf.addPage();
            y = 20;
        }
        pdf.setFontSize(12);
        pdf.text(match.giver.name, 20, y);
        pdf.text(match.receiver.name, 100, y);
        y += 8;
    });

    pdf.save('Secret-Santa-Master-List.pdf');
};

// FIX: Add generatePartyPackPdf function to export.
/**
 * Generates a multi-page PDF with fun extras like Bingo and Awards.
 * @param exchangeData The complete data for the exchange.
 */
export const generatePartyPackPdf = (exchangeData: ExchangeData): void => {
    const pdf = new jsPDF();

    // Page 1: Title
    pdf.setFontSize(26);
    pdf.text("Secret Santa Party Pack!", 105, 20, { align: 'center' });
    pdf.setFontSize(16);
    pdf.text("Fun extras for your gift exchange", 105, 30, { align: 'center' });
    if (exchangeData.eventDetails) {
        pdf.setFontSize(12);
        const splitDetails = pdf.splitTextToSize(exchangeData.eventDetails, 180);
        pdf.text(splitDetails, 105, 40, { align: 'center' });
    }
    pdf.setFontSize(10);
    pdf.text("from SecretSantaMatch.com", 105, 280, { align: 'center' });

    // Page 2: Bingo
    pdf.addPage();
    pdf.setFontSize(22);
    pdf.text("Secret Santa Bingo", 105, 20, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text("Mark off a square when you see these things happen during the gift exchange!", 105, 28, { align: 'center' });

    const bingoItems = [
        "Someone gets socks", "A gift is re-gifted", "Someone guesses their santa",
        "A gift makes someone laugh", "Someone needs help opening a gift", "A gift is homemade",
        "Someone says 'I love it!'", "A pet is interested in a gift", "FREE SPACE",
        "Someone gets a mug", "A gift is edible", "A gift has a gift receipt",
        "Someone is wearing a santa hat", "A gift is for the whole group", "Someone's gift is for their hobby",
        "A gift is obviously a book"
    ];
    const shuffledItems = [...bingoItems].sort(() => 0.5 - Math.random());
    const finalItems = shuffledItems.slice(0, 25);
    finalItems[12] = "FREE SPACE"; // Center square

    const boxSize = 35;
    const startX = 17.5;
    const startY = 40;
    let itemIndex = 0;
    pdf.setFontSize(9);
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            const x = startX + col * boxSize;
            const y = startY + row * boxSize;
            pdf.rect(x, y, boxSize, boxSize);
            const text = finalItems[itemIndex++];
            const lines = pdf.splitTextToSize(text, boxSize - 4);
            pdf.text(lines, x + boxSize/2, y + boxSize/2, { align: 'center', baseline: 'middle' });
        }
    }

    // Page 3: Awards
    pdf.addPage();
    pdf.setFontSize(22);
    pdf.text("Holiday Party Awards", 105, 20, { align: 'center' });
    const awards = [
        "Most Creative Gift", "Funniest Gift", "Most Thoughtful Gift",
        "Best Wrapped Gift", "The 'I Would Steal That' Award", "Most Unexpected Gift"
    ];
    let awardY = 40;
    awards.forEach(award => {
        pdf.setFontSize(14);
        pdf.text(`${award}:`, 20, awardY);
        pdf.line(20, awardY + 2, 190, awardY + 2);
        awardY += 25;
    });

    pdf.save('Secret-Santa-Party-Pack.pdf');
};