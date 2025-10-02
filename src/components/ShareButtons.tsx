import React from 'react';

// Icons for social media platforms
const FacebookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
const TwitterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616v.064c0 2.295 1.616 4.312 3.86 4.748-.717.195-1.466.23-2.2.084.6 1.933 2.34 3.337 4.39 3.375-1.659 1.3-3.738 2.063-5.99 2.063-.388 0-.771-.023-1.145-.067 2.138 1.362 4.673 2.159 7.423 2.159 8.841 0 13.677-7.421 13.43-13.886.945-.683 1.757-1.53 2.405-2.5z"/></svg>;
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M20.523 3.477a11.956 11.956 0 00-16.992 0A11.933 11.933 0 001.2 18.232l-1.134 4.14a.938.938 0 001.134 1.134l4.14-1.134a11.933 11.933 0 0014.755-2.331 11.956 11.956 0 000-16.992zM12 21.938a10.003 10.003 0 01-5.11-1.42l-3.34 0.916 0.916-3.34a10.003 10.003 0 01-1.42-5.11c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10zm0-15c-2.761 0-5 2.239-5 5s2.239 5 5 5 5-2.239 5-5-2.239-5-5-5zm0 8.5c-1.933 0-3.5-1.567-3.5-3.5s1.567-3.5 3.5-3.5 3.5 1.567 3.5 3.5-1.567 3.5-3.5 3.5z" transform="scale(1.1) translate(-1.2 -1.2)"/></svg>;

interface ShareButtonsProps {
    participantCount?: number;
}

const ShareButtons: React.FC<ShareButtonsProps> = ({ participantCount }) => {
    const shareUrl = "https://secretsantamatch.com/";
    const shareText = `I just used this free Secret Santa Generator! It's super easy and requires no sign-ups or emails. Check it out!`;
    const shareTextWithCount = participantCount 
        ? `I just organized our Secret Santa for ${participantCount} people with this free generator! It was super easy and required no sign-ups or emails. Check it out!`
        : shareText;

    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareTextWithCount);

    const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
        whatsapp: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
    };

    return (
        <div className="flex flex-wrap justify-center gap-3">
            <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[#1877F2] hover:bg-[#166eeb] text-white font-semibold py-2 px-4 rounded-lg transition-colors transform hover:scale-105" aria-label="Share on Facebook">
                <FacebookIcon />
                <span className="sm:hidden">Share on Facebook</span>
            </a>
            <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[#1DA1F2] hover:bg-[#1a90da] text-white font-semibold py-2 px-4 rounded-lg transition-colors transform hover:scale-105" aria-label="Share on Twitter">
                <TwitterIcon />
                <span className="sm:hidden">Share on Twitter</span>
            </a>
            <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[#25D366] hover:bg-[#20b859] text-white font-semibold py-2 px-4 rounded-lg transition-colors transform hover:scale-105" aria-label="Share on WhatsApp">
                <WhatsAppIcon />
                <span className="sm:hidden">Share on WhatsApp</span>
            </a>
        </div>
    );
};

export default ShareButtons;
