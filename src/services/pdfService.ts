import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import type { ExchangeData, Match } from '../types';
import PrintableCard from '../components/PrintableCard';
import React from 'react';
import ReactDOM from 'react-dom/client';

// Helper function to render a React component to an off-screen div for capturing.
// It now returns both the element and a cleanup function to prevent memory leaks.
const renderComponentToOffscreenDiv = async (component: React.ReactElement, containerId: string): Promise<{ element: HTMLElement; unmount: () => void; }> => {
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        // Enforce a fixed size to ensure correct aspect ratio during capture.
        container.style.width = '600px'; 
        container.style.height = '800px';
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        document.body.appendChild(container);
    }

    const root = ReactDOM.createRoot(container);
    
    // The cleanup function that will unmount React and remove the DOM node.
    const unmount = () => {
        root.unmount();
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    };

    // Render the component and wait for the next event loop tick to allow React to paint.
    await new Promise<void>(resolve => {
        root.render(React.createElement(React.StrictMode, null, component));
        setTimeout(resolve, 0);
    });
    
    // Ensure images are loaded before capturing
    await Promise.all(Array.from(container.getElementsByTagName('img')).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; });
    }));
    
    return { element: container, unmount };
};


export const generateAllCardsPdf = async (data: ExchangeData): Promise<void> => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const cardMargin = 10;
    const cardWidth = pdfWidth - (cardMargin * 2);
    const cardHeight = cardWidth * (4 / 3);
    const x = cardMargin;
    const y = (pdfHeight - cardHeight) / 2;

    const reconstructedMatches = data.matches.map(m => {
        const giver = data.p.find(p => p.id === m.g);
        const receiver = data.p.find(p => p.id === m.r);
        return { giver, receiver };
    }).filter(m => m.giver && m.receiver) as Match[];

    for (let i = 0; i < reconstructedMatches.length; i++) {
        const match = reconstructedMatches[i];
        let unmount: (() => void) | null = null;

        try {
            const cardComponent = React.createElement(PrintableCard, {
                match: match,
                eventDetails: data.eventDetails,
                isNameRevealed: true,
                backgroundOptions: data.backgroundOptions,
                bgId: data.bgId,
                bgImg: data.customBackground,
                txtColor: data.textColor,
                outline: data.useTextOutline,
                outColor: data.outlineColor,
                outSize: data.outlineSize,
                fontSize: data.fontSizeSetting,
                font: data.fontTheme,
                line: data.lineSpacing,
                greet: data.greetingText,
                intro: data.introText,
                wish: data.wishlistLabelText,
            });
    
            const { element: container, unmount: unmountFn } = await renderComponentToOffscreenDiv(cardComponent, `pdf-card-${match.giver.id}`);
            unmount = unmountFn;
        
            const canvas = await html2canvas(container, { scale: 3, useCORS: true, backgroundColor: null });
            const imgData = canvas.toDataURL('image/png');
            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'PNG', x, y, cardWidth, cardHeight);
        } catch (error) {
            console.error(`Failed to render card for ${match.giver.name}:`, error);
        } finally {
            // This block guarantees that the cleanup function is called, even if an error occurs.
            if (unmount) {
                unmount();
            }
        }
    }

    pdf.save('Secret-Santa-Cards.pdf');
};

export const generateMasterListPdf = (data: ExchangeData) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Secret Santa Master List", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Event: ${data.eventDetails || 'General Gift Exchange'}`, 14, 30);

    const tableData = data.matches.map(match => {
        const giver = data.p.find(p => p.id === match.g)?.name || 'Unknown';
        const receiver = data.p.find(p => p.id === match.r)?.name || 'Unknown';
        return [giver, receiver];
    });

    autoTable(doc, {
        startY: 35,
        head: [['Giver (Secret Santa)', 'Is Giving To (Receiver)']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [212, 36, 38] },
    });
    
    doc.save('Secret-Santa-Master-List.pdf');
};


export const generatePartyPackPdf = (data: ExchangeData) => {
    const doc = new jsPDF('p', 'mm', 'a4');

    // --- Page 1: Bingo ---
    doc.setFontSize(22);
    doc.text("Secret Santa Bingo!", doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text("Mark off squares as you see them happen during your gift exchange!", doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });

    const bingoSquares = [
        "Someone says 'I have no idea what to get!'", "Someone shakes their gift", "Gift is a coffee mug", "Someone steals a gift (if playing White Elephant)",
        "Gift is socks", "Someone asks 'Who had me?'", "The gift is booze", "Someone re-gifts an item",
        "Someone guesses their Santa correctly", "A gift is obviously for the wrong gender", "FREE SPACE", "Gift is a candle",
        "Someone says 'You shouldn't have!'", "Wrapping paper is a disaster", "Gift is a gift card", "Someone's pet gets involved",
        "Someone needs batteries", "A gift gets dropped", "Someone wears a Santa hat", "Someone gets a prank gift",
        "Gift is handmade", "Someone cries (happy tears!)", "Gift is a board game", "Someone asks for a gift receipt"
    ].sort(() => 0.5 - Math.random());
    bingoSquares.splice(12, 0, "FREE SPACE"); // Ensure Free Space is in the middle

    autoTable(doc, {
        startY: 40,
        body: [
            bingoSquares.slice(0, 5),
            bingoSquares.slice(5, 10),
            bingoSquares.slice(10, 15),
            bingoSquares.slice(15, 20),
            bingoSquares.slice(20, 25),
        ],
        theme: 'grid',
        styles: {
            halign: 'center',
            valign: 'middle',
            cellPadding: 4,
            minCellHeight: 30,
            fontSize: 9,
        },
        headStyles: {
            fillColor: [212, 36, 38],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
        },
        columnStyles: {
            0: { cellWidth: 35 }, 1: { cellWidth: 35 }, 2: { cellWidth: 35 }, 3: { cellWidth: 35 }, 4: { cellWidth: 35 },
        },
    });

    // --- Page 2: Awards ---
    doc.addPage();
    doc.setFontSize(22);
    doc.text("Secret Santa Party Awards", doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text("Vote on these at the end of your party for some extra fun!", doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });

    const awards = [
        { title: "The 'Most Thoughtful' Gift Award", description: "For the gift that clearly required a lot of thought and effort." },
        { title: "The 'Funniest Gift' Award", description: "For the gift that made everyone laugh the hardest." },
        { title: "The 'Most Creative Wrap Job' Award", description: "For the person whose wrapping skills were next-level." },
        { title: "The 'Best Poker Face' Award", description: "For the Secret Santa who kept their identity a complete secret." },
        { title: "The 'Most Surprised' Award", description: "For the person with the most shocked or delighted reaction to their gift." },
    ];

    let currentY = 50;
    awards.forEach(award => {
        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, currentY, 170, 30, 3, 3, 'S');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(award.title, 25, currentY + 10);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Winner: _________________________________________`, 25, currentY + 22);
        currentY += 40;
    });

    doc.save('Secret-Santa-Party-Pack.pdf');
};