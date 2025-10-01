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
}

export const generateIndividualCardsPdf = async (props: IndividualCardsPdfProps) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a6' });
  const cardWidth = doc.internal.pageSize.getWidth();
  const cardHeight = doc.internal.pageSize.getHeight();
  const { matches, backgroundOptions, ...cardProps } = props;

  const container = document.createElement('div');
  container.style.width = '310px'; 
  container.style.height = '437px';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);

  const selectedTheme = backgroundOptions.find(opt => opt.id === props.backgroundId);

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];

    await new Promise<void>(resolve => {
      root.render(
        React.createElement(PrintableCard, {
          match,
          ...cardProps,
          backgroundImageUrl: selectedTheme?.imageUrl || null,
          isPdfMode: true,
          onRendered: resolve
        })
      );
    });

    const cardElement = container.firstChild as HTMLElement;
    if (!cardElement) continue;

    const canvas = await html2canvas(cardElement, {
      scale: 3,
      backgroundColor: null,
      logging: false,
      useCORS: true,
    });
    
    const imgData = canvas.toDataURL('image/png', 1.0);
    if (i > 0) doc.addPage();
    doc.addImage(imgData, 'PNG', 0, 0, cardWidth, cardHeight);
  }

  root.unmount();
  document.body.removeChild(container);

  doc.save('SecretSanta-Cards.pdf');
};


export const generateMasterListPdf = ({ matches, eventDetails }: MasterListPdfProps) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('SecretSantaMatch.com', pageWidth / 2, 10, { align: 'center' });
    doc.text('SecretSantaMatch.com', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    doc.setFontSize(22);
    doc.setTextColor(0);
    doc.text('Secret Santa Master List', 105, 25, { align: 'center' });

    if (eventDetails) {
      doc.setFontSize(11);
      doc.setTextColor(100);
      const eventLines = doc.splitTextToSize(eventDetails, 180);
      doc.text(eventLines, 105, 35, { align: 'center' });
    }

    const tableData = matches.map(match => {
        const budgetText = match.receiver.budget ? (match.receiver.budget.startsWith('$') ? match.receiver.budget : `$${match.receiver.budget}`) : '';
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
      startY: 50,
      headStyles: { 
          fillColor: [209, 65, 65],
          halign: 'center' 
      },
      styles: {
          halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 45 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 30 },
      },
    });
    doc.save('SecretSanta-MasterList.pdf');
};
