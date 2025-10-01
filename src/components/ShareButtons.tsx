import React, { useState } from 'react';

const TwitterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>;
const FacebookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a4 4 0 0 0-4 4v2.01h-2v3.98h2z"></path></svg>;
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16.75 13.96c.25.13.43.2.5.33.07.13.07.58.02.73-.05.15-.43.54-.68.78-.25.25-.5.38-.88.38-.38 0-1.15-.2-2.13-.53-1-.33-1.95-1-2.83-1.9-1.28-1.28-2.15-2.8-2.33-3.23-.18-.43-.02-.68.13-.83.15-.15.33-.38.43-.5.1-.13.15-.25.25-.43.1-.18.05-.33-.03-.43-.08-.1-.18-.2-.33-.38-.15-.18-.3-.33-.4-.43-.1-.1-.23-.15-.33-.15-.1 0-.25.02-.38.02s-.3.02-.45.13c-.15.1-.38.33-.5.5-.13.18-.5.75-.5 1.75s.53 2.5 1.18 3.43c.65.93 1.5 1.73 2.45 2.28.95.55 1.75.83 2.5.83.75 0 1.58-.33 1.83-.58.25-.25.48-.63.63-1s.15-.75.1-1c-.05-.25-.15-.43-.25-.53-.1-.1-.2-.13-.3-.13s-.25 0-.38.08zM12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"></path></svg>;
const PinterestIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.633 7.855 6.356 9.312-.084-.602-.167-1.592.034-2.326.195-.71.99-3.367.99-3.367s-.255-.51-.255-1.27c0-1.19.683-2.09 1.527-2.09.716 0 1.056.536 1.056 1.183 0 .71-.453 1.768-.687 2.75-.195.835.418 1.513 1.25 1.513 1.502 0 2.518-1.865 2.518-4.028 0-2.05-1.37-3.513-3.83-3.513-2.613 0-4.185 1.94-4.185 3.825 0 .71.272 1.488.613 1.912.13.16.147.307.107.48-.053.236-.176.71-.216.864-.053.205-.216.27-.417.18-1.522-.664-2.28-2.655-2.28-4.288 0-3.337 2.848-6.195 6.742-6.195 3.75 0 6.033 2.67 6.033 5.517 0 3.74-2.167 6.55-5.205 6.55-1.008 0-1.967-.527-2.29-1.147l-.652 2.51c-.24.93-.872 1.95-1.324 2.617C10.15 21.75 11.06 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"></path></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;

interface ShareButtonsProps {
    participantCount?: number;
}

const ShareButtons: React.FC<ShareButtonsProps> = ({ participantCount }) => {
  const [copySuccess, setCopySuccess] = useState('');
  const url = 'https://secretsantamatch.com/';
  
  let text = 'I just used this free Secret Santa Generator! It was super easy and perfect for our gift exchange. Check it out:';
  if (participantCount && participantCount > 1) {
    text = `I just organized our Secret Santa for ${participantCount} people with this free generator! It was so easy. Check it out:`;
  }
  
  const imageUrl = 'https://secretsantamatch.com/logo_256.png';

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  const encodedImageUrl = encodeURIComponent(imageUrl);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2500);
    }, () => {
      setCopySuccess('Failed');
      setTimeout(() => setCopySuccess(''), 2500);
    });
  };
  
  const shareLinks = {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImageUrl}&description=${encodedText}`
  }

  return (
    <div className="flex justify-center items-center gap-2 sm:gap-3 flex-wrap">
        <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-11 w-11 rounded-full bg-[#1DA1F2] text-white hover:bg-[#1a91da] transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg" aria-label="Share on Twitter">
            <TwitterIcon />
        </a>
        <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-11 w-11 rounded-full bg-[#1877F2] text-white hover:bg-[#166fe5] transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg" aria-label="Share on Facebook">
            <FacebookIcon />
        </a>
        <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-11 w-11 rounded-full bg-[#25D366] text-white hover:bg-[#20b859] transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg" aria-label="Share on WhatsApp">
            <WhatsAppIcon />
        </a>
        <a href={shareLinks.pinterest} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-11 w-11 rounded-full bg-[#E60023] text-white hover:bg-[#cf001f] transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg" aria-label="Pin on Pinterest">
            <PinterestIcon />
        </a>
        <button 
            onClick={copyToClipboard} 
            className={`flex items-center justify-center h-11 px-4 rounded-full font-semibold text-sm transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg
              ${copySuccess === 'Copied!'
                ? 'bg-green-600 text-white'
                : 'bg-slate-500 text-white hover:bg-slate-600'
              }`
            }
            style={{minWidth: '120px'}}
            aria-label="Copy link to clipboard"
        >
          {copySuccess === 'Copied!' ? <CheckIcon /> : <LinkIcon />}
          <span className="ml-2">{copySuccess || 'Copy Link'}</span>
        </button>
    </div>
  );
};

export default ShareButtons;
