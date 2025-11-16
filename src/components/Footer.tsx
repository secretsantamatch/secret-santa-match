import React from 'react';
import ShareButtons from './ShareButtons';
import InstallPWAButton from './InstallPWAButton';

interface FooterProps {
    showInstallButton?: boolean;
    onInstallClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ showInstallButton, onInstallClick }) => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-800 text-slate-300 pt-16 pb-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* CTA Section */}
                <div className="p-6 md:p-8 bg-slate-700/50 rounded-2xl mb-12 border border-slate-600">
                    <div className="grid md:grid-cols-2 gap-8 text-left items-center">
                        <div>
                            <h3 className="font-bold text-lg text-white">Enjoying this Free Tool?</h3>
                            <p className="text-slate-300 mt-1">A small tip helps keep this tool 100% free and ad-light for everyone!</p>
                             <a href="https://buy.stripe.com/00w5kFgG62RF8CA3XBfw400" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 bg-purple-200 hover:bg-purple-300 text-purple-900 border border-purple-300 font-semibold py-2 px-4 rounded-full text-sm transition-colors">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v1h-2V4H7v1H5V4zM5 7h10v9a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" /></svg>
                                 Tip the Elves
                             </a>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white">Share this Site</h3>
                            <p className="text-slate-300 mt-1">Help spread the holiday cheer by sharing this free tool with your friends!</p>
                            <div className="mt-4">
                                <ShareButtons />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                    {/* Column 1: Brand */}
                    <div className="md:col-span-2">
                        <a href="/" className="flex items-center gap-3 text-white font-bold text-xl mb-3">
                            <img src="/logo_256.png" alt="Secret Santa Match Logo" className="h-9 w-9" />
                            <span>SecretSantaMatch</span>
                        </a>
                        <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                            The easiest free Secret Santa generator. Instantly draw names, add exclusions, and share private links—no emails or signups required.
                        </p>
                    </div>
                    {/* Column 2: Quick Links */}
                    <div>
                        <h4 className="font-bold text-white mb-4 tracking-wider uppercase text-sm">Quick Links</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="/generator.html" className="text-slate-400 hover:text-white transition-colors">Generator</a></li>
                            <li><a href="/" className="text-slate-400 hover:text-white transition-colors">Holiday Blog</a></li>
                            <li><a href="/holiday-budget-calculator.html" className="text-slate-400 hover:text-white transition-colors">Budget Calculator</a></li>
                            <li><a href="/minimum-payment-calculator.html" className="text-slate-400 hover:text-white transition-colors">Debt Calculator</a></li>
                        </ul>
                    </div>
                    {/* Column 3: Company */}
                    <div>
                        <h4 className="font-bold text-white mb-4 tracking-wider uppercase text-sm">Company</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="/about-us.html" className="text-slate-400 hover:text-white transition-colors">About Us</a></li>
                            <li><a href="/contact.html" className="text-slate-400 hover:text-white transition-colors">Contact Us</a></li>
                            <li><a href="/advertise.html" className="text-slate-400 hover:text-white transition-colors">Advertise</a></li>
                            <li><a href="/privacy-policy.html" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a></li>
                        </ul>
                    </div>
                </div>
                
                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-700 flex flex-col sm:flex-row justify-between items-center text-sm">
                    <div className="text-slate-500 order-2 sm:order-1 mt-4 sm:mt-0 text-center sm:text-left space-y-2">
                        <p>&copy; {currentYear} SecretSantaMatch.com. All Rights Reserved.</p>
                        <p className="text-xs">
                            Affiliate Disclosure: We may earn a commission from qualifying purchases or actions made through links on this site.
                            See our <a href="/privacy-policy.html" className="underline hover:text-white">Privacy Policy</a> for details.
                        </p>
                    </div>
                     <div className="order-1 sm:order-2 flex items-center gap-4">
                        <a href="https://pinterest.com/SecretSantaMatch/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-transform transform hover:scale-110" aria-label="Follow us on Pinterest">
                           <img src="/pinterest-logo.webp" alt="Pinterest" className="w-6 h-6" loading="lazy" />
                        </a>
                        <a href="https://www.youtube.com/@SecretSantaMatch" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-transform transform hover:scale-110" aria-label="Follow us on YouTube">
                           <img src="/youtube-logo.webp" alt="YouTube" className="w-6 h-6" loading="lazy" />
                        </a>
                         <a href="https://www.tiktok.com/@secretsantamatch" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-transform transform hover:scale-110" aria-label="Follow us on TikTok">
                            <img src="/tiktok-logo.webp" alt="TikTok" className="w-6 h-6" loading="lazy" />
                        </a>
                        {showInstallButton && <InstallPWAButton onClick={onInstallClick!} />}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;