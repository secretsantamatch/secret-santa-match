import React from 'react';
import ShareButtons from './ShareButtons';

const PinterestIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.084-.602-.167-1.59-.193-2.385-.03-.288.114-.546.33-.645.215-.1.483-.06.66.115.176.175.285.422.21.688-.074.265-.25.845-.314 1.134-.11.493.195.918.66 1.14.465.223.987.012 1.29-.443.303-.455.47-1.155.47-1.857 0-1.64-1.165-2.95-2.738-2.95-1.925 0-3.322 1.41-3.322 3.193 0 .782.31 1.63.725 2.052.17.175.195.238.134.465-.06.223-.21.845-.25 1.004-.04.158-.158.21-.33.134-.546-.25-1.02-1.05-1.178-1.776-.25-1.18.52-2.925 1.5-3.825 1.343-1.25 3.16-1.5 4.54-1.5 2.37 0 4.237 1.762 4.237 4.05 0 2.44-1.2 4.41-2.925 4.41-.95 0-1.838-.493-2.145-1.05-.195-.368-.546-.725-.688-1.05-.21-.493-.012-1.004.41-1.47.422-.465.782-.6 1.134-.6.925 0 1.66.95 1.66 2.21 0 .845-.31 1.5-.782 1.5-.238 0-.45-.114-.52-.25-.012-.084.038-.288.06-.393.074-.31.158-.66.158-.66s.05-.18.05-.393c0-.493-.288-.95-.83-1.343-1.096-.782-1.5-2.37-1.5-3.565 0-2.025 1.425-3.837 4.14-3.837 2.22 0 3.78 1.63 3.78 3.58 0 2.58-1.28 5.27-3.18 5.27-1.47 0-2.61-1.27-2.22-2.75.25-.925.77-1.938.77-2.58z"/>
    </svg>
);
const YouTubeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.582 7.188c-.21-.78-.81-1.38-1.59-1.59C18.332 5.1 12 5.1 12 5.1s-6.332 0-7.992.498c-.78.21-1.38.81-1.59 1.59C2.1 8.848 2.1 12 2.1 12s0 3.152.318 4.812c.21.78.81 1.38 1.59 1.59C5.668 18.9 12 18.9 12 18.9s6.332 0 7.992-.498c.78-.21 1.38-.81 1.59-1.59C21.9 15.152 21.9 12 21.9 12s0-3.152-.318-4.812zM9.9 14.7V9.3l4.5 2.7-4.5 2.7z"/>
    </svg>
);
const TikTokIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.6 5.82s.01 0 .01 0c.32 0 .63.02.94.06v3.23c-1.3-.04-2.57-.08-3.79-.13.04-.52.12-1.04.2-1.56.08-.52.18-1.03.3-1.54.01 0 .01 0 .01 0m-3.95 9.87c.18-.54.38-1.08.6-1.61.22-.54.46-1.07.72-1.6.27-.54.55-1.07.84-1.6.29-.54.6-1.07.92-1.58-2.3.05-4.55.13-6.68.27v3.12c2.08-.13 4.1-.2 6.03-.27l-.43 3.06zM12.69 0c.63 2.13 1 4.33 1.09 6.58.07 1.73-.13 3.46-.6 5.09-.47 1.63-1.2 3.18-2.18 4.63-1 1.45-2.23 2.76-3.71 3.91-1.48 1.15-3.2 2.12-5.16 2.87v-3.2c1.7-.68 3.23-1.58 4.6-2.69 1.37-1.1 2.54-2.38 3.52-3.82.97-1.44 1.73-3.03 2.26-4.75.52-1.72.74-3.52.66-5.32C12.82 4.24 12.8 2.13 12.69 0z"/>
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
                        <a href="https://pinterest.com/SecretSantaMatch/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors" aria-label="Follow us on Pinterest">
                            <PinterestIcon />
                        </a>
                        <a href="https://www.youtube.com/@SecretSantaMatch" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors" aria-label="Follow us on YouTube">
                            <YouTubeIcon />
                        </a>
                         <a href="https://www.tiktok.com/@secretsantamatch" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-gray-800 hover:bg-gray-900 text-white rounded-full transition-colors" aria-label="Follow us on TikTok">
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
