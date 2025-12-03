
import React, { useState } from 'react';
import { 
    Calendar, Gift, Loader2, PlusCircle, CheckCircle, Palette, 
    DollarSign, HelpCircle, List, CheckSquare, Square, Star, 
    ChevronRight, X, ExternalLink, Sparkles
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import { trackEvent } from '../services/analyticsService';
import { createPool } from '../services/babyPoolService';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export type ThemeKey = 'sage' | 'ocean' | 'blush' | 'lavender' | 'roseGold' | 'midnight' | 'teddy' | 'cotton' | 'confetti';

export const THEMES: Record<ThemeKey, { name: string, bg: string, primary: string, secondary: string, accent: string, text: string, border: string }> = {
    sage: { name: 'Sage & Sand', bg: 'bg-[#f0fdf4]', primary: 'bg-emerald-600', secondary: 'bg-emerald-100', accent: 'text-emerald-700', text: 'text-emerald-900', border: 'border-emerald-200' },
    ocean: { name: 'Ocean Breeze', bg: 'bg-[#f0f9ff]', primary: 'bg-sky-600', secondary: 'bg-sky-100', accent: 'text-sky-700', text: 'text-sky-900', border: 'border-sky-200' },
    blush: { name: 'Sweet Blush', bg: 'bg-[#fff1f2]', primary: 'bg-rose-400', secondary: 'bg-rose-100', accent: 'text-rose-600', text: 'text-rose-900', border: 'border-rose-200' },
    cotton: { name: 'Cotton Candy', bg: 'bg-pink-50', primary: 'bg-pink-500', secondary: 'bg-pink-100', accent: 'text-pink-600', text: 'text-pink-900', border: 'border-pink-200' },
    lavender: { name: 'Lavender Dream', bg: 'bg-[#faf5ff]', primary: 'bg-violet-500', secondary: 'bg-violet-100', accent: 'text-violet-700', text: 'text-violet-900', border: 'border-violet-200' },
    roseGold: { name: 'Rose Gold', bg: 'bg-gradient-to-br from-rose-50 via-white to-orange-50', primary: 'bg-gradient-to-r from-rose-400 to-orange-300', secondary: 'bg-rose-50', accent: 'text-rose-500', text: 'text-slate-800', border: 'border-orange-100' },
    midnight: { name: 'Midnight Star', bg: 'bg-gradient-to-b from-slate-900 to-indigo-900', primary: 'bg-indigo-500', secondary: 'bg-indigo-800/50', accent: 'text-yellow-400', text: 'text-white', border: 'border-indigo-800' },
    teddy: { name: 'Classic Teddy', bg: 'bg-[#fffbeb]', primary: 'bg-amber-700', secondary: 'bg-amber-100', accent: 'text-amber-800', text: 'text-amber-900', border: 'border-amber-200' },
    confetti: { name: 'Confetti Party', bg: 'bg-white', primary: 'bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400', secondary: 'bg-slate-100', accent: 'text-blue-600', text: 'text-slate-900', border: 'border-slate-200' }
};

// Amazon Affiliate Links by Country
export const AMAZON_CONFIG: Record<string, { link: string, benefits: string[], welcomeBoxValue: string }> = {
    US: {
        link: 'https://www.amazon.com/baby-reg?tag=secretsanmat-20',
        benefits: ['FREE $35 Welcome Box', '15% Completion Discount', 'Add Items from ANY Website', '180-Day Easy Returns', 'Group Gifting for Big Items'],
        welcomeBoxValue: '$35'
    },
    UK: {
        link: 'https://www.amazon.co.uk/baby-reg?tag=secretsanmat-21',
        benefits: ['FREE Welcome Gift Box', '15% Completion Discount', 'Add Items from ANY Website', 'Easy Returns'],
        welcomeBoxValue: '£25'
    },
    CA: {
        link: 'https://www.amazon.ca/baby-reg?tag=secretsanmat-20',
        benefits: ['Welcome Box', '10% Completion Discount', 'Universal Registry'],
        welcomeBoxValue: '$35 CAD'
    }
};

// Detect user country for Amazon affiliate
export const detectCountry = (): string => {
    const lang = navigator.language || 'en-US';
    if (lang.includes('GB') || lang.includes('UK')) return 'UK';
    if (lang.includes('CA')) return 'CA';
    return 'US';
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// --- What is a Baby Pool Explainer ---
const BabyPoolExplainer: React.FC = () => (
    <div className="bg-gradient-to-br from-emerald-50 to-sky-50 rounded-3xl p-8 mb-8 border border-emerald-100">
        <h2 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-3">
            <HelpCircle className="text-emerald-600"/>
            What is a Baby Pool?
        </h2>
        <p className="text-slate-600 mb-6 leading-relaxed">
            A baby pool (also called a baby betting pool or baby guessing game) is a fun activity where 
            friends and family predict details about a baby's birth — like the <strong>due date</strong>, 
            <strong> weight</strong>, <strong>time</strong>, and <strong>gender</strong>. 
            The person with the closest guesses wins bragging rights (or a prize)!
        </p>
        <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-xl">1️⃣</span>
                </div>
                <h3 className="font-bold text-slate-800 mb-1">Create Your Pool</h3>
                <p className="text-sm text-slate-500">Enter baby's name & due date. Pick your theme. Takes 2 minutes!</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-xl">2️⃣</span>
                </div>
                <h3 className="font-bold text-slate-800 mb-1">Share the Link</h3>
                <p className="text-sm text-slate-500">Send to friends & family. No app downloads or signups needed!</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-xl">3️⃣</span>
                </div>
                <h3 className="font-bold text-slate-800 mb-1">Reveal the Winner</h3>
                <p className="text-sm text-slate-500">When baby arrives, enter the stats. We calculate the winner!</p>
            </div>
        </div>
        <p className="text-center text-sm text-slate-500 mt-6">
            <span className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full">
                <CheckCircle size={14} className="text-emerald-500"/>
                100% Free • No Signups • No App Downloads
            </span>
        </p>
    </div>
);

// --- Amazon Registry Upsell Modal ---
const AmazonRegistryModal: React.FC<{ 
    onClose: () => void, 
    onSkip: () => void,
    country: string 
}> = ({ onClose, onSkip, country }) => {
    const config = AMAZON_CONFIG[country] || AMAZON_CONFIG.US;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full relative overflow-hidden animate-fade-in">
                {/* Confetti decoration */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400"></div>
                
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={24}/>
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Gift className="text-orange-500" size={32}/>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">
                        Your Baby Pool is Ready! 🎉
                    </h2>
                    <p className="text-slate-600">
                        Before you share, did you know Prime members get exclusive perks?
                    </p>
                </div>

                <div className="bg-orange-50 rounded-2xl p-5 mb-6 border border-orange-100">
                    <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                        <Sparkles size={18}/> 
                        FREE {config.welcomeBoxValue} Welcome Box
                    </h3>
                    <ul className="space-y-2">
                        {config.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-orange-800">
                                <CheckCircle size={14} className="text-orange-500 flex-shrink-0"/>
                                {benefit}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="space-y-3">
                    <a 
                        href={config.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent('amazon_registry_click', { country })}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 shadow-lg shadow-orange-200"
                    >
                        <Gift size={20}/>
                        Create Free Amazon Registry
                        <ExternalLink size={16}/>
                    </a>
                    
                    <button 
                        onClick={onSkip}
                        className="w-full text-slate-500 hover:text-slate-700 font-medium py-3 transition-colors"
                    >
                        Maybe Later — Show My Share Link
                    </button>
                </div>

                <p className="text-[10px] text-slate-400 text-center mt-4">
                    We may earn a commission from Amazon. This helps keep Baby Pool Generator free!
                </p>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const BabyPoolGenerator: React.FC = () => {
    const [country] = useState(detectCountry());
    
    // Setup State
    const [setupData, setSetupData] = useState({ 
        babyName: '', 
        parentNames: '',
        dueDate: '', 
        theme: 'sage' as ThemeKey, 
        registryLink: '',
        diaperFundLink: '',
        includeFields: {
            time: true,
            weight: true,
            length: true,
            hair: true,
            eye: true,
            gender: true
        },
        customQuestions: ['', '', ''] 
    });
    
    const [activeTab, setActiveTab] = useState<'details' | 'style' | 'registry'>('details');
    const [isCreating, setIsCreating] = useState(false);
    const [showAmazonModal, setShowAmazonModal] = useState(false);
    const [pendingPoolData, setPendingPoolData] = useState<{ poolId: string, adminKey: string } | null>(null);

    const toggleField = (field: keyof typeof setupData.includeFields) => {
        setSetupData(prev => ({
            ...prev,
            includeFields: {
                ...prev.includeFields,
                [field]: !prev.includeFields[field]
            }
        }));
    };

    const handleCreate = async () => {
        if (!setupData.babyName || !setupData.dueDate) {
            alert("Please enter a name and due date in the Details tab!");
            setActiveTab('details');
            return;
        }
        setIsCreating(true);
        try {
            // Filter empty custom questions
            const cleanQuestions = setupData.customQuestions.filter(q => q.trim() !== '');
            // Update createPool service to return the full object, the service wrapper handles the json().
            const responseData = await createPool({ ...setupData, customQuestions: cleanQuestions });
            
            const { poolId, adminKey, pool } = responseData;

            // LOCAL HANDOFF: Save to sessionStorage to avoid race condition on redirect
            if (pool) {
                try {
                    sessionStorage.setItem(`bp_new_pool_${poolId}`, JSON.stringify(pool));
                } catch (e) { console.error("Session storage full", e); }
            }
            
            // Store pending data and show Amazon modal
            setPendingPoolData({ poolId, adminKey });
            setShowAmazonModal(true);
            
            trackEvent('pool_created', { 
                theme: setupData.theme, 
                fieldsEnabled: Object.keys(setupData.includeFields).filter(k => setupData.includeFields[k as keyof typeof setupData.includeFields]) 
            });
        } catch (err) {
            alert("Failed to create pool. Please try again.");
            setIsCreating(false);
        }
    };

    const finishPoolCreation = () => {
        if (pendingPoolData) {
            // Update hash to navigate to the dashboard
            window.location.hash = `poolId=${pendingPoolData.poolId}&adminKey=${pendingPoolData.adminKey}`;
        }
    };

    const previewTheme = THEMES[setupData.theme];
    
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Header />
            
            {/* Amazon Registry Modal */}
            {showAmazonModal && (
                <AmazonRegistryModal 
                    country={country}
                    onClose={() => {
                        setShowAmazonModal(false);
                        finishPoolCreation();
                    }}
                    onSkip={() => {
                        setShowAmazonModal(false);
                        finishPoolCreation();
                    }}
                />
            )}
            
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-emerald-50 to-white border-b border-slate-200 py-12 px-4 text-center">
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-sm font-bold mb-4">
                    <Star size={14}/> #1 Free Baby Pool Generator
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-slate-800 font-serif mb-3">
                    Guess When Baby Arrives!
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Create a fun guessing game for friends & family. Predict the due date, weight, gender & more! 
                    <span className="block mt-1 font-semibold text-emerald-600">No apps to download, just a link to share.</span>
                </p>
            </div>

            <div className="max-w-6xl mx-auto p-4 md:p-8">
                
                {/* What is a Baby Pool Explainer */}
                <BabyPoolExplainer />

                <div className="grid lg:grid-cols-2 gap-8 items-start">
                    
                    {/* LEFT COLUMN: CONFIGURATION */}
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-slate-100 overflow-x-auto">
                            <button onClick={() => setActiveTab('details')} className={`flex-1 py-4 px-4 font-bold text-sm md:text-base whitespace-nowrap transition-colors ${activeTab === 'details' ? 'text-slate-900 border-b-2 border-slate-900 bg-slate-50' : 'text-slate-400 hover:text-slate-600'}`}>1. Details</button>
                            <button onClick={() => setActiveTab('style')} className={`flex-1 py-4 px-4 font-bold text-sm md:text-base whitespace-nowrap transition-colors ${activeTab === 'style' ? 'text-slate-900 border-b-2 border-slate-900 bg-slate-50' : 'text-slate-400 hover:text-slate-600'}`}>2. Game & Style</button>
                            <button onClick={() => setActiveTab('registry')} className={`flex-1 py-4 px-4 font-bold text-sm md:text-base whitespace-nowrap transition-colors ${activeTab === 'registry' ? 'text-slate-900 border-b-2 border-slate-900 bg-slate-50' : 'text-slate-400 hover:text-slate-600'}`}>3. Registry & More</button>
                        </div>

                        <div className="p-6 md:p-8 min-h-[400px]">
                            {/* TAB 1: DETAILS */}
                            {activeTab === 'details' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-2">Baby Name (or Placeholder)</label>
                                        <input 
                                            type="text" 
                                            value={setupData.babyName} 
                                            onChange={e => setSetupData({...setupData, babyName: e.target.value})} 
                                            className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 outline-none transition" 
                                            placeholder="e.g. Baby Smith"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-2">Parent Name(s)</label>
                                        <input 
                                            type="text" 
                                            value={setupData.parentNames} 
                                            onChange={e => setSetupData({...setupData, parentNames: e.target.value})} 
                                            className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 outline-none transition" 
                                            placeholder="e.g. Mary & Joe"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">Shown on the invite link.</p>
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-2">Due Date</label>
                                        <input 
                                            type="date" 
                                            value={setupData.dueDate} 
                                            onChange={e => setSetupData({...setupData, dueDate: e.target.value})} 
                                            className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 outline-none transition"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => setActiveTab('style')} 
                                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors mt-4 flex items-center justify-center gap-2"
                                    >
                                        Next: Game & Style <ChevronRight size={18}/>
                                    </button>
                                </div>
                            )}

                            {/* TAB 2: GAME & STYLE */}
                            {activeTab === 'style' && (
                                <div className="space-y-8 animate-fade-in">
                                    
                                    {/* Field Toggles */}
                                    <section>
                                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><List size={18}/> What do guests guess?</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { id: 'time', label: 'Time of Birth' },
                                                { id: 'weight', label: 'Weight' },
                                                { id: 'length', label: 'Length' },
                                                { id: 'hair', label: 'Hair Color' },
                                                { id: 'eye', label: 'Eye Color' },
                                                { id: 'gender', label: 'Gender' },
                                            ].map(field => (
                                                <button 
                                                    key={field.id} 
                                                    onClick={() => toggleField(field.id as keyof typeof setupData.includeFields)}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${setupData.includeFields[field.id as keyof typeof setupData.includeFields] ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-slate-100 text-slate-400'}`}
                                                >
                                                    {setupData.includeFields[field.id as keyof typeof setupData.includeFields] ? <CheckSquare size={20}/> : <Square size={20}/>}
                                                    <span className="font-bold text-sm">{field.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Bonus Questions */}
                                    <section>
                                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><HelpCircle size={18}/> Bonus Questions (Optional)</h3>
                                        <div className="space-y-3">
                                            {setupData.customQuestions.map((q, i) => (
                                                <input 
                                                    key={i}
                                                    type="text" 
                                                    value={q} 
                                                    onChange={e => {
                                                        const newQs = [...setupData.customQuestions];
                                                        newQs[i] = e.target.value;
                                                        setSetupData({...setupData, customQuestions: newQs});
                                                    }} 
                                                    className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:border-slate-800 outline-none transition" 
                                                    placeholder={`e.g. "Mom's nose or Dad's?"`}
                                                />
                                            ))}
                                        </div>
                                    </section>

                                    {/* Themes */}
                                    <section>
                                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Palette size={18}/> Choose a Theme</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {Object.entries(THEMES).map(([k, v]) => (
                                                <button 
                                                    key={k} 
                                                    onClick={() => setSetupData({...setupData, theme: k as ThemeKey})} 
                                                    className={`relative p-2 rounded-xl border-2 transition-all text-left group overflow-hidden ${setupData.theme === k ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-100 hover:border-slate-300'}`}
                                                >
                                                    <div className={`h-10 w-full rounded-lg mb-2 ${v.bg} border border-slate-100`}></div>
                                                    <span className="text-xs font-bold text-slate-700 block truncate">{v.name}</span>
                                                    {setupData.theme === k && <div className="absolute top-1 right-1 bg-slate-900 text-white rounded-full p-0.5"><CheckCircle size={10}/></div>}
                                                </button>
                                            ))}
                                        </div>
                                    </section>

                                    <button 
                                        onClick={() => setActiveTab('registry')} 
                                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                    >
                                        Next: Registry & More <ChevronRight size={18}/>
                                    </button>
                                </div>
                            )}

                            {/* TAB 3: REGISTRY & EXTRAS */}
                            {activeTab === 'registry' && (
                                <div className="space-y-8 animate-fade-in">
                                    {/* Amazon Promo Block */}
                                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-xl border border-orange-100 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-orange-200 text-orange-800 text-[10px] font-bold px-2 py-1 rounded-bl">SPONSORED</div>
                                        <h3 className="font-bold text-orange-900 flex items-center gap-2 mb-2"><Gift size={18}/> Need a Registry?</h3>
                                        <p className="text-sm text-orange-800 mb-3">
                                            Prime members get a <strong>Free Welcome Box ({AMAZON_CONFIG[country]?.welcomeBoxValue || '$35'})</strong> + 15% completion discount!
                                        </p>
                                        <a 
                                            href={AMAZON_CONFIG[country]?.link || AMAZON_CONFIG.US.link} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="block w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-center rounded-lg text-sm font-bold transition-colors"
                                        >
                                            Create Free Amazon Registry
                                        </a>
                                    </div>

                                    <div>
                                        <label className="font-bold text-slate-700 block mb-2">Registry Link (Optional)</label>
                                        <input 
                                            type="text" 
                                            value={setupData.registryLink} 
                                            onChange={e => setSetupData({...setupData, registryLink: e.target.value})} 
                                            className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 outline-none transition" 
                                            placeholder="Paste your registry link here..."
                                        />
                                    </div>

                                    <div>
                                        <label className="font-bold text-slate-700 block mb-2">Diaper Fund Link (Optional)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-4 text-slate-400" size={18}/>
                                            <input 
                                                type="text" 
                                                value={setupData.diaperFundLink} 
                                                onChange={e => setSetupData({...setupData, diaperFundLink: e.target.value})} 
                                                className="w-full p-4 pl-10 bg-slate-50 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 outline-none transition" 
                                                placeholder="Venmo, CashApp, or PayPal link"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">Guests can click this to send cash gifts directly.</p>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <p className="text-xs text-slate-400 mb-4 text-center">By creating a pool, you agree to our Terms. We may earn a commission from affiliate links.</p>
                                        <button 
                                            onClick={handleCreate} 
                                            disabled={isCreating} 
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-100 transition-all transform hover:-translate-y-1 flex justify-center gap-2"
                                        >
                                            {isCreating ? <Loader2 className="animate-spin"/> : <PlusCircle />} Create My Baby Pool
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: LIVE PREVIEW */}
                    <div className="sticky top-8 hidden lg:block">
                        <div className="text-center mb-4">
                            <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Live Preview</span>
                        </div>
                        
                        {/* Phone Frame */}
                        <div className={`relative mx-auto max-w-[360px] rounded-[2.5rem] border-8 border-slate-900 bg-slate-900 shadow-2xl overflow-hidden`}>
                            {/* Phone Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-slate-900 rounded-b-xl z-20"></div>
                            
                            {/* Screen Content */}
                            <div className={`h-[650px] w-full bg-white overflow-y-auto no-scrollbar ${previewTheme.bg} relative`}>
                                
                                {/* Theme Header */}
                                <div className={`${previewTheme.primary} pt-12 pb-8 px-6 text-center text-white relative rounded-b-[2rem] shadow-sm`}>
                                    <h2 className="text-2xl font-black font-serif leading-tight mb-1">
                                        {setupData.babyName || "Baby Name"}
                                    </h2>
                                    {setupData.parentNames && (
                                        <p className="text-xs font-medium opacity-90 mb-3">Celebrating {setupData.parentNames}</p>
                                    )}
                                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold">
                                        <Calendar size={12}/> Due: {setupData.dueDate || "Dec 25"}
                                    </div>
                                </div>

                                {/* Preview Body */}
                                <div className="p-4 space-y-4">
                                    {/* Countdown Preview */}
                                    <div className={`p-3 rounded-xl ${previewTheme.secondary} border ${previewTheme.border} text-center`}>
                                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Baby Arrives In</p>
                                        <div className="flex justify-center gap-2">
                                            {['23', '14', '32', '05'].map((n, i) => (
                                                <div key={i} className="bg-white/50 px-2 py-1 rounded text-sm font-black">{n}</div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Guess Form Preview */}
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3 opacity-80">
                                        <div className="h-8 bg-slate-100 rounded-lg w-full"></div>
                                        <div className="flex gap-2">
                                            {setupData.includeFields.time && <div className="h-8 bg-slate-100 rounded-lg flex-1"></div>}
                                            {setupData.includeFields.weight && <div className="h-8 bg-slate-100 rounded-lg flex-1"></div>}
                                        </div>
                                        {(setupData.includeFields.length || setupData.includeFields.hair || setupData.includeFields.eye) && (
                                            <div className="h-8 bg-slate-100 rounded-lg w-full"></div>
                                        )}
                                        {setupData.includeFields.gender && (
                                            <div className="flex gap-2">
                                                <div className="h-8 bg-blue-50 rounded-lg flex-1 flex items-center justify-center text-xs text-blue-400">Boy</div>
                                                <div className="h-8 bg-pink-50 rounded-lg flex-1 flex items-center justify-center text-xs text-pink-400">Girl</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Leaderboard Placeholder */}
                                    <div className="space-y-2">
                                        <h4 className={`text-xs font-bold uppercase tracking-wider ${previewTheme.text}`}>Recent Guesses</h4>
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="bg-white/60 p-3 rounded-xl border border-white/50 flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full ${previewTheme.secondary} flex items-center justify-center text-xs font-bold ${previewTheme.accent}`}>{String.fromCharCode(64+i)}</div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="h-3 w-20 bg-slate-200 rounded-full"></div>
                                                    <div className="h-2 w-12 bg-slate-100 rounded-full"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Fab Button Mockup */}
                                <div className={`absolute bottom-6 right-6 h-14 w-14 rounded-full shadow-lg ${previewTheme.primary} flex items-center justify-center text-white`}>
                                    <PlusCircle size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            <Footer />
        </div>
    );
};

export default BabyPoolGenerator;
