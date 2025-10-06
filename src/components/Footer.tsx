import React from 'react';
import ShareButtons from './ShareButtons';

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
                        <a href="/privacy-policy.html" className="font-semibold hover:text-slate-900 transition-colors px-3 py-2">Privacy Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
