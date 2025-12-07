import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { Star, Sparkles, ShoppingBag, Heart, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { trackEvent } from '../services/analyticsService';

interface Product {
    id: string;
    title: string;
    description: string;
    whyWeLoveIt: string;
    rating: number;
    reviews: string;
    image: string;
    link: string;
    badge?: string;
}

// ----------------------------------------------------------------------
// DATA
// ----------------------------------------------------------------------
const PRODUCTS: Product[] = [
    // --- VIRAL HITS ---
    {
        id: 'cosrx-snail',
        title: 'COSRX Snail Mucin 96% Power Repairing Essence',
        description: 'The viral Korean skincare secret that hydrates, repairs, and soothes damaged skin. Lightweight and fast-absorbing.',
        whyWeLoveIt: 'It gives that "glass skin" glow without feeling greasy. A holy grail for hydration.',
        rating: 4.8,
        reviews: '55,000+',
        image: 'https://m.media-amazon.com/images/I/710iAtk0KnL._SL1500_.jpg',
        link: 'https://www.amazon.com/dp/B09H9HW2JR?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.1II2EI3QO7H8U&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.1II2EI3QO7H8U_1765115507136',
        badge: 'Viral Hit'
    },
    {
        id: 'medicube-booster',
        title: 'Medicube Age-R Booster Pro Device',
        description: '6-in-1 high-tech beauty device for glass skin. Handles pore care, sebum control, and deep absorption.',
        whyWeLoveIt: 'The ultimate splurge gift for skincare tech lovers. It\'s like a spa facial at home.',
        rating: 4.9,
        reviews: '2,100+',
        image: 'https://m.media-amazon.com/images/I/71x2I7czOBL._SL1500_.jpg',
        link: 'https://amzn.to/3MlbiQh',
        badge: 'Top Splurge'
    },
    {
        id: 'medicube-pdrn-serum',
        title: 'Medicube PDRN Pink Peptide Serum',
        description: 'Salmon DNA & Peptide serum for firming and hydration. Targets elasticity and uneven skin tone.',
        whyWeLoveIt: 'Packed with Niacinamide and Peptides for that firm, bouncy Korean skincare look.',
        rating: 4.7,
        reviews: '1,200+',
        image: 'https://m.media-amazon.com/images/I/615DOoCI6xL._SL1500_.jpg',
        link: 'https://amzn.to/3KNTCMJ'
    },
    {
        id: 'medicube-vita-c-pads',
        title: 'Medicube Deep Vita C Facial Toner Pads',
        description: '70 pads soaked in 500,000 PPM of Vitamin water. Hydrating, resurfacing, and brightening.',
        whyWeLoveIt: 'Super convenient. One swipe wipes away dullness and preps skin for makeup.',
        rating: 4.6,
        reviews: '3,400+',
        image: 'https://m.media-amazon.com/images/I/71QBdNbIPPL._AC_SL1500_.jpg',
        link: 'https://amzn.to/448Dhc8'
    },
    {
        id: 'medicube-kojic-toner',
        title: 'Medicube Kojic Acid + Turmeric Toner',
        description: 'Lightweight toner for balancing uneven skin tone and texture on both face and body.',
        whyWeLoveIt: 'The Kojic Acid and Glycolic Acid combo is amazing for dark spots and texture.',
        rating: 4.5,
        reviews: '850+',
        image: 'https://m.media-amazon.com/images/I/618xEfBkX5L._AC_SL1500_.jpg',
        link: 'https://amzn.to/4oJsvR0'
    },
    {
        id: 'medicube-golden-capsule',
        title: 'Medicube Deep Vitamin C Golden Capsule',
        description: 'Liposome capsules for wrinkles and radiance. A transparent gel that bursts with hydration.',
        whyWeLoveIt: 'Looks beautiful in the jar, feels even better on the skin. Luxury hydration.',
        rating: 4.7,
        reviews: '900+',
        image: 'https://m.media-amazon.com/images/I/71m8aGBgXqL._SL1500_.jpg',
        link: 'https://amzn.to/4prFpEm'
    },
    // --- CLEAN BEAUTY (LilyAna) ---
    {
        id: 'lilyana-vit-c',
        title: 'LilyAna Naturals Vitamin C Serum',
        description: 'High-potency formula to revitalize dull skin. Boosts collagen and helps quench dryness.',
        whyWeLoveIt: 'Clean, vegan ingredients that actually work to brighten tired skin.',
        rating: 4.6,
        reviews: '35,000+',
        image: 'https://m.media-amazon.com/images/I/71YUYsr38jL._SL1500_.jpg',
        link: 'https://www.amazon.com/dp/B08GTY479F?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.1II2EI3QO7H8U&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.1II2EI3QO7H8U_1765115570737',
        badge: 'Clean Beauty'
    },
    {
        id: 'lilyana-eye-cream',
        title: 'LilyAna Naturals Eye Cream',
        description: 'Deeply hydrates to reduce puffiness, dark circles, and wrinkles. Rosehip and Hibiscus complex.',
        whyWeLoveIt: 'Absorbs quickly and really helps with the "I didn\'t sleep" look.',
        rating: 4.5,
        reviews: '28,000+',
        image: 'https://m.media-amazon.com/images/I/81snfY35wCL._SL1500_.jpg',
        link: 'https://www.amazon.com/dp/B00LV6VDG2?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.1II2EI3QO7H8U&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.1II2EI3QO7H8U_1765116029873'
    },
    {
        id: 'lilyana-face-cream',
        title: 'LilyAna Naturals Face Cream',
        description: 'Rose and Pomegranate anti-aging formula. Great for rosacea, eczema, and all skin types.',
        whyWeLoveIt: 'A perfect base layer for "slugging" or just daily moisturizing without clogging pores.',
        rating: 4.8,
        reviews: '19,000+',
        image: 'https://m.media-amazon.com/images/I/71mv893egjL._SL1500_.jpg',
        link: 'https://www.amazon.com/dp/B00LV5NY3I?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.1II2EI3QO7H8U&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.1II2EI3QO7H8U_1765116070754'
    },
    {
        id: 'lilyana-gift-set',
        title: 'LilyAna Naturals 4-Piece Gift Set',
        description: 'The complete routine: Retinol Cream, Vitamin C Serum, Eye Cream, and Face Cream in a giftable box.',
        whyWeLoveIt: 'The perfect starter kit for anyone wanting to switch to a clean skincare routine.',
        rating: 4.9,
        reviews: 'Gift Ready',
        image: 'https://m.media-amazon.com/images/I/71SXzFiBn9L._SL1500_.jpg',
        link: 'https://www.amazon.com/dp/B07ZTRD3RY?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.1II2EI3QO7H8U&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.1II2EI3QO7H8U_1765116188368',
        badge: 'Best Value'
    },
    // --- BODY & EXTRAS ---
    {
        id: 'pumice-valley-balm',
        title: 'Pumice Valley Natural Foot Balm',
        description: 'Intensely hydrating blend for dry, cracked heels. Creates a protective barrier to prevent moisture loss.',
        whyWeLoveIt: 'Use it overnight with socks for baby-soft feet by morning.',
        rating: 4.6,
        reviews: '8,500+',
        image: 'https://m.media-amazon.com/images/I/61v0yy13n+L._AC_SL1080_.jpg',
        link: 'https://www.amazon.com/dp/B08YZBBVGK?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.RH9SM7L22DFL&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.RH9SM7L22DFL_1765116271913'
    },
    {
        id: 'medicube-spray',
        title: 'Medicube Power Soothing Spray',
        description: 'Hypochlorous Acid Spray for all skin types. Daily solution for delicate skin and post-sun care.',
        whyWeLoveIt: 'A refreshing mist that soothes angry skin instantly. Great for gym bags.',
        rating: 4.5,
        reviews: '600+',
        image: 'https://m.media-amazon.com/images/I/61CLNQNx1iL._SL1500_.jpg',
        link: 'https://amzn.to/4oHZBAJ'
    }
];

const SkincarePage: React.FC = () => {
    
    const handleProductClick = (productName: string) => {
        trackEvent('affiliate_click', {
            partner: 'Amazon',
            product: productName,
            category: 'Skincare'
        });
    };

    return (
        <div className="bg-rose-50 min-h-screen font-sans">
            <Header />
            
            {/* URGENCY BANNER */}
            <div className="bg-amber-100 border-b border-amber-200 text-amber-900 px-4 py-3 text-center text-sm font-medium">
                <div className="flex items-center justify-center gap-2 max-w-4xl mx-auto">
                    <Clock size={16} className="text-amber-700 animate-pulse" />
                    <span>
                        <strong>24-Hour Deal Rule:</strong> To secure these prices and support our free tools, please complete your purchase within 24 hours of clicking "View on Amazon". Carts often reset after this window!
                    </span>
                </div>
            </div>

            {/* Hero Section */}
            <header className="relative pt-16 pb-12 px-4 text-center overflow-hidden bg-white">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-300 via-pink-400 to-rose-300"></div>
                
                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-800 px-4 py-1.5 rounded-full text-xs font-bold mb-6 tracking-wide uppercase shadow-sm">
                        <Sparkles size={14} /> 2025 Glow Up Guide
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 font-serif mb-6 tracking-tight leading-tight">
                        Viral Skincare & <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-600">Clean Beauty Picks</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        We curated the internet's most viral and effective products. From Korean beauty secrets to dermatologist favorites, these are the gifts that actually work.
                    </p>
                </div>
                
                {/* Background Decor */}
                <div className="absolute top-10 left-10 w-64 h-64 bg-rose-100/50 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-100/50 rounded-full blur-3xl -z-10"></div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-12">
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {PRODUCTS.map((product) => (
                        <div key={product.id} className="group bg-white rounded-2xl overflow-hidden border border-rose-100 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1 relative">
                            
                            {/* Badge */}
                            {product.badge && (
                                <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-lg tracking-wider">
                                    {product.badge}
                                </div>
                            )}

                            {/* Image Area */}
                            <a 
                                href={product.link} 
                                target="_blank" 
                                rel="noopener noreferrer sponsored"
                                onClick={() => handleProductClick(product.title)}
                                className="block relative aspect-[4/4] overflow-hidden bg-white p-8 group-hover:bg-slate-50 transition-colors"
                            >
                                <img 
                                    src={product.image} 
                                    alt={product.title} 
                                    className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110" 
                                    loading="lazy"
                                />
                            </a>

                            {/* Content Area */}
                            <div className="p-6 flex flex-col flex-grow bg-white relative z-10">
                                
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} size={12} className={`${star <= Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                        ))}
                                        <span className="text-xs text-slate-400 ml-1 font-medium">({product.reviews})</span>
                                    </div>
                                    <div className="text-[10px] text-slate-300 font-bold uppercase tracking-widest flex items-center gap-1">
                                        <ShieldCheck size={12} /> Verified
                                    </div>
                                </div>

                                <h3 className="font-serif text-lg font-bold text-slate-900 mb-2 leading-snug group-hover:text-rose-600 transition-colors">
                                    <a href={product.link} target="_blank" rel="noopener noreferrer sponsored" onClick={() => handleProductClick(product.title)}>
                                        {product.title}
                                    </a>
                                </h3>
                                
                                <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                                    {product.description}
                                </p>

                                {/* "Why We Love It" Box */}
                                <div className="mt-auto bg-rose-50/50 border border-rose-100 rounded-xl p-3 mb-6">
                                    <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <Heart size={10} fill="currentColor" /> Why we love it
                                    </p>
                                    <p className="text-xs text-rose-900 font-medium italic leading-relaxed">
                                        "{product.whyWeLoveIt}"
                                    </p>
                                </div>

                                <a 
                                    href={product.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer sponsored"
                                    onClick={() => handleProductClick(product.title)}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md group-hover:shadow-lg transform active:scale-[0.98]"
                                >
                                    View on Amazon <ShoppingBag size={16} />
                                </a>
                                <p className="text-[10px] text-center text-slate-400 mt-2">
                                    *Complete purchase within 24h
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Disclosure Footer */}
                <div className="mt-16 text-center max-w-3xl mx-auto">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm inline-block text-left">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm mb-1">A Note on Affiliate Support</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    We carefully select every product we feature based on reviews and trends. As an Amazon Associate, we earn a small commission if you buy through our links, at no extra cost to you. <strong>Important:</strong> Amazon commissions are only credited if you complete your purchase within 24 hours of adding an item to your cart. This support keeps our Secret Santa tools 100% free. Thank you!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
            <Footer />
        </div>
    );
};

export default SkincarePage;