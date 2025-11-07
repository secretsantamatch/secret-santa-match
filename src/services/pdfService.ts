import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Match } from '../types';

/**
 * Generates a PDF from a given DOM element.
 * @param elementId The ID of the element to capture.
 * @param filename The name of the downloaded PDF file.
 */
export const generatePdfFromElement = async (elementId: string, filename: string): Promise<void> => {
    const input = document.getElementById(elementId);
    if (!input) {
        console.error(`Element with ID "${elementId}" not found.`);
        alert("Could not generate PDF: content to print was not found.");
        return;
    }

    try {
        const canvas = await html2canvas(input, { scale: 2, useCORS: true, allowTaint: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        const pdfImageWidth = pdfWidth;
        const pdfImageHeight = pdfImageWidth / ratio;

        let position = 0;
        let heightLeft = pdfImageHeight;

        pdf.addImage(imgData, 'PNG', 0, position, pdfImageWidth, pdfImageHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position -= pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfImageWidth, pdfImageHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save(filename);
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Sorry, there was an error creating the PDF. It may be due to cross-origin images. Please try using a different background or uploading your own.");
    }
};

/**
 * Generates a PDF of the master list of matches.
 * @param matches The array of matches.
 * @param eventDetails The event details string.
 */
// FIX: Export 'generateMasterListPdf' function to make it available for import.
export const generateMasterListPdf = (matches: Match[], eventDetails: string): void => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Secret Santa Master List", 14, 22);
    doc.setFontSize(12);
    doc.text(eventDetails, 14, 30);
    
    let y = 40;
    matches.forEach(({ giver, receiver }) => {
        if (y > 280) { // page break
            doc.addPage();
            y = 22;
        }
        const text = `${giver.name} is giving a gift to ---> ${receiver.name}`;
        doc.text(text, 14, y);
        y += 10;
    });

    doc.save('secret-santa-master-list.pdf');
};

/**
 * Generates a PDF for a "Who Got Whom?" party game.
 * @param matches The array of matches to get participant names from.
 */
// FIX: Export 'generatePartyPackPdf' function to make it available for import.
export const generatePartyPackPdf = (matches: Match[]): void => {
    const doc = new jsPDF();
    const participants = matches.map(m => m.giver.name).sort();

    doc.setFontSize(22);
    doc.text("Secret Santa Party Game!", 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text("Guess who has who! Write down your guess for each person.", 105, 25, { align: 'center' });

    let y = 40;
    const column1X = 15;
    const column2X = 110;
    let currentX = column1X;
    
    participants.forEach((name) => {
        if (y > 270) {
            if (currentX === column1X) {
                currentX = column2X;
                y = 40;
            } else {
                doc.addPage();
                y = 15;
                currentX = column1X;
            }
        }
        
        doc.setFontSize(14);
        doc.text(name, currentX, y);
        doc.setLineWidth(0.5);
        doc.line(currentX + 35, y, currentX + 90, y);
        y += 15;
    });

    doc.save('secret-santa-party-pack.pdf');
};
