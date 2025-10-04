import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import React from 'react';
import ReactDOM from 'react-dom/client';
import type { Match, FontSizeSetting, OutlineSizeSetting, FontTheme, BackgroundOption } from '../types';
import PrintableCard from '../components/PrintableCard';

interface IndividualCardsPdfProps {
  matches: Match[];
  eventDetails: string;
  backgroundOptions: BackgroundOption[];
  backgroundId: string;
  customBackground: string | null;
  textColor: string;
  useTextOutline: boolean;
  outlineColor: string;
  outlineSize: OutlineSizeSetting;
  fontSizeSetting: FontSizeSetting;
  fontTheme: FontTheme;
  lineSpacing: number;
  greetingText: string;
  introText: string;
  wishlistLabelText: string;
}

interface MasterListPdfProps {
  matches: Match[];
  eventDetails: string;
  exchangeDate?: string;
}

export const generateIndividualCardsPdf = async (props: IndividualCardsPdfProps) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: [4.25, 5.5] });
  const cardWidth = 4.25;
  const cardHeight = 5.5;
  const { matches, backgroundOptions, ...cardProps } = props;

  const container = document.createElement('div');
  container.style.width = '425px'; 
  container.style.height = '550px';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);

  const selectedTheme = backgroundOptions.find(opt => opt.id === props.backgroundId);

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];

    const renderPromise = new Promise<void>(resolve => {
      root.render(
        React.createElement(PrintableCard, {
          match,
          ...cardProps,
          backgroundImageUrl: selectedTheme?.imageUrl || null,
          isPdfMode: true,
          onRendered: resolve,
          isNameRevealed: true, // Always show name for PDF
        })
      );
    });

    const timeoutPromise = new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error(`Rendering card for ${match.giver.name} timed out.`)), 5000)
    );

    await Promise.race([renderPromise, timeoutPromise]);

    const cardElement = container.firstChild as HTMLElement;
    if (!cardElement) continue;

    const canvas = await html2canvas(cardElement, {
      scale: 3,
      backgroundColor: 'transparent',
      logging: false,
      useCORS: true,
      imageTimeout: 5000,
    });
    
    const imgData = canvas.toDataURL('image/png', 1.0);
    if (i > 0) doc.addPage();
    doc.addImage(imgData, 'PNG', 0, 0, cardWidth, cardHeight, undefined, 'FAST');
  }

  root.unmount();
  document.body.removeChild(container);

  doc.save('SecretSanta-Cards.pdf');
};


export const generateMasterListPdf = ({ matches, eventDetails, exchangeDate }: MasterListPdfProps) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let startY = 35;

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('SecretSantaMatch.com', pageWidth / 2, 10, { align: 'center' });
    
    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text('Secret Santa Master List', pageWidth / 2, 25, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(100);

    if (eventDetails) {
      const eventLines = doc.splitTextToSize(eventDetails, 180);
      doc.text(eventLines, pageWidth / 2, startY, { align: 'center' });
      startY += (eventLines.length * 5) + 5;
    }

    if (exchangeDate) {
        const dateParts = exchangeDate.split('-').map(part => parseInt(part, 10));
        let dateObj = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
        const formattedDate = dateObj.toLocaleDateString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
        });
        let dateString = `Exchange Date: ${formattedDate}`;
        doc.text(dateString, pageWidth / 2, startY, { align: 'center' });
        startY += 10;
    }

    const tableData = matches.map(match => {
        const budgetText = match.receiver.budget ? (match.receiver.budget.toString().startsWith('$') ? match.receiver.budget : `$${match.receiver.budget}`) : '';
        return [
            match.giver.name,
            match.receiver.name,
            match.receiver.notes || '',
            budgetText,
        ];
    });

    autoTable(doc, {
      head: [['Giver', 'Receiver', 'Wishlist/Notes', 'Budget']],
      body: tableData,
      startY: startY,
      headStyles: { 
          fillColor: '#c62828',
          halign: 'center' 
      },
      styles: {
          halign: 'center',
          cellPadding: 3,
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'left' },
        2: { halign: 'left' },
      },
      didDrawPage: (data) => {
        // Footer
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text('SecretSantaMatch.com', pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    });
    doc.save('SecretSanta-MasterList.pdf');
};
