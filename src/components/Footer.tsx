import React from 'react';
import ShareButtons from './ShareButtons';

const PinterestIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill="#E60023"/>
        <path d="M7.18182 12.2045C7.18182 10.4318 8.43182 8.79545 10.5909 8.79545C12.1136 8.79545 12.9773 9.77273 12.9773 10.9205C12.9773 12.4432 12.0455 14.5455 11.4773 16.5909C11.2386 17.5227 11.8523 18.1818 12.75 18.1818C14.2841 18.1818 15.6591 16.5 15.6591 13.9773C15.6591 11.2159 13.3409 8.86364 10.2386 8.86364C6.90909 8.86364 4.86364 11.2841 4.86364 13.9773C4.86364 15.0568 5.34091 16.2727 5.92045 16.7955C6.01136 16.8636 6.03409 16.7841 6.01136 16.7045C5.97727 16.5682 5.82955 15.9886 5.79545 15.8523C5.75 15.6364 5.70455 15.4545 5.89773 15.2955C7.11364 14.2159 6.84091 12.75 7.18182 12.2045Z" fill="white"/>
    </svg>
);

const YouTubeIcon = () => (
    <svg width="24" height="24" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M27.314 3.084C26.9807 1.851 25.9547 0.824 24.7217 0.49C22.5607 0 14.0007 0 14.0007 0C14.0007 0 5.44073 0 3.27973 0.49C2.04673 0.824 1.02073 1.851 0.686732 3.084C0.196732 5.246 0.196732 10 0.196732 10C0.196732 10 0.196732 14.754 0.686732 16.916C1.02073 18.149 2.04673 19.176 3.27973 19.51C5.44073 20 14.0007 20 14.0007 20C14.0007 20 22.5607 20 24.7217 19.51C25.9547 19.176 26.9807 18.149 27.3147 16.916C27.8047 14.754 27.8047 10 27.8047 10C27.8047 10 27.8047 5.246 27.3147 3.084Z" fill="#FF0000"/>
        <path d="M11.2007 14.2861V5.71411L18.8007 10.0001L11.2007 14.2861Z" fill="white"/>
    </svg>
);

const TikTokIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.525 0.02C13.835 0 15.145 0.01 16.455 0.02C16.535 1.55 17.085 3.11 18.205 4.19C19.325 5.3 20.945 5.81 22.485 5.98V10.01C21.045 9.96 19.595 9.66 18.285 9.04C17.715 8.78 17.155 8.45 16.635 8.12V16.87C16.535 18.27 15.995 19.66 15.185 20.81C13.875 22.73 11.605 23.98 9.275 24.02C6.845 24.07 4.435 23.07 2.845 21.04C1.255 19 0.885 16.22 1.725 13.85C2.215 12.45 2.975 11.15 3.925 9.98C4.915 8.81 6.175 7.84 7.575 7.2V7.05C7.605 4.74 7.585 2.42 7.605 0.11C7.625 -1.4 8.125 -2.91 9.075 -4.14C10.185 -5.59 11.895 -6.47 13.735 -6.5" fill="#00F2EA"/>
        <path d="M14.525 0.02C15.835 0 17.145 0.01 18.455 0.02C18.535 1.55 19.085 3.11 20.205 4.19C21.325 5.3 22.945 5.81 24.485 5.98V10.01C23.045 9.96 21.595 9.66 20.285 9.04C19.715 8.78 19.155 8.45 18.635 8.12V16.87C18.535 18.27 17.995 19.66 17.185 20.81C15.875 22.73 13.605 23.98 11.275 24.02C8.845 24.07 6.435 23.07 4.845 21.04C3.255 19 2.885 16.22 3.725 13.85C4.215 12.45 4.975 11.15 5.925 9.98C6.915 8.81 8.175 7.84 9.575 7.2V7.05C9.605 4.74 9.585 2.42 9.605 0.11C9.625 -1.4 10.125 -2.91 11.075 -4.14C12.185 -5.59 13.895 -6.47 15.735 -6.5" fill="#FF0050"/>
        <path d="M7.605 0.11C7.625 1.62 8.125 3.13 9.075 4.36C10.185 5.81 11.895 6.69 13.735 6.72C13.725 3.8 13.705 0.88 13.735 -2.04C11.895 -2.01 10.185 -1.13 9.075 0.32C8.125 1.55 7.625 3.06 7.605 4.57V11.45C7.035 11.66 6.465 11.84 5.925 12.01C4.975 13.18 4.215 14.48 3.725 15.88C2.885 18.25 3.255 21.03 4.845 23.06C6.435 25.09 8.845 26.09 11.275 26.04C13.605 26 15.875 24.75 17.185 22.83C17.995 21.68 18.535 20.29 18.615 18.89V8.12C19.135 8.45 19.695 8.78 20.265 9.04C21.575 9.66 23.025 9.96 24.465 10.01V5.98C22.925 5.81 21.305 5.3 20.185 4.19C19.065 3.11 18.515 1.55 18.435 0.02C17.125 0.01 15.815 0 14.505 0.02C14.515 2.33 14.535 4.65 14.515 6.96C14.515 7.01 14.505 7.06 14.495 7.11C13.095 7.67 11.835 8.64 10.845 9.81C9.895 10.98 9.135 12.28 8.645 13.68C8.525 14.04 8.425 14.41 8.335 14.79C8.325 12.01 8.345 9.23 8.315 6.45C8.315 4.31 8.085 2.19 7.605 0.11Z" fill="#FFFFFF"/>
    </svg>
);

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="text-center py-8 mt-8 border-t bg-white px-4">
            <div className="max-w-5xl mx-auto">
                {/* Support and Share Section */}
                <div className="p-6 md:p-8 bg-slate-50 rounded-2xl border mb-8">
                    <div className="grid md:grid-cols-2 gap-8 text-left items-center">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">Enjoying this Free Tool?</h3>
                            <p className="text-slate-600 mt-1">Did this make your holiday planning easier? A small tip helps keep this tool free for everyone!</p>
                             <a href="https://buy.stripe.com/00w5kFgG62RF8CA3XBfw400" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-200 font-semibold py-2 px-4 rounded-full text-sm transition-colors">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v1h-2V4H7v1H5V4zM5 7h10v9a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" /></svg>
                                 Tip the Elves
                             </a>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">Share this Site</h3>
                            <p className="text-slate-600 mt-1">Help spread the holiday cheer by sharing this free tool with your friends!</p>
                            <div className="mt-4">
                                <ShareButtons />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Media Section */}
                <div className="mb-8">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Follow Us</h3>
                     <div className="flex justify-center gap-4">
                        <a href="https://pinterest.com/SecretSantaMatch/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center rounded-full transition-transform transform hover:scale-110" aria-label="Follow us on Pinterest">
                            <PinterestIcon />
                        </a>
                        <a href="https://www.youtube.com/@SecretSantaMatch" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center rounded-full transition-transform transform hover:scale-110" aria-label="Follow us on YouTube">
                            <YouTubeIcon />
                        </a>
                         <a href="https://www.tiktok.com/@secretsantamatch" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center rounded-full transition-transform transform hover:scale-110" aria-label="Follow us on TikTok">
                            <TikTokIcon />
                        </a>
                    </div>
                </div>

                {/* SEO Text */}
                <div className="text-slate-500 text-sm mb-8 leading-relaxed">
                    The ultimate free Secret Santa generator for any occasion! Whether you’re organizing an office party, a family gift exchange, or a fun get-together with friends, our tool makes it simple. Instantly draw names online, add exclusions to prevent specific matches (like couples), and even handle odd numbers of people with ease. The best part? No emails or signups are required. Generate your matches, then download beautiful, customizable printable cards or share private links. It’s the fastest, easiest, and most private way to manage your Secret Santa.
                </div>
                
                {/* Bottom Footer */}
                <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-slate-600">
                    <div className="order-2 sm:order-1 mt-4 sm:mt-0">
                        &copy; {currentYear} SecretSantaMatch.com
                    </div>
                    <div className="order-1 sm:order-2">
                        <a href="/blog.html" className="font-semibold hover:text-slate-900 transition-colors px-3 py-2">Blog</a>
                        <a href="/privacy-policy.html" className="font-semibold hover:text-slate-900 transition-colors px-3 py-2">Privacy Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
