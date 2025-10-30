import React, { useState } from 'react';
import { Copy, Check, Facebook, Twitter, MessageCircle } from 'lucide-react';

const ShareTool: React.FC = () => {
    const [copied, setCopied] = useState(false);
    const shareUrl = "https://secretsantamatch.com/generator.html";
    const shareText = "I just organized my Secret Santa in 2 minutes with this free generator! No emails or sign-ups required. 🎁";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <section className="my-10 md:my-16">
            <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200 text-center">
                <h2 className="text-3xl font-bold text-slate-800 font-serif mb-2">
                    Share This Free Tool!
                </h2>
                <p className="text-slate-600 mb-8 max-w-xl mx-auto">
                    Love how easy this was? Share it with friends, family, or coworkers who might be organizing their own gift exchange!
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition-colors">
                        <Facebook size={20} /> Share on Facebook
                    </a>
                    <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-full transition-colors">
                        <Twitter size={20} /> Share on X
                    </a>
                    <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition-colors">
                        <MessageCircle size={20} /> Share on WhatsApp
                    </a>
                    <button onClick={copyToClipboard} className={`flex items-center gap-2 font-bold py-3 px-6 rounded-full transition-colors ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}>
                        {copied ? <Check size={20} /> : <Copy size={20} />}
                        {copied ? 'Link Copied!' : 'Copy Link'}
                    </button>
                </div>
            </div>
        </section>
    );
};

export default ShareTool;
