import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { Mail, MessageSquare, Briefcase, Lightbulb, Copy, Check } from 'lucide-react';
// FIX: Import FindWishlistModal to handle wishlist editing.
import FindWishlistModal from './FindWishlistModal';

const ContactPage: React.FC = () => {
    const [email, setEmail] = useState('...');
    const [mailto, setMailto] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    // FIX: Add state to control the visibility of the FindWishlistModal.
    const [showFindWishlistModal, setShowFindWishlistModal] = useState(false);

    // Obfuscate email to prevent spam bots from scraping it easily.
    // The address is constructed client-side.
    useEffect(() => {
        const user = 'hello';
        const domain = 'secretsantamatch.com';
        setEmail(`${user}@${domain}`);
        setMailto(`mailto:${user}@${domain}`);
    }, []);

    const handleCopy = () => {
        if (email === '...') return;
        navigator.clipboard.writeText(email).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col">
            {/* FIX: Pass the required onFindWishlistClick prop to the Header component. */}
            <Header onFindWishlistClick={() => setShowFindWishlistModal(true)} />
            <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl my-12">
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif">Get In Touch</h1>
                    <p className="text-lg text-slate-600 mt-4 max-w-2xl mx-auto">
                        Have a question, a suggestion for a new feature, or a partnership inquiry? We'd love to hear from you.
                    </p>
                </div>

                <div className="mt-12 grid md:grid-cols-2 gap-8">
                    {/* Contact Info Side */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 flex flex-col justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-700 font-serif mb-6">Contact Information</h2>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full">
                                        <MessageSquare size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">General Questions & Feedback</h3>
                                        <p className="text-slate-600 text-sm mt-1">For general questions, feature requests, or feedback on our tool.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full">
                                        <Briefcase size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">Partnerships & Advertising</h3>
                                        <p className="text-slate-600 text-sm mt-1">Interested in advertising or partnering with us? Let's talk.</p>
                                    </div>
                                </div>
                                 <div className="flex items-start gap-4">
                                    <div className="bg-amber-100 text-amber-600 p-3 rounded-full">
                                        <Lightbulb size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">Suggestions</h3>
                                        <p className="text-slate-600 text-sm mt-1">Have an idea for a new printable, blog post, or tool? We're all ears!</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                            <p className="text-sm text-slate-500">We do our best to respond within 48 hours.</p>
                        </div>
                    </div>

                    {/* Email Side */}
                    <div className="bg-gradient-to-br from-red-600 to-orange-500 rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center text-white text-center">
                         <div className="bg-white/20 p-4 rounded-full mb-6">
                            <Mail size={40} />
                        </div>
                        <h2 className="text-3xl font-bold font-serif">Email Us Directly</h2>
                        <p className="mt-3 opacity-90 max-w-sm">
                            The best way to reach us is by email. Click the button below to open your mail client or copy the address.
                        </p>
                        <div className="mt-8 w-full">
                             <a 
                                href={mailto || '#'}
                                className="w-full block bg-white text-red-600 font-bold py-4 px-6 rounded-full text-lg shadow-md transform hover:scale-105 transition-transform duration-200 ease-in-out"
                            >
                                {email}
                            </a>
                            <button 
                                onClick={handleCopy}
                                className="mt-4 w-full bg-white/30 hover:bg-white/40 text-white font-semibold py-2 px-4 rounded-full transition-colors flex items-center justify-center gap-2"
                            >
                                {isCopied ? <Check size={20} /> : <Copy size={20} />}
                                {isCopied ? 'Copied!' : 'Copy Email Address'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            {/* FIX: Render the FindWishlistModal when its state is true. */}
            {showFindWishlistModal && <FindWishlistModal onClose={() => setShowFindWishlistModal(false)} />}
        </div>
    );
};

export default ContactPage;