import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import AdBanner from './AdBanner';
import { Download, Search, Filter, Printer, Share2, Heart } from 'lucide-react';

interface Printable {
    id: string;
    title: string;
    category: 'Gift Tags' | 'Games' | 'Planning';
    description: string;
    image: string;
    link: string;
    isPopular?: boolean;
}

const PRINTABLES: Printable[] = [
    {
        id: 'party-pack',
        title: 'The Ultimate Secret Santa Party Pack',
        category: 'Games',
        description: 'Everything you need for a party in one PDF: Bingo cards, "Guess Who" cards, and Award Certificates.',
        image: '/posts/secret-santa-bingo-guide-thumb.webp',
        link: '/secret-santa-bingo-guide.html',
        isPopular: true
    },
    {
        id: 'questionnaire',
        title: 'Secret Santa Questionnaire',
        category: 'Planning',
        description: 'Help your Santa find the perfect gift! A fun, printable form for participants to fill out.',
        image: '/posts/secret_santa_questionnaire-thumb.webp',
        link: '/secret-santa-questionnaire.html',
        isPopular: true
    },
    {
        id: 'vintage-tags',
        title: 'Vintage 1940s Gift Tags',
        category: 'Gift Tags',
        description: 'Nostalgic, classic Christmas designs to add a timeless touch to your wrapping.',
        image: '/posts/vintage-gift-tags-thumb.webp',
        link: '/vintage-christmas-gift-tags.html'
    },
    {
        id: 'halloween-word-search',
        title: 'Halloween Word Search Pack',
        category: 'Games',
        description: '13 unique word hunt puzzles for kids and classrooms. Spooky fun without the sugar rush.',
        image: '/posts/halloween-games-thumb.webp',
        link: '/halloween-word-search-printables.html',
        isPopular: true
    },
    {
        id: 'colorful-tags',
        title: 'Colorful Modern Gift Tags',
        category: 'Gift Tags',
        description: 'Bright, bold, and fun tags for a modern holiday vibe.',
        image: '/posts/colorful-gift-tags-thumb.webp',
        link: '/colorful-christmas-gift-tags.html'
    },
    {
        id: 'snarky-tags',
        title: 'Snarky & Funny Gift Tags',
        category: 'Gift Tags',
        description: 'Hilarious tags for friends who appreciate a little sass with their presents.',
        image: '/posts/snarky-gift-tags-thumb.webp',
        link: '/snarky-christmas-gift-tags.html'
    },
    {
        id: 'nice-list',
        title: 'Official Nice List Certificates',
        category: 'Games',
        description: 'Straight from the North Pole! Delight kids with an official certificate from Santa.',
        image: '/posts/nice-list-certificates-thumb.webp',
        link: '/free-nice-list-certificates.html'
    },
    {
        id: 'art-deco-tags',
        title: 'Art Deco 1920s Tags',
        category: 'Gift Tags',
        description: 'Gatsby-style glamour for your gifts. Elegant gold and black designs.',
        image: '/posts/art-deco-gift-tags-thumb.webp',
        link: '/vintage-christmas-gift-tags-1920s.html'
    },
    {
        id: 'minimalist-tags',
        title: 'Minimalist Chic Tags',
        category: 'Gift Tags',
        description: 'Clean lines and simple typography for the modern aesthetic.',
        image: '/posts/minimalist-gift-tags-thumb.webp',
        link: '/minimalist-christmas-gift-tags.html'
    },
    {
        id: 'funny-confession-tags',
        title: 'Funny Confession Tags',
        category: 'Gift Tags',
        description: 'Tags that admit you wrapped it 5 minutes ago.',
        image: '/posts/funny-gift-tags-thumb.webp',
        link: '/funny-christmas-gift-tags.html'
    }
];

const FreePrintablesPage: React.FC = () => {
    const [filter, setFilter] = useState<'All' | 'Gift Tags' | 'Games' | 'Planning'>('All');

    const filteredItems = filter === 'All' 
        ? PRINTABLES 
        : PRINTABLES.filter(p => p.category === filter);

    const handlePinIt = (item: Printable) => {
        const url = encodeURIComponent(window.location.origin + item.link);
        const media = encodeURIComponent(window.location.origin + item.image);
        const desc = encodeURIComponent(item.description);
        window.open(`https://pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${desc}`, '_blank');
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans">
            <Header />
            
            {/* Hero Section */}
            <header className="relative bg-white border-b border-slate-200 pt-20 pb-16 px-4 text-center overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-green-500 to-red-500"></div>
                
                <div className="relative z-10 max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-1 rounded-full text-sm font-bold mb-6 animate-fade-in-up">
                        <Printer size={16} /> 100% Free Downloads
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 font-serif mb-6 tracking-tight">
                        Free Christmas Printables & <span className="text-red-600">Holiday Fun</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
                        Make your holiday easier (and prettier) with our curated collection of free downloads. 
                        From vintage gift tags to hilarious party games, it's all here—no email required.
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-3">
                        {['All', 'Gift Tags', 'Games', 'Planning'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat as any)}
                                className={`px-6 py-2 rounded-full font-bold transition-all duration-200 ${
                                    filter === cat 
                                    ? 'bg-slate-900 text-white shadow-lg scale-105' 
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Decorative background elements */}
                <div className="absolute top-10 left-10 text-red-100 animate-pulse delay-700"><Heart size={64} fill="currentColor" /></div>
                <div className="absolute bottom-10 right-10 text-green-100 animate-pulse"><Printer size={80} /></div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-12">
                
                <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="5555555555" data-ad-format="auto" data-full-width-responsive="true" />

                {/* Masonry-style Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-slate-100 flex flex-col h-full relative">
                            
                            {/* Image Container */}
                            <div className="relative overflow-hidden aspect-[4/3]">
                                <img 
                                    src={item.image} 
                                    alt={item.title} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    loading="lazy"
                                />
                                {/* Overlay on Hover */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                                    <button 
                                        onClick={() => handlePinIt(item)}
                                        className="bg-red-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-red-700 transform hover:scale-105 transition-all"
                                        title="Pin to Pinterest"
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 0C5.373 0 0 5.373 0 12c0 4.99 3.063 9.248 7.39 10.966-.102-.934-.195-2.368.04-3.388.212-.918 1.36-5.766 1.36-5.766s-.347-.694-.347-1.72c0-1.612.935-2.815 2.1-2.815.99 0 1.468.743 1.468 1.634 0 .996-.634 2.487-.96 3.868-.273 1.156.58 2.098 1.718 2.098 2.062 0 3.648-2.174 3.648-5.307 0-2.776-1.995-4.708-4.84-4.708-3.526 0-5.593 2.645-5.593 5.38 0 1.065.41 2.205.92 2.826.102.123.116.23.086.354-.095.395-.307 1.246-.35 1.418-.055.227-.18.275-.415.166-1.548-.72-2.513-2.983-2.513-4.8 0-3.91 2.84-7.508 8.19-7.508 4.3 0 7.644 3.065 7.644 7.162 0 4.274-2.694 7.713-6.433 7.713-1.256 0-2.437-.653-2.84-1.423l-.774 2.95c-.28.995-1.038 2.24-1.546 3.002.995.305 2.05.47 3.14.47 6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
                                        Pin It
                                    </button>
                                </div>
                                {item.isPopular && (
                                    <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                                        <Heart size={12} fill="currentColor" /> Popular
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-6 flex flex-col flex-grow">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{item.category}</div>
                                <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-red-600 transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-grow">
                                    {item.description}
                                </p>
                                <a 
                                    href={item.link} 
                                    className="w-full py-3 rounded-xl bg-slate-100 hover:bg-red-600 hover:text-white text-slate-700 font-bold text-center transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <Download size={18} /> Get Free Printable
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="mt-20 bg-slate-900 rounded-3xl p-12 text-center text-white relative overflow-hidden">
                     <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Organizing a Gift Exchange?</h2>
                        <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8">
                            Our Secret Santa Generator is free, private, and doesn't require any emails or sign-ups. It pairs perfectly with these printables!
                        </p>
                        <a href="/generator.html" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-10 rounded-full shadow-lg transform hover:scale-105 transition-all">
                            Start Drawing Names
                        </a>
                    </div>
                    {/* Decor */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/20 rounded-full -ml-16 -mb-16 blur-3xl"></div>
                </div>

            </main>
            <Footer />
        </div>
    );
};

export default FreePrintablesPage;