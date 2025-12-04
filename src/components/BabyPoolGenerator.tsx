import React, { useState } from 'react';
import { 
    Calendar, Gift, Loader2, PlusCircle, CheckCircle, Palette, 
    DollarSign, HelpCircle, List, CheckSquare, Square, Star, 
    ChevronRight, X, ExternalLink, Sparkles, Trophy, Users,
    Heart, Link2, Trash2, Globe, Baby, Award, Package, Truck
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import { trackEvent } from '../services/analyticsService';
import { createPool } from '../services/babyPoolService';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export type ThemeKey = 'sage' | 'ocean' | 'blush' | 'lavender' | 'roseGold' | 'midnight' | 'teddy' | 'cotton' | 'confetti' | 'stork' | 'safari' | 'woodland' | 'rainbow' | 'celestial' | 'vintage';

export const THEMES: Record<ThemeKey, { name: string, bg: string, primary: string, secondary: string, accent: string, text: string, border: string, illustration: string, pattern?: string }> = {
    sage: { name: 'Sage & Sand', bg: 'bg-[#f0fdf4]', primary: 'bg-emerald-600', secondary: 'bg-emerald-100', accent: 'text-emerald-700', text: 'text-emerald-900', border: 'border-emerald-200', illustration: '🌿' },
    ocean: { name: 'Ocean Breeze', bg: 'bg-[#f0f9ff]', primary: 'bg-sky-600', secondary: 'bg-sky-100', accent: 'text-sky-700', text: 'text-sky-900', border: 'border-sky-200', illustration: '🐋' },
    blush: { name: 'Sweet Blush', bg: 'bg-[#fff1f2]', primary: 'bg-rose-400', secondary: 'bg-rose-100', accent: 'text-rose-600', text: 'text-rose-900', border: 'border-rose-200', illustration: '🌸' },
    cotton: { name: 'Cotton Candy', bg: 'bg-pink-50', primary: 'bg-pink-500', secondary: 'bg-pink-100', accent: 'text-pink-600', text: 'text-pink-900', border: 'border-pink-200', illustration: '🍭' },
    lavender: { name: 'Lavender Dream', bg: 'bg-[#faf5ff]', primary: 'bg-violet-500', secondary: 'bg-violet-100', accent: 'text-violet-700', text: 'text-violet-900', border: 'border-violet-200', illustration: '💜' },
    roseGold: { name: 'Rose Gold', bg: 'bg-gradient-to-br from-rose-50 via-white to-orange-50', primary: 'bg-gradient-to-r from-rose-400 to-orange-300', secondary: 'bg-rose-50', accent: 'text-rose-500', text: 'text-slate-800', border: 'border-orange-100', illustration: '✨' },
    midnight: { name: 'Midnight Star', bg: 'bg-gradient-to-b from-slate-900 to-indigo-900', primary: 'bg-indigo-500', secondary: 'bg-indigo-800/50', accent: 'text-yellow-400', text: 'text-white', border: 'border-indigo-800', illustration: '🌙' },
    teddy: { name: 'Classic Teddy', bg: 'bg-[#fffbeb]', primary: 'bg-amber-700', secondary: 'bg-amber-100', accent: 'text-amber-800', text: 'text-amber-900', border: 'border-amber-200', illustration: '🧸' },
    confetti: { name: 'Confetti Party', bg: 'bg-white', primary: 'bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400', secondary: 'bg-slate-100', accent: 'text-blue-600', text: 'text-slate-900', border: 'border-slate-200', illustration: '🎉' },
    // NEW THEMES
    stork: { name: 'Special Delivery', bg: 'bg-gradient-to-br from-blue-50 to-pink-50', primary: 'bg-gradient-to-r from-blue-400 to-pink-400', secondary: 'bg-white', accent: 'text-blue-600', text: 'text-slate-800', border: 'border-blue-200', illustration: '🦩', pattern: 'clouds' },
    safari: { name: 'Safari Adventure', bg: 'bg-[#fef9c3]', primary: 'bg-amber-500', secondary: 'bg-amber-50', accent: 'text-amber-700', text: 'text-amber-900', border: 'border-amber-300', illustration: '🦁' },
    woodland: { name: 'Woodland Friends', bg: 'bg-gradient-to-br from-green-50 to-amber-50', primary: 'bg-green-700', secondary: 'bg-green-100', accent: 'text-green-800', text: 'text-green-900', border: 'border-green-200', illustration: '🦊' },
    rainbow: { name: 'Rainbow Baby', bg: 'bg-gradient-to-r from-red-50 via-yellow-50 via-green-50 via-blue-50 to-purple-50', primary: 'bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400', secondary: 'bg-white', accent: 'text-purple-600', text: 'text-slate-800', border: 'border-purple-200', illustration: '🌈' },
    celestial: { name: 'Celestial Dream', bg: 'bg-gradient-to-b from-indigo-100 via-purple-50 to-pink-50', primary: 'bg-gradient-to-r from-indigo-500 to-purple-500', secondary: 'bg-indigo-100', accent: 'text-indigo-700', text: 'text-indigo-900', border: 'border-indigo-200', illustration: '⭐' },
    vintage: { name: 'Vintage Charm', bg: 'bg-[#fdf6e3]', primary: 'bg-[#a67c52]', secondary: 'bg-[#f5e6d3]', accent: 'text-[#8b6914]', text: 'text-[#5c4033]', border: 'border-[#d4b896]', illustration: '🎀' },
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

export const detectCountry = (): string => {
    const lang = navigator.language || 'en-US';
    if (lang.includes('GB') || lang.includes('UK')) return 'UK';
    if (lang.includes('CA')) return 'CA';
    return 'US';
};

export type UnitSystem = 'imperial' | 'metric';

export const UNIT_LABELS = {
    imperial: { weight: 'lbs/oz', length: 'inches', weightUnit: 'lb', lengthUnit: 'in' },
    metric: { weight: 'kg/g', length: 'cm', weightUnit: 'kg', lengthUnit: 'cm' }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

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
            {[
                { num: '1️⃣', title: 'Create Your Pool', desc: 'Enter baby\'s name & due date. Pick your theme. Takes 2 minutes!', bg: 'bg-emerald-100' },
                { num: '2️⃣', title: 'Share the Link', desc: 'Send to friends & family. No app downloads or signups needed!', bg: 'bg-sky-100' },
                { num: '3️⃣', title: 'Reveal the Winner', desc: 'When baby arrives, enter the stats. We calculate the winner!', bg: 'bg-amber-100' },
            ].map((step, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-sm">
                    <div className={`w-10 h-10 ${step.bg} rounded-full flex items-center justify-center mb-3`}>
                        <span className="text-xl">{step.num}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 mb-1">{step.title}</h3>
                    <p className="text-sm text-slate-500">{step.desc}</p>
                </div>
            ))}
        </div>
        <p className="text-center text-sm text-slate-500 mt-6">
            <span className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full">
                <CheckCircle size={14} className="text-emerald-500"/>
                100% Free • No Signups • No App Downloads
            </span>
        </p>
    </div>
);

// --- STUNNING Amazon Registry Modal ---
const AmazonRegistryModal: React.FC<{ onClose: () => void, onSkip: () => void, country: string }> = ({ onClose, onSkip, country }) => {
    const config = AMAZON_CONFIG[country] || AMAZON_CONFIG.US;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-orange-50 via-white to-amber-50 rounded-3xl max-w-lg w-full relative overflow-hidden animate-fade-in shadow-2xl">
                {/* Animated gradient header */}
                <div className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 p-8 text-center relative overflow-hidden">
                    {/* Animated sparkles */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-2 left-4 text-2xl animate-bounce">✨</div>
                        <div className="absolute top-6 right-8 text-xl animate-pulse">⭐</div>
                        <div className="absolute bottom-4 left-1/4 text-lg animate-bounce delay-100">🎁</div>
                        <div className="absolute bottom-2 right-1/4 text-2xl animate-pulse delay-200">✨</div>
                    </div>
                    
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/20 rounded-full p-1">
                        <X size={20}/>
                    </button>
                    
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <Gift className="text-orange-500" size={40}/>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-white mb-2 drop-shadow-sm">
                            🎉 Pool Created!
                        </h2>
                        <p className="text-white/90 font-medium">
                            Before you share, grab this exclusive perk!
                        </p>
                    </div>
                </div>

                <div className="p-6">
                    {/* Big Value Callout */}
                    <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-6 mb-6 border-2 border-orange-200 relative overflow-hidden">
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full transform rotate-12">
                            FREE!
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                                {config.welcomeBoxValue}
                            </div>
                            <div>
                                <h3 className="font-black text-orange-900 text-xl">Welcome Box</h3>
                                <p className="text-orange-700 text-sm">Full of baby essentials!</p>
                            </div>
                        </div>
                    </div>

                    {/* Benefits Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {[
                            { icon: <Package size={18}/>, text: 'Free Welcome Box' },
                            { icon: <Award size={18}/>, text: '15% Discount' },
                            { icon: <Truck size={18}/>, text: 'Easy Returns' },
                            { icon: <Gift size={18}/>, text: 'Group Gifting' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2 bg-white p-3 rounded-xl border border-orange-100">
                                <div className="text-orange-500">{item.icon}</div>
                                <span className="text-sm font-medium text-slate-700">{item.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <a 
                        href={config.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent('amazon_registry_click', { country })}
                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 shadow-lg shadow-orange-200 text-lg"
                    >
                        <Gift size={24}/>
                        Get FREE {config.welcomeBoxValue} Box
                        <ExternalLink size={18}/>
                    </a>
                    
                    <button 
                        onClick={onSkip}
                        className="w-full text-slate-400 hover:text-slate-600 font-medium py-4 mt-2 transition-colors text-sm"
                    >
                        Skip for now — Show my share link
                    </button>

                    <p className="text-[10px] text-slate-400 text-center mt-2">
                        Affiliate link helps keep Baby Pool Generator free!
                    </p>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const BabyPoolGenerator: React.FC = () => {
    const [country] = useState(detectCountry());
    
    const [setupData, setSetupData] = useState({ 
        babyName: '', 
        parentNames: '',
        dueDate: '', 
        dueDateUnknown: false,
        theme: 'sage' as ThemeKey, 
        registryLink: '',
        diaperFundLink: '',
        includeFields: { time: true, weight: true, length: true, hair: true, eye: true, gender: true },
        customQuestions: ['', '', ''],
        unitSystem: 'imperial' as UnitSystem,
        isMultiples: false,
        multiplesCount: 2,
        prizeDescription: '',
        guessDeadline: '',
        nameOptions: [] as string[],
        enableNamePoll: false,
        additionalLinks: [] as { label: string, url: string }[],
        targetGuessCount: 25,
    });
    
    const [newNameOption, setNewNameOption] = useState('');
    const [newLinkLabel, setNewLinkLabel] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');
    
    // IMPORTANT: Tab only changes via Next button, not clicking
    const [activeTab, setActiveTab] = useState<'details' | 'style' | 'registry'>('details');
    const [isCreating, setIsCreating] = useState(false);
    const [showAmazonModal, setShowAmazonModal] = useState(false);
    const [pendingPoolData, setPendingPoolData] = useState<{ poolId: string, adminKey: string } | null>(null);

    const toggleField = (field: keyof typeof setupData.includeFields) => {
        setSetupData(prev => ({ ...prev, includeFields: { ...prev.includeFields, [field]: !prev.includeFields[field] } }));
    };

    const addNameOption = () => {
        if (!newNameOption.trim() || setupData.nameOptions.length >= 10) return;
        setSetupData(prev => ({ ...prev, nameOptions: [...prev.nameOptions, newNameOption.trim()] }));
        setNewNameOption('');
    };

    const removeNameOption = (index: number) => setSetupData(prev => ({ ...prev, nameOptions: prev.nameOptions.filter((_, i) => i !== index) }));

    const addAdditionalLink = () => {
        if (!newLinkLabel.trim() || !newLinkUrl.trim() || setupData.additionalLinks.length >= 5) return;
        setSetupData(prev => ({ ...prev, additionalLinks: [...prev.additionalLinks, { label: newLinkLabel.trim(), url: newLinkUrl.trim() }] }));
        setNewLinkLabel('');
        setNewLinkUrl('');
    };

    const removeAdditionalLink = (index: number) => setSetupData(prev => ({ ...prev, additionalLinks: prev.additionalLinks.filter((_, i) => i !== index) }));

    // Navigate ONLY via Next buttons
    const goToStyle = () => {
        if (!setupData.babyName) return alert("Please enter a name for the baby!");
        if (!setupData.dueDate && !setupData.dueDateUnknown) return alert("Please enter a due date or check 'Due date unknown'");
        setActiveTab('style');
    };

    const goToRegistry = () => setActiveTab('registry');

    const handleCreate = async () => {
        if (!setupData.babyName) { alert("Please enter a name!"); setActiveTab('details'); return; }
        if (!setupData.dueDate && !setupData.dueDateUnknown) { alert("Please enter a due date!"); setActiveTab('details'); return; }
        
        setIsCreating(true);
        try {
            const cleanQuestions = setupData.customQuestions.filter(q => q.trim() !== '');
            const responseData = await createPool({ ...setupData, customQuestions: cleanQuestions });
            const { poolId, adminKey, pool } = responseData;
            if (pool) { try { sessionStorage.setItem(`bp_new_pool_${poolId}`, JSON.stringify(pool)); } catch {} }
            setPendingPoolData({ poolId, adminKey });
            setShowAmazonModal(true);
            trackEvent('pool_created', { theme: setupData.theme, isMultiples: setupData.isMultiples, hasNamePoll: setupData.enableNamePoll, hasPrize: !!setupData.prizeDescription });
        } catch {
            alert("Failed to create pool. Please try again.");
            setIsCreating(false);
        }
    };

    const finishPoolCreation = () => {
        if (pendingPoolData) window.location.hash = `poolId=${pendingPoolData.poolId}&adminKey=${pendingPoolData.adminKey}`;
    };

    const previewTheme = THEMES[setupData.theme];
    const hasValue = (val: string | boolean) => typeof val === 'boolean' ? val : val?.trim().length > 0;
    
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Header />
            
            {showAmazonModal && (
                <AmazonRegistryModal 
                    country={country}
                    onClose={() => { setShowAmazonModal(false); finishPoolCreation(); }}
                    onSkip={() => { setShowAmazonModal(false); finishPoolCreation(); }}
                />
            )}
            
            {/* Hero */}
            <div className="bg-gradient-to-b from-emerald-50 to-white border-b border-slate-200 py-12 px-4 text-center">
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-sm font-bold mb-4">
                    <Star size={14}/> #1 Free Baby Pool Generator
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-slate-800 font-serif mb-3">Guess When Baby Arrives!</h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Create a fun guessing game for friends & family. 
                    <span className="block mt-1 font-semibold text-emerald-600">No apps to download, just a link to share.</span>
                </p>
            </div>

            <div className="max-w-6xl mx-auto p-4 md:p-8">
                <BabyPoolExplainer />

                <div className="grid lg:grid-cols-2 gap-8 items-start">
                    
                    {/* LEFT COLUMN */}
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                        {/* TABS - Visual only, NOT clickable */}
                        <div className="flex border-b border-slate-100 overflow-x-auto">
                            {[
                                { key: 'details', label: '1. Details' },
                                { key: 'style', label: '2. Game & Style' },
                                { key: 'registry', label: '3. Links & Extras' },
                            ].map(tab => (
                                <div 
                                    key={tab.key}
                                    className={`flex-1 py-4 px-4 font-bold text-sm md:text-base whitespace-nowrap text-center ${
                                        activeTab === tab.key 
                                            ? 'text-slate-900 border-b-2 border-slate-900 bg-slate-50' 
                                            : 'text-slate-300 cursor-not-allowed'
                                    }`}
                                >
                                    {tab.label}
                                </div>
                            ))}
                        </div>

                        <div className="p-6 md:p-8 min-h-[400px]">
                            {/* TAB 1: DETAILS */}
                            {activeTab === 'details' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-2">Baby's Name (or Nickname)</label>
                                        <input 
                                            type="text" 
                                            value={setupData.babyName} 
                                            onChange={e => setSetupData({...setupData, babyName: e.target.value})} 
                                            className={`w-full p-4 rounded-xl border transition ${hasValue(setupData.babyName) ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200' : 'bg-slate-50 border-slate-200 focus:border-slate-800'} outline-none`}
                                            placeholder="e.g. Baby Smith, Little One, Peanut"
                                        />
                                    </div>

                                    <div>
                                        <label className="font-bold text-slate-700 block mb-2">Parent Name(s)</label>
                                        <input 
                                            type="text" 
                                            value={setupData.parentNames} 
                                            onChange={e => setSetupData({...setupData, parentNames: e.target.value})} 
                                            className={`w-full p-4 rounded-xl border transition ${hasValue(setupData.parentNames) ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200' : 'bg-slate-50 border-slate-200 focus:border-slate-800'} outline-none`}
                                            placeholder="e.g. Sarah & Mike"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">Shown on the invite link.</p>
                                    </div>

                                    <div>
                                        <label className="font-bold text-slate-700 block mb-2">When is baby due? 🗓️</label>
                                        {!setupData.dueDateUnknown && (
                                            <input 
                                                type="date" 
                                                value={setupData.dueDate} 
                                                onChange={e => setSetupData({...setupData, dueDate: e.target.value})} 
                                                className={`w-full p-4 rounded-xl border transition ${hasValue(setupData.dueDate) ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200' : 'bg-slate-50 border-slate-200 focus:border-slate-800'} outline-none`}
                                            />
                                        )}
                                        <label className="flex items-center gap-2 mt-2 cursor-pointer">
                                            <input type="checkbox" checked={setupData.dueDateUnknown} onChange={e => setSetupData({...setupData, dueDateUnknown: e.target.checked, dueDate: ''})} className="w-4 h-4 rounded"/>
                                            <span className="text-sm text-slate-600">We don't know the due date yet</span>
                                        </label>
                                        {setupData.dueDateUnknown && (
                                            <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded-lg">💡 Guests will only guess weight, gender & other details.</p>
                                        )}
                                    </div>

                                    <div className="bg-gradient-to-r from-pink-50 to-blue-50 p-4 rounded-xl border border-slate-200">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={setupData.isMultiples} onChange={e => setSetupData({...setupData, isMultiples: e.target.checked})} className="w-5 h-5 rounded"/>
                                            <div>
                                                <span className="font-bold text-slate-700 flex items-center gap-2"><Baby size={18}/> Expecting Multiples? 👶👶</span>
                                                <span className="text-xs text-slate-500 block">Twins, triplets, etc.</span>
                                            </div>
                                        </label>
                                        {setupData.isMultiples && (
                                            <select value={setupData.multiplesCount} onChange={e => setSetupData({...setupData, multiplesCount: parseInt(e.target.value)})} className="mt-3 p-2 border rounded-lg bg-white">
                                                <option value={2}>Twins (2)</option>
                                                <option value={3}>Triplets (3)</option>
                                                <option value={4}>Quadruplets (4)</option>
                                            </select>
                                        )}
                                    </div>

                                    <div>
                                        <label className="font-bold text-slate-700 block mb-2 flex items-center gap-2"><Globe size={18}/> Measurement Units</label>
                                        <div className="flex gap-3">
                                            {['imperial', 'metric'].map(unit => (
                                                <button 
                                                    key={unit}
                                                    onClick={() => setSetupData({...setupData, unitSystem: unit as UnitSystem})}
                                                    className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all ${setupData.unitSystem === unit ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}
                                                >
                                                    {unit === 'imperial' ? '🇺🇸 Imperial (lbs, in)' : '🌍 Metric (kg, cm)'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button onClick={goToStyle} className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-900 transition-all">
                                        Next: Customize Game <ChevronRight size={18}/>
                                    </button>
                                </div>
                            )}

                            {/* TAB 2: GAME & STYLE */}
                            {activeTab === 'style' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-3 flex items-center gap-2"><Palette size={18}/> Choose a Theme</label>
                                        <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2">
                                            {Object.entries(THEMES).map(([key, theme]) => (
                                                <button 
                                                    key={key} 
                                                    onClick={() => setSetupData({...setupData, theme: key as ThemeKey})}
                                                    className={`p-3 rounded-xl border-2 text-left transition-all ${setupData.theme === key ? 'border-slate-800 ring-2 ring-slate-300' : 'border-slate-200 hover:border-slate-400'}`}
                                                >
                                                    <div className={`w-full h-8 rounded-lg mb-2 ${theme.primary}`}></div>
                                                    <span className="text-xs font-medium text-slate-700 flex items-center gap-1">{theme.illustration} {theme.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="font-bold text-slate-700 block mb-3 flex items-center gap-2"><List size={18}/> What can guests predict?</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { key: 'gender', label: 'Gender', icon: '👶' },
                                                { key: 'weight', label: 'Weight', icon: '⚖️' },
                                                { key: 'length', label: 'Length', icon: '📏' },
                                                { key: 'time', label: 'Time', icon: '🕐' },
                                                { key: 'hair', label: 'Hair Color', icon: '💇' },
                                                { key: 'eye', label: 'Eye Color', icon: '👁️' },
                                            ].map(({ key, label, icon }) => (
                                                <button 
                                                    key={key} 
                                                    onClick={() => toggleField(key as keyof typeof setupData.includeFields)} 
                                                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm ${setupData.includeFields[key as keyof typeof setupData.includeFields] ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                                                >
                                                    {setupData.includeFields[key as keyof typeof setupData.includeFields] ? <CheckSquare size={16}/> : <Square size={16}/>}
                                                    {icon} {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="font-bold text-slate-700 block mb-2">⏰ Guessing Deadline (Optional)</label>
                                        <input type="date" value={setupData.guessDeadline} onChange={e => setSetupData({...setupData, guessDeadline: e.target.value})} className={`w-full p-4 rounded-xl border transition ${hasValue(setupData.guessDeadline) ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'} outline-none`}/>
                                        <p className="text-xs text-slate-400 mt-1">No new guesses after this date.</p>
                                    </div>

                                    <div>
                                        <label className="font-bold text-slate-700 block mb-2">🎯 Guest Goal</label>
                                        <p className="text-xs text-slate-500 mb-2">Set a target number of guesses. A progress bar will show "12 of 25 guesses collected!" to encourage guests to share with others.</p>
                                        <select value={setupData.targetGuessCount} onChange={e => setSetupData({...setupData, targetGuessCount: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200">
                                            <option value={10}>10 guesses</option>
                                            <option value={25}>25 guesses (recommended)</option>
                                            <option value={50}>50 guesses</option>
                                            <option value={100}>100 guesses</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="font-bold text-slate-700 block mb-3 flex items-center gap-2"><HelpCircle size={18}/> Bonus Questions (Optional)</label>
                                        <div className="space-y-2">
                                            {setupData.customQuestions.map((q, i) => (
                                                <input key={i} type="text" value={q} onChange={e => { const u = [...setupData.customQuestions]; u[i] = e.target.value; setSetupData({...setupData, customQuestions: u}); }} className={`w-full p-3 rounded-xl border text-sm ${q.trim() ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`} placeholder={`e.g. "First word?"`}/>
                                            ))}
                                        </div>
                                    </div>

                                    <button onClick={goToRegistry} className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-900 transition-all">
                                        Next: Add Links <ChevronRight size={18}/>
                                    </button>
                                </div>
                            )}

                            {/* TAB 3: LINKS & EXTRAS */}
                            {activeTab === 'registry' && (
                                <div className="space-y-6 animate-fade-in">
                                    
                                    {/* Prize Section - IMPROVED */}
                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-200">
                                        <label className="font-bold text-amber-900 block mb-2 flex items-center gap-2">
                                            <Trophy size={18} className="text-amber-500"/> 🏆 Winner's Prize (Optional)
                                        </label>
                                        <p className="text-xs text-amber-700 mb-3">Motivate guests! What does the winner get? Bragging rights always work, but a small prize makes it even more fun.</p>
                                        <input 
                                            type="text" 
                                            value={setupData.prizeDescription} 
                                            onChange={e => setSetupData({...setupData, prizeDescription: e.target.value})} 
                                            className={`w-full p-4 rounded-xl border transition ${hasValue(setupData.prizeDescription) ? 'bg-white border-amber-300 ring-2 ring-amber-200' : 'bg-white border-amber-200'} outline-none`}
                                            placeholder="e.g. $25 gift card, Bragging rights!, Dinner on us"
                                        />
                                        <p className="text-xs text-amber-700 mt-3">
                                            💡 <a href="https://www.giftcards.com?ref=secretsantamatch" target="_blank" rel="noopener" className="underline font-medium hover:text-amber-900">Need a prize? Browse gift cards at GiftCards.com →</a>
                                        </p>
                                    </div>

                                    {/* Name Poll */}
                                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-5 rounded-2xl border border-pink-200">
                                        <label className="flex items-center gap-3 cursor-pointer mb-4">
                                            <input type="checkbox" checked={setupData.enableNamePoll} onChange={e => setSetupData({...setupData, enableNamePoll: e.target.checked})} className="w-5 h-5 rounded"/>
                                            <div>
                                                <span className="font-bold text-pink-900 flex items-center gap-2"><Heart size={18} className="text-pink-500"/> Help Us Pick a Name!</span>
                                                <span className="text-xs text-pink-700 block">Add names you're considering and let guests vote</span>
                                            </div>
                                        </label>
                                        {setupData.enableNamePoll && (
                                            <div className="space-y-3">
                                                <div className="flex gap-2">
                                                    <input type="text" value={newNameOption} onChange={e => setNewNameOption(e.target.value)} onKeyPress={e => e.key === 'Enter' && addNameOption()} placeholder="Add a name..." className="flex-1 p-3 rounded-xl border border-pink-200 bg-white"/>
                                                    <button onClick={addNameOption} className="bg-pink-500 text-white px-4 rounded-xl font-bold hover:bg-pink-600">Add</button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {setupData.nameOptions.map((name, i) => (
                                                        <span key={i} className="bg-white px-3 py-1 rounded-full text-sm font-medium text-pink-800 border border-pink-200 flex items-center gap-2">
                                                            {name}
                                                            <button onClick={() => removeNameOption(i)} className="text-pink-400 hover:text-pink-600"><X size={14}/></button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Registry & Links */}
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-slate-700 flex items-center gap-2"><Gift size={18}/> Helpful Links for Guests</h4>
                                        
                                        <div>
                                            <label className="font-bold text-slate-700 block mb-2">Baby Registry</label>
                                            <input type="text" value={setupData.registryLink} onChange={e => setSetupData({...setupData, registryLink: e.target.value})} className={`w-full p-4 rounded-xl border transition ${hasValue(setupData.registryLink) ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'} outline-none`} placeholder="https://amazon.com/registry/..."/>
                                        </div>

                                        <div>
                                            <label className="font-bold text-slate-700 block mb-2">Diaper Fund / Cash Gift</label>
                                            <input type="text" value={setupData.diaperFundLink} onChange={e => setSetupData({...setupData, diaperFundLink: e.target.value})} className={`w-full p-4 rounded-xl border transition ${hasValue(setupData.diaperFundLink) ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'} outline-none`} placeholder="Venmo, PayPal, or CashApp link"/>
                                        </div>

                                        {setupData.additionalLinks.map((link, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl">
                                                <Link2 size={16} className="text-slate-400"/>
                                                <span className="font-medium text-sm flex-1">{link.label}</span>
                                                <button onClick={() => removeAdditionalLink(i)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                                            </div>
                                        ))}

                                        <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                                            <p className="text-sm font-medium text-slate-600 mb-2">+ Add Another Link</p>
                                            <div className="flex gap-2 mb-2">
                                                <input type="text" value={newLinkLabel} onChange={e => setNewLinkLabel(e.target.value)} placeholder="Label" className="flex-1 p-2 rounded-lg border border-slate-200 text-sm"/>
                                                <input type="text" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} placeholder="https://..." className="flex-1 p-2 rounded-lg border border-slate-200 text-sm"/>
                                            </div>
                                            <button onClick={addAdditionalLink} disabled={!newLinkLabel.trim() || !newLinkUrl.trim()} className="w-full bg-slate-200 text-slate-600 font-medium py-2 rounded-lg text-sm hover:bg-slate-300 disabled:opacity-50">Add Link</button>
                                        </div>

                                        {!setupData.registryLink && (
                                            <div className="bg-gradient-to-r from-orange-100 to-amber-100 p-5 rounded-xl border-2 border-orange-200">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0">🎁</div>
                                                    <div>
                                                        <p className="font-bold text-orange-900 mb-1">Don't have a registry yet?</p>
                                                        <p className="text-sm text-orange-800 mb-2">Amazon gives you a FREE {AMAZON_CONFIG[country]?.welcomeBoxValue} Welcome Box!</p>
                                                        <a href={AMAZON_CONFIG[country]?.link} target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-orange-600 font-bold text-sm hover:underline">
                                                            Create Free Registry <ExternalLink size={14}/>
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <p className="text-xs text-slate-400 mb-4 text-center">By creating a pool, you agree to our Terms. We may earn a commission from affiliate links.</p>
                                        <button onClick={handleCreate} disabled={isCreating} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 flex justify-center gap-2 text-lg">
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
                        
                        <div className="relative mx-auto max-w-[360px] rounded-[2.5rem] border-8 border-slate-900 bg-slate-900 shadow-2xl overflow-hidden">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-slate-900 rounded-b-xl z-20"></div>
                            
                            <div className={`h-[650px] w-full bg-white overflow-y-auto no-scrollbar ${previewTheme.bg} relative`}>
                                <div className={`${previewTheme.primary} pt-12 pb-8 px-6 text-center text-white relative rounded-b-[2rem] shadow-sm`}>
                                    <div className="text-4xl mb-2">{previewTheme.illustration}</div>
                                    <h2 className="text-2xl font-black font-serif leading-tight mb-1">{setupData.babyName || "Baby Name"}</h2>
                                    {setupData.parentNames && <p className="text-xs font-medium opacity-90 mb-3">Celebrating {setupData.parentNames}</p>}
                                    {setupData.isMultiples && <span className="inline-block bg-white/20 px-2 py-0.5 rounded-full text-xs mb-2">{'👶'.repeat(setupData.multiplesCount)} Twins!</span>}
                                    {!setupData.dueDateUnknown && setupData.dueDate && <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold"><Calendar size={12}/> Due: {setupData.dueDate}</div>}
                                </div>

                                <div className="p-4 space-y-4">
                                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-slate-600">🎯 12 of {setupData.targetGuessCount} guesses</span>
                                            <span className="text-xs text-slate-400">{Math.round((12/setupData.targetGuessCount)*100)}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${previewTheme.primary} rounded-full`} style={{width: `${Math.min(100, (12/setupData.targetGuessCount)*100)}%`}}></div>
                                        </div>
                                    </div>

                                    {setupData.prizeDescription && (
                                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-center">
                                            <Trophy className="mx-auto text-amber-500 mb-1" size={20}/>
                                            <p className="text-xs font-bold text-amber-800">🏆 Prize: {setupData.prizeDescription}</p>
                                        </div>
                                    )}

                                    {!setupData.dueDateUnknown && (
                                        <div className={`p-3 rounded-xl ${previewTheme.secondary} border ${previewTheme.border} text-center`}>
                                            <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Baby Arrives In</p>
                                            <div className="flex justify-center gap-2">
                                                {['23', '14', '32', '05'].map((n, i) => <div key={i} className="bg-white/50 px-2 py-1 rounded text-sm font-black">{n}</div>)}
                                            </div>
                                        </div>
                                    )}

                                    {setupData.enableNamePoll && setupData.nameOptions.length > 0 && (
                                        <div className="bg-pink-50 p-3 rounded-xl border border-pink-200">
                                            <p className="text-xs font-bold text-pink-800 mb-2">💕 Vote for a Name!</p>
                                            {setupData.nameOptions.slice(0, 3).map((name, i) => (
                                                <div key={i} className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full border-2 border-pink-300"></div><span className="text-xs text-pink-700">{name}</span></div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3 opacity-80">
                                        <div className="h-8 bg-slate-100 rounded-lg w-full"></div>
                                        <div className="flex gap-2">
                                            {!setupData.dueDateUnknown && <div className="h-8 bg-slate-100 rounded-lg flex-1"></div>}
                                            {setupData.includeFields.time && <div className="h-8 bg-slate-100 rounded-lg flex-1"></div>}
                                        </div>
                                        {setupData.includeFields.weight && <div className="h-8 bg-slate-100 rounded-lg w-full flex items-center justify-center text-xs text-slate-400">{setupData.unitSystem === 'metric' ? 'kg / g' : 'lbs / oz'}</div>}
                                        {setupData.includeFields.gender && (
                                            <div className="flex gap-2">
                                                <div className="h-8 bg-blue-50 rounded-lg flex-1 flex items-center justify-center text-xs text-blue-400">💙 Boy</div>
                                                <div className="h-8 bg-pink-50 rounded-lg flex-1 flex items-center justify-center text-xs text-pink-400">💗 Girl</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className={`text-xs font-bold uppercase tracking-wider ${previewTheme.text}`}>Recent Guesses</h4>
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="bg-white/60 p-3 rounded-xl border border-white/50 flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full ${previewTheme.secondary} flex items-center justify-center text-xs font-bold ${previewTheme.accent}`}>{String.fromCharCode(64+i)}</div>
                                                <div className="flex-1 space-y-1"><div className="h-3 w-20 bg-slate-200 rounded-full"></div><div className="h-2 w-12 bg-slate-100 rounded-full"></div></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

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