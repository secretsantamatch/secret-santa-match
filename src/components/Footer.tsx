
import React from 'react';
import ShareButtons from './ShareButtons';

// Icon for the donation button
const TipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v1h-2V4H7v1H5V4zM5 7h10v9a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" /></svg>;

interface FooterProps {
    theme: string;
    setTheme: (theme: string) => void;
}

const Footer: React.FC<FooterProps> = ({ theme, setTheme }) => {

  return (
    <footer className="w-full bg-slate-100 mt-16 border-t border-gray-200">
        <div className="container mx-auto max-w-5xl p-8 text-center text-gray-600">
            <div className="grid md:grid-cols-2 gap-8 items-start bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                 <div className="text-left">
                    <h3 className="font-bold text-xl text-slate-800 font-serif mb-2">Enjoying this Free Tool?</h3>
                    <p className="text-sm text-gray-500 mb-4">Did this make your holiday planning easier? A small tip helps keep this tool free for everyone!</p>
                     <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                        <a 
                            href="https://buy.stripe.com/00w5kFgG62RF8CA3XBfw400"
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-2 bg-[var(--donation-2-bg)] hover:bg-[var(--donation-2-hover-bg)] text-[var(--donation-2-text)] border border-[var(--donation-2-border)] font-semibold py-2 px-4 rounded-full text-sm transition-colors transform hover:scale-105"
                        >
                           <TipIcon />
                           Tip the Elves
                        </a>
                    </div>
                </div>
                <div className="text-left">
                     <h3 className="font-bold text-xl text-slate-800 font-serif mb-2">Share this Site</h3>
                     <p className="text-sm text-gray-500 mb-4">Help spread the holiday cheer by sharing this free tool with your friends!</p>
                     <ShareButtons />
                </div>
            </div>
            
            <div className="mt-8 text-xs text-gray-400">
                 <p>
                    Organize your next family, friend, or office gift exchange with our free Secret Santa generator.
                    You can instantly draw names for any event, create beautiful printable cards, and add custom rules—all without needing any signups or emails.
                </p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center text-sm">
                <p className="text-gray-500">
                    &copy; {new Date().getFullYear()} SecretSantaMatch.com - Happy Gifting!
                </p>
                 <div className="flex gap-4 mt-4 sm:mt-0">
                    <a href="https://blog.secretsantamatch.com/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-800 font-semibold">Blog</a>
                    <a href="https://blog.secretsantamatch.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-800 font-semibold">Privacy Policy</a>
                </div>
            </div>
        </div>
    </footer>
  );
};

export default Footer;
