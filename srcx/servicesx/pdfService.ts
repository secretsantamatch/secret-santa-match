import jsPDF from 'jspdf';
import ReactDOM from 'react-dom/client';
import React from 'react';
import html2canvas from 'html2canvas';
import type { Match, BackgroundOption, FontSizeSetting, OutlineSizeSetting, FontTheme } from '../types';
import PrintableCard from '../components/PrintableCard';

interface CardPdfOptions {
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

// Fix: Correctly type the element to allow for the 'onRendered' prop.
const renderComponentToCanvas = async (element: React.ReactElement<{ onRendered?: () => void }>): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = '408px'; // 4.25 inches * 96 DPI
        document.body.appendChild(container);

        const root = ReactDOM.createRoot(container);
        
        const onRendered = async () => {
            try {
                const canvas = await html2canvas(container.firstChild as HTMLElement, {
                    scale: 2, // Higher scale for better quality
                    useCORS: true,
                    backgroundColor: null,
                });
                resolve(canvas);
            } catch (error) {
                reject(error);
            } finally {
                root.unmount();
                document.body.removeChild(container);
            }
        };

        // We wrap the component with a fragment and pass the onRendered callback
        root.render(React.cloneElement(element, { onRendered }));
    });
};


export const generateIndividualCardsPdf = async (options: CardPdfOptions) => {
    const { matches, ...cardProps } = options;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [8.5, 11]
    });

    const cardWidth = 4.25;
    const cardHeight = 5.5;
    const margin = 0.5;

    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const pageIndex = Math.floor(i / 2);
        const positionIndex = i % 2;

        if (i > 0 && i % 2 === 0) {
            doc.addPage();
        }

        const yPos = positionIndex === 0 ? margin : margin + cardHeight;
        
        const selectedBg = options.backgroundOptions.find(opt => opt.id === options.backgroundId);

        // FIX: Replaced JSX syntax with React.createElement to be valid in a .ts file.
        // This resolves the parser error that was causing a cascade of other errors.
        const cardElement = React.createElement(PrintableCard, {
            match: match,
            eventDetails: cardProps.eventDetails,
            backgroundId: cardProps.backgroundId,
            backgroundImageUrl: selectedBg?.imageUrl || null,
            customBackground: cardProps.customBackground,
            textColor: cardProps.textColor,
            useTextOutline: cardProps.useTextOutline,
            outlineColor: cardProps.outlineColor,
            outlineSize: cardProps.outlineSize,
            fontSizeSetting: cardProps.fontSizeSetting,
            fontTheme: cardProps.fontTheme,
            lineSpacing: cardProps.lineSpacing,
            greetingText: cardProps.greetingText,
            introText: cardProps.introText,
            wishlistLabelText: cardProps.wishlistLabelText,
            isPdfMode: true,
        });

        const canvas = await renderComponentToCanvas(cardElement);
        const imgData = canvas.toDataURL('image/png');

        doc.setPage(pageIndex + 1);
        doc.addImage(imgData, 'PNG', margin, yPos, cardWidth, cardHeight);
    }

    doc.save('SecretSanta-Cards.pdf');
};


export const generateMasterListPdf = ({ matches, eventDetails }: { matches: Match[], eventDetails: string }) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Secret Santa - Master List', 105, 20, { align: 'center' });

    if (eventDetails) {
        doc.setFontSize(12);
        doc.setTextColor(100);
        const details = doc.splitTextToSize(eventDetails, 180);
        doc.text(details, 105, 30, { align: 'center' });
    }

    const tableColumn = ["Giver", "Receiver", "Notes", "Budget"];
    const tableRows: (string | undefined)[][] = [];

    matches.forEach(match => {
        const matchData = [
            match.giver.name,
            match.receiver.name,
            match.receiver.notes,
            match.receiver.budget ? `$${match.receiver.budget}` : '-',
        ];
        tableRows.push(matchData);
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] },
    });

    doc.save('SecretSanta-MasterList.pdf');
};
