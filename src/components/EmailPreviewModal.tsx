import React, { useState, useEffect } from 'react';

interface EmailPreviewModalProps {
  onClose: () => void;
  theme: string;
}

const getThemeColors = (theme: string) => {
    switch (theme) {
        case 'halloween': return { primary: '#f97316', secondary: '#1f2937' }; // Orange to Black
        case 'valentines': return { primary: '#dc2626', secondary: '#ec4899' }; // Red to Pink
        case 'christmas': return { primary: '#c62828', secondary: '#16a34a' }; // Red to Green
        case 'birthday': return { primary: '#0ea5e9', secondary: '#f59e0b' }; // Sky Blue to Amber
        case 'celebration': return { primary: '#4f46e5', secondary: '#d946ef' }; // Indigo to Fuchsia
        default: return { primary: '#c62828', secondary: '#16a34a' }; // Default to Christmas gradient
    }
};

const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({ onClose, theme }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const themeColors = getThemeColors(theme);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(true), 10);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div 
        className={`fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-preview-title"
    >
      <div 
        onClick={e => e.stopPropagation()} 
        className={`bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full transition-all duration-300 ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <h2 id="email-preview-title" className="text-2xl font-bold text-slate-800 font-serif mb-2">Email Preview</h2>
        <p className="text-gray-600 mb-6">This is a preview of the standard, festive email your participants will receive. The color scheme automatically matches the chosen email theme.</p>
        
        <div className="w-full border border-gray-200 rounded-lg overflow-hidden bg-[#f8fafc]">
            {/* Mock Email Body */}
            <div style={{ fontFamily: "'Montserrat', sans-serif" }} className="text-sm">
                <div style={{ background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.secondary})` }} className="text-white p-6 text-center">
                    <h1 className="text-xl font-bold m-0">You're a Secret Santa!</h1>
                </div>
                <div className="p-6">
                    <h2 className="text-lg font-bold text-slate-800 m-0">Hello, [Giver's Name]!</h2>
                    <p className="text-base text-slate-600 mt-2 leading-relaxed">The results are in! You are the Secret Santa for...</p>
                    <div className="text-2xl font-bold text-green-700 text-center my-4 p-4 bg-green-50 rounded-lg">
                        [Receiver's Name]
                    </div>
                    <div className="mt-5">
                        <h3 className="text-base font-bold text-slate-800 border-b-2 border-gray-200 pb-1">Their Gift Ideas & Notes</h3>
                        <p className="text-slate-600 mt-2 italic">No notes provided.</p>
                        <p className="mt-1"><strong>Suggested Budget:</strong> $25</p>
                    </div>
                    <div className="mt-6 p-4 bg-slate-100 border border-slate-200 rounded-lg">
                        <h3 className="m-0 font-bold text-slate-800">Event Details</h3>
                        <p className="m-0 mt-1 text-slate-600">Exchange will be at the holiday party on Dec 20th!</p>
                    </div>
                </div>
                <div className="text-xs text-slate-400 text-center p-4 bg-slate-50">
                    <p>Sent via SecretSantaMatch.com</p>
                </div>
            </div>
        </div>

        <div className="text-center mt-6">
          <button 
            onClick={onClose} 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailPreviewModal;
