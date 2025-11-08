import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import type { Match, ExchangeData } from '../types';

// Extend jsPDF with autotable
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => jsPDF;
}

// FIX: Refactored this function to only handle adding a card to the current page.
// The page management logic, which was causing errors, has been moved to the caller.
// This also resolves the TypeScript error `Property 'y' does not exist on type 'jsPDF'`.
const addCardToPdf = async (pdf: jsPDF, cardElement: HTMLElement) => {
    try {
        const canvas = await html2canvas(cardElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: null,
            width: 600, // Force width
            height: 800, // Force height to maintain 3:4 aspect ratio
        });
        const imgData = canvas.toDataURL('image/png');
        
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // with margin
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        const y = (pageHeight - pdfHeight) / 2;
        pdf.addImage(imgData, 'PNG', 10, y > 10 ? y : 10, pdfWidth, pdfHeight);

    } catch (error) {
        console.error("Error capturing card element:", error);
    }
};

export const generateAllCardsPdf = async (exchangeData: ExchangeData): Promise<void> => {
    // FIX: Add a small delay to ensure React has rendered the hidden cards to the DOM.
    await new Promise(resolve => setTimeout(resolve, 100));

    const { p: participants, matches: matchIds } = exchangeData;

    const matches: Match[] = matchIds.map(m => ({
        giver: participants.find(p => p.id === m.g)!,
        receiver: participants.find(p => p.id === m.r)!,
    })).filter(m => m.giver && m.receiver);
    
    const cardElements = matches.map(match => document.getElementById(`card-${match.giver.id}`));
    
    if (cardElements.some(el => !el)) {
        console.error("Some card elements could not be found. Ensure they are rendered before generating the PDF.");
        throw new Error("Error: Could not find the card elements to generate the PDF. This may be a bug.");
    }
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // FIX: Corrected the page generation logic. The previous implementation was adding content
    // and then deleting the page, resulting in a broken PDF. This loop now correctly
    // adds one card per page.
    for (let i = 0; i < cardElements.length; i++) {
        const cardElement = cardElements[i];
        if (cardElement) {
            // Add a new page for each card after the first one.
            if (i > 0) {
                 pdf.addPage();
            }
            await addCardToPdf(pdf, cardElement);
        }
    }
    
    pdf.save('Secret-Santa-All-Cards.pdf');
};

/**
 * Generates a detailed PDF of the master match list using jspdf-autotable.
 * FIX: Restores detailed columns for budget, interests, likes, dislikes, and links.
 * @param exchangeData The complete data for the exchange.
 */
export const generateMasterListPdf = (exchangeData: ExchangeData): void => {
    const { p: participants, matches: matchIds, eventDetails } = exchangeData;

    const matches: Match[] = matchIds.map(m => ({
        giver: participants.find(p => p.id === m.g)!,
        receiver: participants.find(p => p.id === m.r)!,
    })).filter(m => m.giver && m.receiver);

    const doc = new jsPDF() as jsPDFWithAutoTable;
    
    doc.setFontSize(22);
    doc.text("Secret Santa Master List", doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    if (eventDetails) {
        doc.setFontSize(12);
        const splitDetails = doc.splitTextToSize(eventDetails, 180);
        doc.text(splitDetails, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
    }
    
    const head = [['Giver', 'Receiver', "Receiver's Details"]];
    const body = matches.map(match => {
        const details = [
            match.receiver.budget ? `Budget: $${match.receiver.budget}` : '',
            match.receiver.interests ? `Interests: ${match.receiver.interests}` : '',
            match.receiver.likes ? `Likes: ${match.receiver.likes}` : '',
            match.receiver.dislikes ? `Dislikes: ${match.receiver.dislikes}` : '',
            match.receiver.links ? `Links: ${match.receiver.links.split('\n')[0]}`: ''
        ].filter(Boolean).join('\n');
        
        return [match.giver.name, match.receiver.name, details];
    });

    doc.autoTable({
        head: head,
        body: body,
        startY: eventDetails ? 45 : 40,
        headStyles: { fillColor: [200, 38, 38] }, // Christmas Red
        styles: { cellPadding: 3, fontSize: 10, valign: 'middle' },
        columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 40 },
            2: { cellWidth: 'auto' },
        },
    });

    doc.save('Secret-Santa-Master-List.pdf');
};

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
        "A gift is obviously a book", "Someone gets chocolate", "Gift uses recycled wrapping",
        "Someone gets a candle", "Someone gets a gift card", "Gift related to a TV show",
        "A gift is smaller than a fist", "Someone says 'You shouldn't have!'", "A gift requires batteries",
        "Someone needs to borrow scissors"
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