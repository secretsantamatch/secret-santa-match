import React, { useState } from 'react';
import type { Match } from '../types';

interface ShareLinksModalProps {
  matches: Match[];
  onClose: () => void;
  baseUrl: string;
  useShortUrls: boolean;
  onShortenUrl: (longUrl: string) => Promise<string>;
  onDownloadMasterList: () => void;
  onDownloadAllCards: () => void;
}

const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ 
  matches, onClose, baseUrl, useShortUrls, onShortenUrl,
  onDownloadMasterList, onDownloadAllCards 
}) => {
  const [copyAllStatus, setCopyAllStatus] = useState<'idle' | 'copying' | 'copied'>('idle');
  const [csvStatus, setCsvStatus] = useState<'idle' | 'generating' | 'done'>('idle');
  
  const generateLinksText = async () => {
    let text = 'Here are the private reveal links for our Secret Santa:\n\n';
    for (const { giver } of matches) {
      const longUrl = `${baseUrl}?id=${giver.id}`;
      const urlToUse = useShortUrls ? await onShortenUrl(longUrl) : longUrl;
      text += `${giver.name}: ${urlToUse}\n`;
    }
    return text;
  };

  const handleCopyAll = async () => {
    setCopyAllStatus('copying');
    const textToCopy = await generateLinksText();
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopyAllStatus('copied');
      setTimeout(() => setCopyAllStatus('idle'), 2000);
    });
  };

  const handleDownloadCsv = async () => {
    setCsvStatus('generating');
    let csvContent = "data:text/csv;charset=utf-8,Name,Link\n";
    for (const { giver } of matches) {
      const longUrl = `${baseUrl}?id=${giver.id}`;
      const urlToUse = useShortUrls ? await onShortenUrl(longUrl) : longUrl;
      csvContent += `${giver.name},${urlToUse}\n`;
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "secret_santa_links.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCsvStatus('done');
    setTimeout(() => setCsvStatus('idle'), 2000);
  };


  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-800 font-serif">Bulk Share & Download</h2>
          <p className="text-slate-600 mt-2">Use these power tools for sharing all links at once or downloading printable assets for your party.</p>
        </div>
        
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
           <button 
              onClick={handleCopyAll}
              disabled={copyAllStatus !== 'idle'}
              className={`w-full px-4 py-3 text-base font-semibold rounded-lg transition-colors flex items-center justify-center ${
                copyAllStatus === 'copied' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              {copyAllStatus === 'copying' ? 'Preparing...' : copyAllStatus === 'copied' ? 'Copied!' : 'Copy All Links'}
            </button>
            <button 
              onClick={handleDownloadCsv}
              disabled={csvStatus !== 'idle'}
              className={`w-full px-4 py-3 text-base font-semibold rounded-lg transition-colors flex items-center justify-center ${
                csvStatus === 'done' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              {csvStatus === 'generating' ? 'Generating...' : csvStatus === 'done' ? 'Downloaded!' : 'Download as CSV'}
            </button>
            <button 
              onClick={onDownloadMasterList}
              className="w-full px-4 py-3 text-base font-semibold rounded-lg transition-colors bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center"
            >
              Download Master List (PDF)
            </button>
            <button 
              onClick={onDownloadAllCards}
              className="w-full px-4 py-3 text-base font-semibold rounded-lg transition-colors bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center"
            >
              Download All Cards (PDF)
            </button>
        </div>

        <div className="p-6 border-t text-center">
          <button 
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-8 rounded-full transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareLinksModal;
