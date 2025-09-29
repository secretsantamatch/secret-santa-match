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
                    The ultimate free Secret Santa generator for any occasion! Whether you're organizing an office party, a family gift exchange, or a fun get-together with friends, our tool makes it simple. Instantly draw names online, add exclusions to prevent specific matches (like couples), and even handle odd numbers of people with ease. The best part? No emails or signups are required. Generate your matches, then download beautiful, customizable printable cards or send results secretly via email. It's the fastest, easiest, and most private way to manage your Secret Santa.
                </p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-sm">
                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500">
                    <label htmlFor="theme-switcher" className="font-semibold whitespace-nowrap">Site Theme:</label>
                    <select
                        id="theme-switcher"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className="bg-white border border-slate-300 rounded-md py-1 px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--primary-color)]"
                        aria-label="Select site theme"
                    >
                        <option value="default">Festive (Default)</option>
                        <option value="christmas">Christmas</option>
                        <option value="halloween">Halloween</option>
                        <option value="valentines">Valentine's</option>
                        <option value="birthday">Birthday</option>
                        <option value="celebration">Celebration</option>
                    </select>
                </div>
                <p className="text-gray-500 text-center order-first md:order-none">
                    &copy; {new Date().getFullYear()} SecretSantaMatch.com
                </p>
                <div className="flex gap-4 justify-center md:justify-end">
                    <a href="https://blog.secretsantamatch.com/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[var(--primary-text)] font-semibold">Blog</a>
                    <a href="https://blog.secretsantamatch.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[var(--primary-text)] font-semibold">Privacy Policy</a>
                </div>
            </div>
        </div>
    </footer>
  );
};

export default Footer;
