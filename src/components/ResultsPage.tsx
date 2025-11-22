import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { ExchangeData, Match, Participant } from '../types';
import PrintableCard from './PrintableCard';
import ResultsDisplay from './ResultsDisplay';
import { ShareLinksModal } from './ShareLinksModal';
import WishlistEditorModal from './WishlistEditorModal';
import ConfirmationModal from './ConfirmationModal';
import Header from './Header';
import Footer from './Footer';
import AdBanner from './AdBanner';
import { trackEvent } from '../services/analyticsService';
import { generateMatches } from '../services/matchService';
import { Share2, Gift, Shuffle, Loader2, Copy, Check, Eye, EyeOff, MessageCircle, Bookmark, Star, PawPrint, TrendingUp, Sparkles, Martini, Palette, CreditCard, ShoppingBag, Flame, Headphones, Coffee, Utensils, Droplet, Smile, Car, Cookie, Moon, Thermometer } from 'lucide-react';
import CookieConsentBanner from './CookieConsentBanner';
import LinkPreview from './LinkPreview';
import { shouldTrackByDefault, isEuVisitor } from '../utils/privacy';

interface ResultsPageProps {
    data: ExchangeData;
    currentParticipantId: string | null;
    onDataUpdated: (newMatches: { g: string; r: string }[]) => void;
}

type LiveWishlists = Record<string, Partial<Omit<Participant, 'id' | 'name'>>>;

// --- AFFILIATE LINKS (Your IDs) ---
const AFFILIATE_LINKS = {
    AMAZON_TAG: "secretsanmat-20",
    SUGAR_RUSH: "https://www.awin1.com/awclick.php?gid=518477&mid=33495&awinaffid=2612068&linkid=3923493&clickref=",
    THE_MET: "https://click.linksynergy.com/fs-bin/click?id=6AKK8tkf2k4&offerid=1772143.347&type=3&subid=0",
    CREDIT_KARMA: "https://www.awin1.com/awclick.php?gid=580820&mid=66532&awinaffid=2612068&linkid=4507342&clickref=",
    GIFTCARDS_COM: "https://click.linksynergy.com/fs-bin/click?id=6AKK8tkf2k4&offerid=1469583.925&subid=0&type=4",
    TEABOOK: "https://www.awin1.com/cread.php?s=4276843&v=88557&q=557671&r=2612068"
};

// --- SNIPER DEALS (Main Gifts - $20+) ---
const SNIPER_DEALS = [
    {
        keywords: ['blanket', 'throw', 'cozy', 'warm', 'soft', 'bed', 'couch', 'home'],
        url: `https://www.amazon.com/dp/B0CK9SR543?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.2QJOSHFSVGDO1&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.2QJOSHFSVGDO1_1763778354440`,
        name: 'Faux Fur Throw Blanket',
        icon: Moon,
        promoText: 'Cozy Pick: Faux Fur Blanket',
        color: 'text-stone-600'
    },
    {
        keywords: ['quilt', 'cotton', 'throw', 'decor', 'beige', 'brown', 'living room'],
        url: `https://www.amazon.com/dp/B0D3JCPZDB?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.17QTZOO69DJAF&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.17QTZOO69DJAF_1763778288849`,
        name: 'Cotton Quilted Throw',
        icon: ShoppingBag,
        promoText: 'Home Decor: Quilted Throw',
        color: 'text-amber-700'
    },
    {
        keywords: ['slipper', 'shoe', 'arch support', 'comfort', 'feet', 'mom', 'grandma'],
        url: `https://www.amazon.com/dp/B0FL6XFLMZ?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.3MJY4XPP0F0NB&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.3MJY4XPP0F0NB_1763778261421`,
        name: 'Arch Support Slippers',
        icon: Smile,
        promoText: 'Comfort Pick: Support Slippers',
        color: 'text-rose-600'
    },
    {
        keywords: ['kitchen', 'cook', 'gadget', 'tool', 'pizza', 'garlic', 'chef'],
        url: `https://www.amazon.com/dp/B0FLCZB5C1?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.1PPXU1LGBSR42&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.1PPXU1LGBSR42_1763778008137`,
        name: 'Premium Kitchen Set',
        icon: Utensils,
        promoText: 'Chef\'s Choice: Kitchen Set',
        color: 'text-zinc-600'
    },
    {
        keywords: ['slipper', 'sock', 'men', 'dad', 'brother', 'husband', 'fleece'],
        url: `https://www.amazon.com/dp/B0DFVJBCPD?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.PT0SPMEIC3U6&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.PT0SPMEIC3U6_1763777972911`,
        name: 'Mens Slipper Socks',
        icon: ShoppingBag,
        promoText: 'Cozy Gift: Mens Slippers',
        color: 'text-slate-700'
    },
    {
        keywords: ['skin', 'balm', 'tallow', 'moisturizer', 'natural', 'skincare', 'face'],
        url: `https://www.amazon.com/dp/B0DTGQN758?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.2LAASFXWLYT6U&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.2LAASFXWLYT6U_1763777896535`,
        name: 'Whipped Tallow Balm',
        icon: Sparkles,
        promoText: 'Viral Skincare: Tallow Balm',
        color: 'text-emerald-700'
    },
    {
        keywords: ['car', 'wash', 'drying', 'towel', 'cleaning', 'auto', 'truck'],
        url: `https://www.amazon.com/dp/B0BPMMSQ13?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.1L7ZRS38TT88P&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.1L7ZRS38TT88P_1763777713716`,
        name: 'Shammy XL Cloth',
        icon: Car,
        promoText: 'Car Lover: XL Shammy',
        color: 'text-blue-800'
    },
    {
        keywords: ['meat', 'thermometer', 'grill', 'bbq', 'steak', 'cooking'],
        url: `https://www.amazon.com/dp/B00S93EQUK?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.AA0X17M8N4V6&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.AA0X17M8N4V6_1763777639135`,
        name: 'Digital Meat Thermometer',
        icon: Thermometer,
        promoText: 'Top Rated: Instant Read Thermometer',
        color: 'text-red-700'
    },
    {
        keywords: ['candle', 'warmer', 'lamp', 'light', 'scent', 'aesthetic', 'vintage'],
        url: `https://www.amazon.com/dp/B0CHRT3HZS?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.1RSE0J9PZOOGB&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.1RSE0J9PZOOGB_1763777396107`,
        name: 'Candle Warmer Lamp',
        icon: Flame,
        promoText: 'Trending: Candle Warmer',
        color: 'text-amber-600'
    },
    {
        keywords: ['mattress', 'heated', 'bed', 'sleep', 'cold', 'winter', 'electric blanket'],
        url: `https://www.amazon.com/dp/B011KZ8EX8?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.24NE2WDE1A0HY&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.24NE2WDE1A0HY_1763776969635`,
        name: 'Heated Mattress Pad',
        icon: Moon,
        promoText: 'Stay Warm: Heated Mattress Pad',
        color: 'text-slate-600'
    },
    {
        keywords: ['bath', 'bomb', 'set', 'gift', 'spa', 'essential oil', 'relaxation'],
        url: `https://www.amazon.com/dp/B07SX18BGD?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.15OTDT3Q4NILE&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.15OTDT3Q4NILE_1763776885486`,
        name: 'Bath Bomb Gift Set',
        icon: Gift,
        promoText: 'Gift Idea: 12 Bath Bombs',
        color: 'text-purple-500'
    }
];

// --- STOCKING STUFFERS (Cheap Add-ons - Under $15) ---
const STOCKING_STUFFERS = [
    {
        name: 'Tinted Lip Plumper',
        url: `https://www.amazon.com/dp/B0C7KTQDC3?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.152AF08NB0PAI&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.152AF08NB0PAI_1763778467692`,
        icon: Smile,
        desc: 'Hydrating & Glossy'
    },
    {
        name: 'Lavender Foot Balm',
        url: `https://www.amazon.com/dp/B0D81KGRXY?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.2UF9E3C30DG4O&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.2UF9E3C30DG4O_1763778414775`,
        icon: Sparkles,
        desc: 'Deep Hydration'
    },
    {
        name: 'Fuzzy Mens Socks',
        url: `https://www.amazon.com/dp/B0FP1PK9MZ?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.1Y0J5SNDQIX3M&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.1Y0J5SNDQIX3M_1763778158731`,
        icon: ShoppingBag,
        desc: 'Warm & Durable'
    },
    {
        name: 'Lip Gloss Set',
        url: `https://www.amazon.com/dp/B0FNNFPH11?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.18OLS5AFQMQ25&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.18OLS5AFQMQ25_1763778094203`,
        icon: Gift,
        desc: 'Hot Cocoa Scented'
    },
    {
        name: 'Eye Brightener Stick',
        url: `https://www.amazon.com/dp/B0CVBGLZ5S?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.24Y1WJL9RQIF7&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.24Y1WJL9RQIF7_1763777817681`,
        icon: Eye,
        desc: 'Wake Up Tired Eyes'
    },
    {
        name: 'Fuzzy Slippers',
        url: `https://www.amazon.com/dp/B0DSZZ37JD?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.1HSY0XFXTCLLT&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.1HSY0XFXTCLLT_1763777592278`,
        icon: Moon,
        desc: 'Open Toe Comfort'
    },
    {
        name: 'French Cookies',
        url: `https://www.amazon.com/dp/B07Z19YMN4?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.3GU0VWLV1VHFA&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.3GU0VWLV1VHFA_1763777366321`,
        icon: Cookie,
        desc: 'Real Butter Shortbread'
    },
    {
        name: 'Crystal Bath Bomb',
        url: `https://www.amazon.com/dp/B0D1YG1SXM?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.2HHD1QD1IETFG&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.2HHD1QD1IETFG_1763777199755`,
        icon: Droplet,
        desc: 'Rose Quartz Surprise'
    },
    {
        name: 'Candy Cane Candle',
        url: `https://www.amazon.com/dp/B0FJY2X6XG?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.2495YJ1VCSZTC&linkCode=tr1&tag=secretsant09e-20&linkId=amzn1.campaign.2495YJ1VCSZTC_1763776723320`,
        icon: Flame,
        desc: 'Holiday Scent'
    }
];

// --- PROMO COMPONENTS ---

const HighCommissionPromo = ({ deal }: { deal: typeof SNIPER_DEALS[0] }) => (
    <div className={`p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200 shadow-sm animate-fade-in`}>
        <div className="flex items-center gap-4">
            <div className={`flex-shrink-0 ${deal.color.replace('text-', 'bg-').replace('600', '100').replace('700', '100')} ${deal.color} rounded-full h-12 w-12 flex items-center justify-center`}>
                <deal.icon size={24} />
            </div>
            <div className="flex-grow">
                <h4 className={`font-bold ${deal.color.replace('600', '800').replace('700', '900')}`}>{deal.promoText}</h4>
                <p className="text-sm text-slate-600">Based on their wishlist, they might love this!</p>
                <a 
                    href={deal.url} 
                    target="_blank" 
                    rel="noopener noreferrer sponsored" 
                    className={`text-sm font-bold ${deal.color} hover:underline mt-1 inline-block`}
                    onClick={() => trackEvent('affiliate_click', { partner: `High Comm: ${deal.name}` })}
                >
                    View Deal on Amazon &rarr;
                </a>
            </div>
        </div>
    </div>
);

const MetPromo = () => (
    <div className="p-4 bg-gradient-to-r from-stone-100 to-orange-50 rounded-lg border border-stone-200 shadow-sm animate-fade-in">
        <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-stone-700 text-white rounded-full h-12 w-12 flex items-center justify-center">
                <Palette size={24} />
            </div>
            <div className="flex-grow">
                <h4 className="font-bold text-stone-800">For the Art Lover</h4>
                <p className="text-sm text-stone-600">Unique gifts from The Met Museum (Free Earrings w/ $125+).</p>
                <a 
                    href={AFFILIATE_LINKS.THE_MET} 
                    target="_blank" 
                    rel="noopener noreferrer sponsored" 
                    className="text-sm font-bold text-orange-700 hover:underline mt-1 inline-block"
                    onClick={() => trackEvent('affiliate_click', { partner: 'The Met' })}
                >
                    Shop The Met Store &rarr;
                </a>
            </div>
        </div>
    </div>
);

const SugarRushPromo = () => (
    <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-200 shadow-sm animate-fade-in">
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 bg-pink-500 text-white rounded-full h-12 w-12 flex items-center justify-center mt-1">
                <Gift size={24} />
            </div>
            <div className="flex-grow">
                <h4 className="font-bold text-pink-900">Sweeten the Deal</h4>
                <p className="text-sm text-pink-700">Luxury candy boxes that look as good as they taste.</p>
                <a 
                    href={AFFILIATE_LINKS.SUGAR_RUSH} 
                    target="_blank" 
                    rel="noopener noreferrer sponsored" 
                    className="text-sm font-bold text-pink-600 hover:underline mt-1 inline-block"
                    onClick={() => trackEvent('affiliate_click', { partner: 'Sugarfina' })}
                >
                    Shop Sugarfina Gifts &rarr;
                </a>
            </div>
        </div>
    </div>
);

const TeaBookPromo = () => (
    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 shadow-sm animate-fade-in">
        <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-emerald-600 text-white rounded-full h-12 w-12 flex items-center justify-center">
                <Coffee size={24} />
            </div>
            <div className="flex-grow">
                <h4 className="font-bold text-emerald-900">For the Tea Lover</h4>
                <p className="text-sm text-emerald-700">Eco-friendly, organic teas in fun, giftable packaging.</p>
                <a 
                    href={AFFILIATE_LINKS.TEABOOK} 
                    target="_blank" 
                    rel="noopener noreferrer sponsored" 
                    className="text-sm font-bold text-emerald-600 hover:underline mt-1 inline-block"
                    onClick={() => trackEvent('affiliate_click', { partner: 'The TeaBook' })}
                >
                    Shop The TeaBook &rarr;
                </a>
            </div>
        </div>
    </div>
);

const GiftCardPromo = () => (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm animate-fade-in">
        <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-blue-600 text-white rounded-full h-12 w-12 flex items-center justify-center">
                <CreditCard size={24} />
            </div>
            <div className="flex-grow">
                <h4 className="font-bold text-blue-900">The Gift of Choice</h4>
                <p className="text-sm text-blue-700">Up to 15% off Gift Cards! Black Friday Deals 11/27 - 12/1.</p>
                <a 
                    href={AFFILIATE_LINKS.GIFTCARDS_COM} 
                    target="_blank" 
                    rel="noopener noreferrer sponsored" 
                    className="text-sm font-bold text-blue-600 hover:underline mt-1 inline-block"
                    onClick={() => trackEvent('affiliate_click', { partner: 'Giftcards.com' })}
                >
                    Find the Perfect Gift Card &rarr;
                </a>
            </div>
        </div>
    </div>
);

const AmazonGeneralPromo = ({ budget }: { budget?: string }) => (
    <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200 shadow-sm animate-fade-in">
        <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-amber-500 text-white rounded-full h-12 w-12 flex items-center justify-center">
                <ShoppingBag size={24} />
            </div>
            <div className="flex-grow">
                <h4 className="font-bold text-amber-900">Curated Amazon Finds</h4>
                <p className="text-sm text-amber-700">
                    {budget ? `Great gifts matching the ${budget} budget.` : 'Trending gifts they will actually use.'}
                </p>
                <a 
                    href={`https://www.amazon.com/s?k=gift+ideas&tag=${AFFILIATE_LINKS.AMAZON_TAG}`} 
                    target="_blank" 
                    rel="noopener noreferrer sponsored" 
                    className="text-sm font-bold text-amber-700 hover:underline mt-1 inline-block"
                    onClick={() => trackEvent('affiliate_click', { partner: 'Amazon General' })}
                >
                    Browse Gift Ideas &rarr;
                </a>
            </div>
        </div>
    </div>
);

// --- STOCKING STUFFER ROW ---
const StockingStufferRow = () => {
    // Randomly select 2 stocking stuffers
    const randomStuffers = useMemo(() => {
        const shuffled = [...STOCKING_STUFFERS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 2);
    }, []);

    return (
        <div className="mt-6 pt-4 border-t border-slate-100">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Add a Little Something Extra?</h5>
            <div className="grid grid-cols-2 gap-3">
                {randomStuffers.map((item, idx) => (
                    <a 
                        key={idx}
                        href={item.url}
                        target="_blank" 
                        rel="noopener noreferrer sponsored"
                        onClick={() => trackEvent('affiliate_click', { partner: `Stuffer: ${item.name}` })}
                        className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-red-200 hover:bg-red-50 transition-colors group"
                    >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-red-500 shadow-sm">
                            <item.icon size={14} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-700 group-hover:text-red-700 truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};

const AmazonLinker: React.FC<{ items: string, label: string }> = ({ items, label }) => {
    if (!items || items.trim() === '') return null;

    const createLink = (searchTerm: string) => {
        const lowerTerm = searchTerm.toLowerCase();
        
        // 1. Check for High Commission Match (Sniper)
        const deal = SNIPER_DEALS.find(d => d.keywords.some(k => lowerTerm.includes(k)));
        if (deal) return deal.url;
        
        // 2. Check Stocking Stuffers (if exact match keyword)
        const stuffer = STOCKING_STUFFERS.find(s => lowerTerm.includes(s.name.toLowerCase()));
        if (stuffer) return stuffer.url;

        // 3. Fallback to Standard Search
        return `https://www.amazon.com/s?k=${encodeURIComponent(searchTerm)}&tag=${AFFILIATE_LINKS.AMAZON_TAG}`;
    };

    const linkedItems = items.split(',').map(item => item.trim()).filter(Boolean);

    return (
        <p><strong className="font-semibold text-slate-800">{label}:</strong>{' '}
            {linkedItems.map((item, index) => (
                <React.Fragment key={index}>
                    <a
                        href={createLink(item)}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="text-indigo-600 hover:underline font-medium"
                        onClick={() => trackEvent('affiliate_click', { partner: 'Amazon Linker', keyword: item })}
                    >
                        {item}
                    </a>
                    {index < linkedItems.length - 1 && ', '}
                </React.Fragment>
            ))}
        </p>
    );
};

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId, onDataUpdated }) => {
    const [isNameRevealed, setIsNameRevealed] = useState(false);
    const [detailsVisible, setDetailsVisible] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
    const [isShuffleModalOpen, setIsShuffleModalOpen] = useState(false);
    const [shareModalInitialView, setShareModalInitialView] = useState<'links' | 'print' | null>(null);
    const [isShuffling, setIsShuffling] = useState(false);
    const [shortOrganizerLink, setShortOrganizerLink] = useState('');
    const [organizerLinkCopied, setOrganizerLinkCopied] = useState(false);
    const [showCookieBanner, setShowCookieBanner] = useState(false);
    const [liveWishlists, setLiveWishlists] = useState<LiveWishlists>({});
    const [isWishlistLoading, setIsWishlistLoading] = useState(true);

    const isOrganizer = !currentParticipantId;

    const { p: participantsFromUrl, matches: matchIds, exclusions, assignments, id: exchangeId } = data;
    
    const fetchWishlists = useCallback(async () => {
        if (!exchangeId) {
            setIsWishlistLoading(false);
            return;
        };
        setIsWishlistLoading(true);
        try {
            const res = await fetch(`/.netlify/functions/get-wishlist?exchangeId=${exchangeId}`);
            if (res.ok) {
                const wishlistData = await res.json();
                setLiveWishlists(wishlistData);
            }
        } catch (e) {
            console.error("Failed to fetch wishlists", e);
        } finally {
            setIsWishlistLoading(false);
        }
    }, [exchangeId]);

    useEffect(() => {
        fetchWishlists();
    }, [fetchWishlists]);
    
    const participants = useMemo(() => {
        return participantsFromUrl.map(p => ({
            ...p,
            ...(liveWishlists[p.id] || {})
        }));
    }, [participantsFromUrl, liveWishlists]);


    const matches: Match[] = useMemo(() => matchIds.map(m => ({
        giver: participants.find(p => p.id === m.g)!,
        receiver: participants.find(p => p.id === m.r)!,
    })).filter(m => m.giver && m.receiver), [matchIds, participants]);
    
    const currentParticipant = useMemo(() =>
        currentParticipantId ? participants.find(p => p.id === currentParticipantId) : null,
    [participants, currentParticipantId]);
    
    const currentMatch = useMemo(() =>
        currentParticipant ? matches.find(m => m.giver.id === currentParticipant.id) : null,
    [matches, currentParticipant]);

    // --- SMART RECOMMENDATION ENGINE ---
    const SmartPromoComponent = useMemo(() => {
        if (!currentMatch) return null;
    
        const combinedText = `${currentMatch.receiver.interests?.toLowerCase() || ''} ${currentMatch.receiver.likes?.toLowerCase() || ''}`;
        const isEu = isEuVisitor();
        
        if (isEu) return null; // Simplified EU Logic

        // 1. Check High Commission "Sniper" Deals First (10-20% Commission)
        const matchedDeal = SNIPER_DEALS.find(deal => 
            deal.keywords.some(k => combinedText.includes(k))
        );
        if (matchedDeal) {
            return <HighCommissionPromo deal={matchedDeal} />;
        }

        // 2. The Met (High Intent Art)
        if (combinedText.match(/art|museum|history|painting|draw|sketch|sculpture|gogh|monet|fashion|scarf|jewelry|culture/)) {
            return <MetPromo />;
        }

        // 3. Sugarfina (Sweets)
        if (combinedText.match(/candy|chocolate|sweet|snack|dessert|sugar|treat|food|cookie/)) {
            return <SugarRushPromo />;
        }
        
        // 4. TeaBook (Tea)
        if (combinedText.match(/tea|chai|drink|beverage|cozy|book/)) {
            return <TeaBookPromo />;
        }

        // 5. Giftcards.com (Indecisive / General)
        if (combinedText.match(/idk|anything|money|cash|gift card|shopping|mall|dining|restaurant/) || combinedText.trim().length < 3) {
            return <GiftCardPromo />;
        }

        // 6. Fallback: Amazon General
        return <AmazonGeneralPromo budget={currentMatch.receiver.budget} />;

    }, [currentMatch]);


    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (consent === null) {
            setShowCookieBanner(true);
        }
        
        if (shouldTrackByDefault()) {
             trackEvent('view_results_page', { is_organizer: isOrganizer, participant_id: currentParticipantId });
             
             trackEvent('page_view', {
                page_title: isOrganizer ? 'Secret Santa Organizer Dashboard' : 'Secret Santa Reveal Page',
                page_location: window.location.href,
                page_path: isOrganizer ? '/secret-santa/organizer-dashboard' : '/secret-santa/reveal'
             });

             if (isOrganizer) {
                 trackEvent('organizer_dashboard_loaded', {
                     participant_count: matches.length,
                     has_budget: matches.some(m => m.receiver.budget)
                 });
             }
        }

        if (isOrganizer) {
            const getFullOrganizerLink = (): string => window.location.href.split('?')[0];
            const fetchShortLink = async () => {
                const fullLink = getFullOrganizerLink();
                try {
                    const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(fullLink)}`);
                    if (res.ok) {
                        const shortUrl = await res.text();
                        setShortOrganizerLink(shortUrl && !shortUrl.toLowerCase().includes('error') ? shortUrl : fullLink);
                    } else { setShortOrganizerLink(fullLink); }
                } catch (e) { setShortOrganizerLink(fullLink); }
            };
            fetchShortLink();
        }
    }, [isOrganizer, currentParticipantId, matches.length]);
    
    const handleCookieAccept = () => {
        localStorage.setItem('cookie_consent', 'true');
        setShowCookieBanner(false);
        trackEvent('cookie_consent_accept');
    };

    const handleCookieDecline = () => {
        localStorage.setItem('cookie_consent', 'false');
        setShowCookieBanner(false);
    };

    const handleReveal = () => {
        setIsNameRevealed(true);
        trackEvent('reveal_name');
        setTimeout(() => {
            setDetailsVisible(true);
        }, 2500);
    };
    
    const handleWishlistSaveSuccess = () => {
        fetchWishlists();
    };

    const openShareModal = (view: 'links' | 'print') => {
        setShareModalInitialView(view);
        setIsShareModalOpen(true);
        trackEvent('open_share_modal', { initial_view: view });
    };
    
    const openWishlistModal = () => {
        setIsWishlistModalOpen(true);
        trackEvent('open_wishlist_editor');
    };

    const executeShuffle = async () => {
        if (!isOrganizer) return;
        setIsShuffling(true);
        trackEvent('shuffle_again_confirmed');
        try {
            await new Promise(resolve => setTimeout(resolve, 300));
            const result = generateMatches(participants, exclusions || [], assignments || []);
            if (!result.matches) throw new Error(result.error || "Failed to generate new matches.");
            
            const newRawMatches = result.matches.map(m => ({ g: m.giver.id, r: m.receiver.id }));
            onDataUpdated(newRawMatches);
            trackEvent('shuffle_again_success');
        } catch (error) {
            console.error("Shuffle Error:", error);
            alert(`Could not shuffle matches: ${error instanceof Error ? error.message : 'Unknown error'}`);
            trackEvent('shuffle_again_fail', { error: error instanceof Error ? error.message : 'unknown' });
        } finally {
            setIsShuffling(false);
        }
    };
    
    const handleCopyOrganizerLink = () => {
        if (!shortOrganizerLink) return;
        navigator.clipboard.writeText(shortOrganizerLink).then(() => {
            setOrganizerLinkCopied(true);
            setTimeout(() => setOrganizerLinkCopied(false), 2500);
            trackEvent('copy_link', { link_type: 'organizer_master_link' });
        });
    };
    
    const isEu = isEuVisitor();

    if (!isOrganizer && !currentMatch) {
        return (
            <div className="text-center p-8">
                <h2 className="text-xl font-bold text-red-600">Error</h2>
                <p className="text-slate-600">Could not find your match in this gift exchange.</p>
            </div>
        );
    }
    
    const hasLinks = currentMatch && Array.isArray(currentMatch.receiver.links) && currentMatch.receiver.links.some(link => link && link.trim() !== '');
    const hasDetails = currentMatch && (currentMatch.receiver.interests || currentMatch.receiver.likes || currentMatch.receiver.dislikes || currentMatch.receiver.budget);

    return (
        <div className="bg-slate-50 min-h-screen">
            {isShareModalOpen && <ShareLinksModal exchangeData={{ ...data, p: participants }} onClose={() => setIsShareModalOpen(false)} initialView={shareModalInitialView as string} />}
            {isWishlistModalOpen && currentParticipant && exchangeId && (
                <WishlistEditorModal 
                    participant={currentParticipant}
                    exchangeId={exchangeId}
                    onClose={() => setIsWishlistModalOpen(false)}
                    onSaveSuccess={handleWishlistSaveSuccess}
                />
            )}
             <ConfirmationModal
                isOpen={isShuffleModalOpen}
                onClose={() => setIsShuffleModalOpen(false)}
                onConfirm={executeShuffle}
                title="Are you sure you want to shuffle?"
                message="This will generate a new set of matches for everyone. Any links you've already shared will show the new results."
                confirmText="Yes, Shuffle"
                cancelText="Cancel"
            />
            <Header />
            <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl pb-16">
                {isOrganizer ? (
                    <div className="space-y-8">
                        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200 text-center">
                            <Gift className="h-16 w-16 text-red-500 mx-auto mb-4" />
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-serif">Success! Your Game is Ready!</h1>
                            <p className="text-slate-600 mt-2 max-w-2xl mx-auto">All names have been drawn. Use the buttons below to manage your event.</p>
                            <div className="mt-8 flex flex-wrap gap-4 justify-center">
                                <button onClick={() => openShareModal('links')} className="py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg">
                                    <Share2 size={20} /> Share & Download Hub
                                </button>
                                <button onClick={() => { trackEvent('shuffle_again_click'); setIsShuffleModalOpen(true); }} disabled={isShuffling} className="py-3 px-6 bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait">
                                    {isShuffling ? <Loader2 size={20} className="animate-spin" /> : <Shuffle size={20} />}
                                    {isShuffling ? 'Shuffling...' : 'Shuffle'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-amber-50 p-6 rounded-2xl border-2 border-dashed border-amber-300 text-center">
                             <h2 className="text-2xl font-bold text-amber-900">Your Organizer Master Link</h2>
                            <p className="text-amber-800 mt-2 mb-4 text-base">
                                <strong className="text-red-700 font-extrabold">Important:</strong> Save this link! It's the only way to get back to this page. If you lose it, you will have to start over.
                            </p>
                            <div className="max-w-md mx-auto flex items-center gap-2">
                                <input type="text" readOnly value={shortOrganizerLink || 'Generating link...'} className="w-full p-2 border border-amber-300 rounded-md bg-white text-sm truncate" />
                                <button onClick={handleCopyOrganizerLink} disabled={!shortOrganizerLink} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-md transition-colors flex-shrink-0 disabled:opacity-50">
                                    {organizerLinkCopied ? <Check size={20} /> : <Copy size={20} />}
                                </button>
                            </div>
                        </div>

                        <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="3456789012" data-ad-format="auto" data-full-width-responsive="true" />
                        {exchangeId && <ResultsDisplay matches={matches} exchangeId={exchangeId} liveWishlists={liveWishlists} />}
                    </div>
                ) : (
                    currentMatch && (
                        <div className="flex flex-col md:flex-row gap-8 items-start justify-center">
                            <div className="w-full max-w-sm mx-auto md:flex-shrink-0">
                                <PrintableCard 
                                    match={currentMatch} 
                                    eventDetails={data.eventDetails} 
                                    isNameRevealed={isNameRevealed} 
                                    backgroundOptions={data.backgroundOptions} 
                                    bgId={data.bgId} 
                                    bgImg={data.customBackground} 
                                    txtColor={data.textColor} 
                                    outline={data.useTextOutline} 
                                    outColor={data.outlineColor} 
                                    outSize={data.outlineSize} 
                                    fontSize={data.fontSizeSetting} 
                                    font={data.fontTheme} 
                                    line={data.lineSpacing} 
                                    greet={data.greetingText} 
                                    intro={data.introText} 
                                    wish={data.wishlistLabelText}
                                    showLinks={false}
                                />
                            </div>
                             <div className="text-center md:text-left h-fit w-full max-w-md">
                                {!isNameRevealed ? (
                                    <div className="p-6">
                                        <h1 className="text-3xl md:text-4xl font-bold text-green-700 font-serif">Hi, {currentMatch.giver.name}!</h1>
                                        <p className="text-lg text-slate-600 mt-2">
                                            Welcome to your private reveal page!
                                        </p>
                                        <p className="text-sm text-slate-600 mt-4">
                                            <strong>Is this your name?</strong> If not, please contact your organizer.
                                        </p>
                                        <p className="text-base text-slate-500 mt-6">
                                            Click the button below to see who you're the Secret Santa for and view their wishlist.
                                            You can update your own wishlist on the next page!
                                        </p>
                                        <button onClick={handleReveal} className="mt-8 w-full py-4 px-8 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-lg transition-transform transform hover:scale-105 shadow-lg">
                                            Click to Continue
                                        </button>
                                        <div className="mt-8">
                                            <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="3456789012" data-ad-format="auto" data-full-width-responsive="true" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 space-y-6">
                                        <p className="text-lg text-slate-600">
                                            <span className="font-bold text-green-700">{currentMatch.giver.name}</span>, you are the Secret Santa for...
                                        </p>
                                        
                                        <button onClick={openWishlistModal} className="w-full md:w-auto py-3 px-6 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors">
                                            Edit My Wishlist for My Santa
                                        </button>
                                        
                                        {detailsVisible && (
                                            <div className="bg-slate-100 rounded-2xl p-6 border text-left shadow-inner space-y-6 animate-fade-in">
                                                
                                                <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-800 p-4 rounded-r-lg">
                                                    <div className="flex">
                                                        <div className="py-1"><Bookmark className="h-5 w-5 text-amber-500 mr-3" /></div>
                                                        <div>
                                                            <p className="font-bold">Save Your Link!</p>
                                                            <p className="text-sm">Bookmark this page to easily come back and check your person's wishlist.</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white rounded-lg p-6 border text-left shadow-md space-y-4">
                                                    <div className="text-center border-b pb-4">
                                                        <h3 className="font-bold text-lg text-slate-700">Your Person is:</h3>
                                                        <p className="text-4xl font-bold text-red-600">{currentMatch.receiver.name}</p>
                                                    </div>

                                                    {hasDetails && (
                                                        <div>
                                                            <h4 className="font-bold text-slate-700 mb-2">Their Gift Ideas</h4>
                                                            <div className="space-y-1 text-slate-600 text-sm pl-2 break-all">
                                                                <AmazonLinker items={currentMatch.receiver.interests} label="Interests" />
                                                                <AmazonLinker items={currentMatch.receiver.likes} label="Likes" />
                                                                {currentMatch.receiver.dislikes && <p><strong className="font-semibold text-slate-800">Dislikes:</strong> {currentMatch.receiver.dislikes}</p>}
                                                                {currentMatch.receiver.budget && <p><strong className="font-semibold text-slate-800">Budget:</strong> {currentMatch.receiver.budget}</p>}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* SMART RECOMMENDATION ENGINE (Affiliate) */}
                                                    {SmartPromoComponent}
                                                    
                                                    {/* STOCKING STUFFER ADD-ONS (New Revenue Stream) */}
                                                    {!isEu && <StockingStufferRow />}

                                                    {hasLinks && (
                                                        <div>
                                                            <h4 className="font-bold text-slate-700 mb-3">Their Wishlist Links</h4>
                                                            <div className="grid grid-cols-1 gap-3">
                                                                {currentMatch.receiver.links.map((link, index) => (
                                                                    link.trim() ? <LinkPreview key={index} url={link} /> : null
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <p className="text-xs text-slate-400 text-center pt-4 border-t border-slate-200 mt-4">
                                                        Affiliate Disclosure: We may earn a commission from qualifying purchases or actions made through links on this site.
                                                    </p>
                                                </div>
                                                
                                                {data.eventDetails && (
                                                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                                        <p className="text-sm text-amber-800 text-center">{data.eventDetails}</p>
                                                    </div>
                                                )}

                                                {/* Credit Karma Promo - Budget Focused, Hidden for EU */}
                                                 {!isEu && (
                                                     <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex-shrink-0 bg-indigo-500 text-white rounded-full h-10 w-10 flex items-center justify-center">
                                                                <TrendingUp />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-indigo-800">Manage Your Holiday Budget</h4>
                                                                <p className="text-sm text-indigo-700">Keep track of your holiday spending and credit score for free.</p>
                                                                <a href={AFFILIATE_LINKS.CREDIT_KARMA} target="_blank" rel="noopener noreferrer sponsored" className="text-sm font-bold text-indigo-600 hover:underline">Try Credit Karma &rarr;</a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                 )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                )}
            </main>
            <Footer />
            {showCookieBanner && <CookieConsentBanner onAccept={handleCookieAccept} onDecline={handleCookieDecline} />}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ResultsPage;