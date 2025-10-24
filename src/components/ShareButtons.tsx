import React from 'react';

const ShareButtons: React.FC = () => {
    const shareUrl = encodeURIComponent(window.location.origin);
    const shareText = encodeURIComponent("I just organized my Secret Santa gift exchange with this awesome free tool! 🎁");

    return (
        <div className="flex justify-center gap-3">
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors" aria-label="Share on Facebook">
                <img src="/facebook-logo.webp" alt="Share on Facebook" className="w-6 h-6" />
            </a>
            <a href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-slate-900 hover:bg-slate-700 text-white rounded-full transition-colors" aria-label="Share on X">
                <img src="/twitter-logo.webp" alt="Share on X" className="w-6 h-6" />
            </a>
            <a href={`https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors" aria-label="Share on WhatsApp">
                <img src="/whatsapp-logo.webp" alt="Share on WhatsApp" className="w-7 h-7" />
            </a>
        </div>
    );
};

export default ShareButtons;
