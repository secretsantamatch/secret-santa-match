import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Match, Participant } from '../types';

/**
 * FIX: Implement the PDF generation service for creating a PDF from multiple HTML elements.
 * This function takes an array of HTML elements (e.g., printable cards), converts each
 * to a canvas image, and adds each image to a new page in a PDF document.
 */
export const generatePdfForCards = async (
  cardElements: HTMLElement[],
  fileName: string
): Promise<void> => {
  if (!cardElements || cardElements.length === 0) {
    alert('No cards found to generate a PDF.');
    return;
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const cardAspectRatio = 3 / 4; // Aspect ratio of the PrintableCard component

  // Calculate dimensions to fit the card onto an A4 page while maintaining aspect ratio
  let cardPdfHeight = pdfWidth / cardAspectRatio;
  let cardPdfWidth = pdfWidth;

  if (cardPdfHeight > pdfHeight) {
    cardPdfHeight = pdfHeight;
    cardPdfWidth = cardPdfHeight * cardAspectRatio;
  }

  const x = (pdfWidth - cardPdfWidth) / 2;
  const y = (pdfHeight - cardPdfHeight) / 2;

  for (let i = 0; i < cardElements.length; i++) {
    const cardElement = cardElements[i];
    try {
      const canvas = await html2canvas(cardElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true, // Needed for external images
        allowTaint: true,
      });

      const imgData = canvas.toDataURL('image/png');

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'PNG', x, y, cardPdfWidth, cardPdfHeight);
    } catch (error) {
      console.error(`Error generating PDF for card ${i + 1}:`, error);
      // If an error occurs, add a text page to the PDF to indicate failure for that card
      if (i > 0) pdf.addPage();
      pdf.text(`Error generating card for participant ${i + 1}.`, 10, 10);
    }
  }

  pdf.save(`${fileName}.pdf`);
};

// FIX: Add generateMasterListPdf function
export const generateMasterListPdf = async (
  matches: Match[],
  eventDetails: string,
  participants: Participant[]
): Promise<void> => {
  if (!matches || matches.length === 0) {
    alert('No matches found to generate a master list.');
    return;
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  let y = 15; // Initial y position

  const addText = (text: string, size: number, options: any) => {
    if (y > 280) { // Check for page break
      pdf.addPage();
      y = 15;
    }
    pdf.setFontSize(size);
    pdf.text(text, pdfWidth / 2, y, { align: 'center', ...options });
    y += (size / 2.5); // Increment y
  };

  addText('Secret Santa Master List', 22, { fontStyle: 'bold' });
  y += 5;
  if (eventDetails) {
    addText(eventDetails, 12, {});
    y += 10;
  }

  pdf.setFontSize(12);
  pdf.text("Giver -> Receiver", 20, y);
  y += 2;
  pdf.line(20, y, pdfWidth - 20, y);
  y += 8;

  for (const match of matches) {
    if (y > 280) { // Check for page break before printing a match
        pdf.addPage();
        y = 15;
    }
    const matchText = `${match.giver.name}  ->  ${match.receiver.name}`;
    pdf.text(matchText, 20, y);
    y += 8;
  }

  pdf.save('Secret_Santa_Master_List.pdf');
};

// FIX: Add generatePartyPackPdf function
export const generatePartyPackPdf = async (
  participants: Participant[],
  eventDetails: string
): Promise<void> => {
  if (!participants || participants.length === 0) {
    alert('No participants found for the party pack.');
    return;
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const drawCard = (participantName: string) => {
    const pdfWidth = pdf.internal.pageSize.getWidth();
    pdf.rect(10, 10, pdfWidth - 20, 277); // Border

    let y = 25;
    pdf.setFontSize(20);
    pdf.text("Secret Santa Wishlist", pdfWidth / 2, y, { align: 'center' });
    y += 15;

    pdf.setFontSize(14);
    pdf.text(`My Name: ${participantName}`, 20, y);
    y += 15;
    
    const addSection = (title: string, lines: number) => {
        pdf.setFontSize(12);
        pdf.text(title, 20, y);
        y += 6;
        for (let i = 0; i < lines; i++) {
            pdf.line(20, y, pdfWidth - 30, y);
            y += 8;
        }
        y+= 5;
    };

    addSection("My Interests & Hobbies:", 3);
    addSection("Things I Like (ideas for my Santa!):", 4);
    addSection("Dislikes & Things to Avoid:", 3);
    addSection("Specific Wishlist Links:", 3);

    if (eventDetails) {
        pdf.setFontSize(10);
        pdf.text("Event Details:", 20, y);
        y += 5;
        pdf.setFontSize(9);
        pdf.text(eventDetails, 20, y, { maxWidth: pdfWidth - 40 });
    }
  }

  participants.forEach((p, i) => {
      if (i > 0) {
          pdf.addPage();
      }
      drawCard(p.name);
  });
  
  pdf.save('Secret_Santa_Party_Pack.pdf');
};
