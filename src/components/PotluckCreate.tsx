
import React, { useState, useEffect } from 'react';
import { Calendar, ChefHat, Plus, Trash2, ArrowRight, Loader2, List, Settings, Palette, PlusCircle, X, MapPin, Clock, HelpCircle, AlertCircle, Minus, Infinity, Lock, Unlock } from 'lucide-react';
import { createPotluck } from '../services/potluckService';
import type { PotluckCategory, PotluckItemRequest, PotluckTheme } from '../types';
import { trackEvent } from '../services/analyticsService';

const DEFAULT_CATEGORIES: PotluckCategory[] = [
    { id: 'appetizers', name: 'Appetizers', limit: 0, requestedItems: [] },
    { id: 'mains', name: 'Main Dishes', limit: 0, requestedItems: [] },
    { id: 'sides', name: 'Sides', limit: 0, requestedItems: [] },
    { id: 'desserts', name: 'Desserts', limit: 0, requestedItems: [] },
    { id: 'drinks', name: 'Drinks', limit: 0, requestedItems: [] },
    { id: 'cutlery', name: 'Utensils & Napkins', limit: 0, requestedItems: [] },
];

const THEMES: { id: PotluckTheme; name: string; color: string; border: string; bg: string; pattern?: string }[] = [
    { id: 'classic', name: 'Classic Warmth', color: 'text-orange-900', border: 'border-orange-500', bg: 'bg-orange-50' },
    { id: 'thanksgiving', name: 'Thanksgiving', color: 'text-amber-900', border: 'border-amber-600', bg: 'bg-amber-50', pattern: 'radial-gradient(circle, #fcd34d 1px, transparent 1px) 0 0/20px 20px' },
    { id: 'christmas', name: 'Christmas', color: 'text-red-900', border: 'border-red-600', bg: 'bg-red-50', pattern: 'repeating-linear-gradient(45deg, #fee2e2 0, #fee2e2 10px, #fef2f2 10px, #fef2f2 20px)' },
    { id: 'picnic', name: 'Summer Picnic', color: 'text-emerald-900', border: 'border-emerald-500', bg: 'bg-emerald-50', pattern: 'conic-gradient(#dcfce7 90deg, transparent 0 180deg, #dcfce7 0 270deg, transparent 0) 0 0/40px 40px' },
    { id: 'corporate', name: 'Corporate/Office', color: 'text-slate-900', border: 'border-slate-500', bg: 'bg-slate-50' },
    { id: 'fiesta', name: 'Fiesta Party', color: 'text-pink-900', border: 'border-pink-500', bg: 'bg-pink-50', pattern: 'linear-gradient(135deg, #fbcfe8 25%, transparent 25%) -10px 0/20px 20px, linear-gradient(225deg, #fbcfe8 25%, transparent 25%) -10px 0/20px 20px, linear-gradient(315deg, #fbcfe8 25%, transparent 25%) 0 0/20px 20px, linear-gradient(45deg, #fbcfe8 25%, transparent 25%) 0 0/20px 20px' },
    { id: 'minimal', name: 'Modern Minimal', color: 'text-gray-900', border: 'border-gray-800', bg: 'bg-white' },
    { id: 'bbq', name: 'BBQ / Cookout', color: 'text-red-800', border: 'border-red-700', bg: 'bg-red-50', pattern: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #fee2e2 19px, #fee2e2 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #fee2e2 19px, #fee2e2 20px)' }, // Gingham
    { id: 'spooky', name: 'Spooky / Halloween', color: 'text-purple-900', border: 'border-purple-800', bg: 'bg-slate-100', pattern: 'repeating-linear-gradient(45deg, #e2e8f0 0, #e2e8f0 10px, #f1f5f9 10px, #f1f5f9 20px)' },
    { id: 'baby', name: 'Baby Shower', color: 'text-sky-700', border: 'border-sky-400', bg: 'bg-sky-50', pattern: 'radial-gradient(#e0f2fe 15%, transparent 16%) 0 0/20px 20px' },
];

const CARD_COLORS = [
    'bg-orange-50 border-orange-200',
    'bg-blue-50 border-blue-200',
    'bg-emerald-50 border-emerald-200',
    'bg-purple-50 border-purple-200',
    'bg-rose-50 border-rose-200',
    'bg-amber-50 border-amber-200',
    'bg-cyan-50 border-cyan-200',
    'bg-indigo-50 border-indigo-200',
];

const PotluckCreate: React.FC = () => {
    const [step, setStep] = useState(1);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        hostName: '',
        date: '',
        time: '',
        location: '',
        description: '',
        dietaryNotes: '',
        theme: 'classic' as PotluckTheme,
        categories: DEFAULT_CATEGORIES,
        allowGuestEditing: true,
        editLockDays: 1
    });

    const [newItemText, setNewItemText] = useState<{ [key: string]: string }>({});

    const handleCreate = async () => {
        setIsCreating(true);
        try {
            const result = await createPotluck(formData);
            trackEvent('potluck_created', { 
                category_count: formData.categories.length,
                theme: formData.theme,
                guest_editing: formData.allowGuestEditing
            });
            window.location.hash = `id=${result.publicId}&admin=${result.adminKey}`;
        } catch (error) {
            console.error(error);
            setError("Failed to create event. Please try again.");
            setIsCreating(false);
        }
    };

    const validateStep1 = () => {
        if (!formData.title.trim()) { setError("Please enter an Event Name."); return false; }
        if (!formData.hostName.trim()) { setError("Please enter a Host Name."); return false; }
        if (!formData.date) { setError("Please select a Date."); return false; }
        setError(null);
        return true;
    };

    const updateCategory = (index: number, field: keyof PotluckCategory, value: string | number) => {
        const newCats = [...formData.categories];
        newCats[index] = { ...newCats[index], [field]: value };
        setFormData({ ...formData, categories: newCats });
    };

    const removeCategory = (index: number) => {
        const newCats = formData.categories.filter((_, i) => i !== index);
        setFormData({ ...formData, categories: newCats });
    };

    const addCategory = () => {
        setFormData({
            ...formData,
            categories: [...formData.categories, { id: crypto.randomUUID(), name: '', limit: 0, requestedItems: [] }]
        });
    };

    const addRequestedItem = (catIndex: number) => {
        const catId = formData.categories[catIndex].id;
        const text = newItemText[catId];
        if (!text || !text.trim()) return;

        const newCats = [...formData.categories];
        const currentReqs = newCats[catIndex].requestedItems || [];
        newCats[catIndex] = {
            ...newCats[catIndex],
            requestedItems: [...currentReqs, { id: crypto.randomUUID(), name: text.trim() }]
        };
        
        setFormData({ ...formData, categories: newCats });
        setNewItemText({ ...newItemText, [catId]: '' });
    };

    const removeRequestedItem = (catIndex: number, reqId: string) => {
        const newCats = [...formData.categories];
        newCats[catIndex] = {
            ...newCats[catIndex],
            requestedItems: (newCats[catIndex].requestedItems || []).filter(r => r.id !== reqId)
        };
        setFormData({ ...formData, categories: newCats });
    };

    const activeTheme = THEMES.find(t => t.id === formData.theme) || THEMES[0];

    // Helper for tabs - Now non-interactive buttons
    const TabIndicator = ({ num, label }: { num: number, label: string }) => (
        <div className={`flex-1 py-4 text-center text-sm font-bold relative transition-colors ${step === num ? 'text-slate-900 bg-white' : 'text-slate-400 bg-slate-50'}`}>
            <span className={`mr-2 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${step === num ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>{num}</span>
            {label}
            {step === num && <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500"></div>}
        </div>
    );

    return (
        <div 
            className={`min-h-screen -mt-20 pt-20 ${activeTheme.bg}`}
            style={{ 
                backgroundImage: activeTheme.pattern ? activeTheme.pattern : undefined,
                backgroundBlendMode: 'multiply' 
            }}
        >
            <div className="max-w-4xl mx-auto p-4 md:p-8">
                <div className="text-center mb-8 relative z-10">
                    <h1 className={`text-4xl md:text-6xl font-black font-serif mb-3 ${activeTheme.color} drop-shadow-sm bg-white/60 backdrop-blur-sm rounded-xl py-2 px-6 inline-block`}>
                        Potluck Planner
                    </h1>
                    <p className={`${activeTheme.color} text-lg opacity-90 font-medium bg-white/60 backdrop-blur-sm rounded-lg py-1 px-4 inline-block mt-2`}>
                        Create a beautiful, free sign-up sheet for your feast.
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 relative z-10">
                    
                    {/* TABS (Visual Only) */}
                    <div className="flex border-b border-slate-200">
                        <TabIndicator num={1} label="Details" />
                        <TabIndicator num={2} label="Theme & Settings" />
                        <TabIndicator num={3} label="Menu" />
                    </div>

                    <div className="p-6 md:p-10 min-h-[400px]">
                        
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded flex items-center gap-2">
                                <AlertCircle size={20} /> {error}
                            </div>
                        )}

                        {/* STEP 1: DETAILS */}
                        {step === 1 && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Event Name *</label>
                                    <input 
                                        type="text" 
                                        className={`w-full p-4 text-xl font-bold border-2 rounded-xl outline-none transition ${activeTheme.bg} border-slate-200 focus:border-slate-400`}
                                        placeholder="e.g. Friendsgiving 2025"
                                        value={formData.title}
                                        onChange={e => setFormData({...formData, title: e.target.value})}
                                        autoFocus
                                    />
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Host Name *</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none transition focus:border-slate-400"
                                            placeholder="Your Name"
                                            value={formData.hostName}
                                            onChange={e => setFormData({...formData, hostName: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Date *</label>
                                        <input 
                                            type="date" 
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none transition focus:border-slate-400"
                                            value={formData.date}
                                            onChange={e => setFormData({...formData, date: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Time (Optional)</label>
                                        <div className="relative">
                                            <Clock size={18} className="absolute left-3 top-3.5 text-slate-400" />
                                            <input 
                                                type="text" 
                                                className="w-full p-3 pl-10 border-2 border-slate-200 rounded-xl outline-none transition focus:border-slate-400"
                                                placeholder="e.g. 6:00 PM"
                                                value={formData.time}
                                                onChange={e => setFormData({...formData, time: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Location (Optional)</label>
                                        <div className="relative">
                                            <MapPin size={18} className="absolute left-3 top-3.5 text-slate-400" />
                                            <input 
                                                type="text" 
                                                className="w-full p-3 pl-10 border-2 border-slate-200 rounded-xl outline-none transition focus:border-slate-400"
                                                placeholder="e.g. 123 Main St"
                                                value={formData.location}
                                                onChange={e => setFormData({...formData, location: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Welcome Message (Optional)</label>
                                    <textarea 
                                        className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none transition focus:border-slate-400 h-24 resize-none"
                                        placeholder="e.g. Bring your favorite dish! We have an oven for heating."
                                        value={formData.description}
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                    />
                                </div>
                                
                                <div className="flex justify-end pt-4">
                                    <button 
                                        onClick={() => validateStep1() && setStep(2)}
                                        className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                                    >
                                        Next Step <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: THEME & SETTINGS */}
                        {step === 2 && (
                            <div className="space-y-8 animate-fade-in">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <Palette size={20} /> Choose a Theme
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {THEMES.map(theme => (
                                            <button
                                                key={theme.id}
                                                onClick={() => setFormData({...formData, theme: theme.id})}
                                                className={`relative overflow-hidden p-1 rounded-xl transition-all text-left group h-24 flex flex-col ${formData.theme === theme.id ? 'ring-2 ring-offset-2 ring-red-500 shadow-md' : 'hover:opacity-90 hover:shadow-sm'}`}
                                            >
                                                <div 
                                                    className={`absolute inset-0 ${theme.bg}`} 
                                                    style={{ 
                                                        backgroundImage: theme.pattern, 
                                                        backgroundBlendMode: 'multiply' 
                                                    }}
                                                ></div>
                                                <div className="relative z-10 flex items-center justify-center h-full">
                                                    <span className={`bg-white/90 px-3 py-1 rounded-md text-xs font-bold shadow-sm ${theme.color}`}>{theme.name}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                                    <label className="block text-lg font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <AlertCircle size={20} className="text-amber-500" /> Dietary Restrictions & Notes
                                    </label>
                                    <input 
                                        type="text" 
                                        className="w-full p-4 border-2 border-slate-200 rounded-xl outline-none transition focus:border-slate-400 bg-white"
                                        placeholder="e.g. Please no peanuts due to allergies."
                                        value={formData.dietaryNotes}
                                        onChange={e => setFormData({...formData, dietaryNotes: e.target.value})}
                                    />
                                </div>
                                
                                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <Settings size={20} /> Guest Controls
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-sm text-slate-700">Allow Guest Editing</div>
                                                <div className="text-xs text-slate-500">Guests can delete/edit their own dishes after adding.</div>
                                            </div>
                                            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                                <input 
                                                    type="checkbox" 
                                                    name="toggle" 
                                                    id="toggle" 
                                                    checked={formData.allowGuestEditing}
                                                    onChange={(e) => setFormData({...formData, allowGuestEditing: e.target.checked})}
                                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                />
                                                <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${formData.allowGuestEditing ? 'bg-green-500' : 'bg-gray-300'}`}></label>
                                            </div>
                                        </div>
                                        
                                        {formData.allowGuestEditing && (
                                            <div className="pt-2 border-t border-slate-200">
                                                <label className="block text-sm font-bold text-slate-700 mb-1">
                                                    Lock editing before event?
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <select 
                                                        value={formData.editLockDays} 
                                                        onChange={(e) => setFormData({...formData, editLockDays: parseInt(e.target.value)})}
                                                        className="p-2 border border-slate-300 rounded-lg text-sm bg-white"
                                                    >
                                                        <option value={0}>Never lock (Always editable)</option>
                                                        <option value={1}>1 day before event</option>
                                                        <option value={2}>2 days before event</option>
                                                        <option value={7}>1 week before event</option>
                                                    </select>
                                                    <span className="text-xs text-slate-500">
                                                        {formData.editLockDays === 0 ? <Unlock size={14}/> : <Lock size={14}/>}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <style>{`
                                        .toggle-checkbox:checked { right: 0; border-color: #22c55e; }
                                        .toggle-checkbox { right: auto; left: 0; border-color: #d1d5db; transition: all 0.3s; }
                                    `}</style>
                                </div>

                                <div className="flex justify-between pt-4">
                                    <button onClick={() => setStep(1)} className="text-slate-500 font-bold hover:text-slate-800 px-4">Back</button>
                                    <button 
                                        onClick={() => setStep(3)}
                                        className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                                    >
                                        Next: Build Menu <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: MENU */}
                        {step === 3 && (
                            <div className="space-y-8 animate-fade-in">
                                
                                {/* Educational Helper Box */}
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg flex items-start gap-3">
                                    <HelpCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0"/> 
                                    <div>
                                        <h3 className="font-bold text-blue-900 text-sm">Quick Tips</h3>
                                        <ul className="text-xs text-blue-800 space-y-1 mt-1 list-disc list-inside">
                                            <li>Use <strong>Limits</strong> (e.g. max 3 desserts) to prevent too much of one thing.</li>
                                            <li>Add <strong>Requests</strong> (e.g. "Turkey") if you need specific items.</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="grid gap-6">
                                    {formData.categories.map((cat, i) => {
                                        const cardColorClass = CARD_COLORS[i % CARD_COLORS.length];
                                        
                                        return (
                                            <div key={i} className={`p-4 rounded-xl border-2 transition-all ${cardColorClass}`}>
                                                {/* Header Line */}
                                                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-4">
                                                    <div className="flex-1 w-full sm:w-auto">
                                                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-60 block mb-1">Category Name</label>
                                                        <input 
                                                            type="text" 
                                                            value={cat.name}
                                                            onChange={(e) => updateCategory(i, 'name', e.target.value)}
                                                            className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-blue-200 outline-none"
                                                            placeholder="e.g. Appetizers"
                                                        />
                                                    </div>
                                                    
                                                    <div className="w-full sm:w-auto flex items-end gap-2">
                                                        <div className="flex-1 sm:flex-none">
                                                            <label className="text-[10px] font-bold uppercase tracking-wider opacity-60 block mb-1">
                                                                Limit (0 = ∞)
                                                            </label>
                                                            <div className="flex items-center bg-white rounded-lg border border-slate-300 h-[42px]">
                                                                <button 
                                                                    onClick={() => updateCategory(i, 'limit', Math.max(0, (cat.limit || 0) - 1))}
                                                                    className="px-3 text-slate-500 hover:bg-slate-100 h-full rounded-l-lg"
                                                                >
                                                                    <Minus size={14} />
                                                                </button>
                                                                <input 
                                                                    type="number" 
                                                                    min="0"
                                                                    value={cat.limit || 0}
                                                                    onChange={(e) => updateCategory(i, 'limit', parseInt(e.target.value) || 0)}
                                                                    className="w-12 text-center font-bold text-slate-800 outline-none"
                                                                />
                                                                <button 
                                                                    onClick={() => updateCategory(i, 'limit', (cat.limit || 0) + 1)}
                                                                    className="px-3 text-slate-500 hover:bg-slate-100 h-full rounded-r-lg"
                                                                >
                                                                    <Plus size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        
                                                        <button 
                                                            onClick={() => removeCategory(i)} 
                                                            className="h-[42px] w-[42px] flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                                            title="Remove Category"
                                                        >
                                                            <Trash2 size={18}/>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Requests Section */}
                                                <div className="bg-white/60 p-3 rounded-lg border border-black/5">
                                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Specific Requests (Optional)</p>
                                                    
                                                    {cat.requestedItems && cat.requestedItems.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {cat.requestedItems.map((req) => (
                                                                <div key={req.id} className="flex items-center gap-1.5 text-sm font-medium bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm text-slate-700">
                                                                    <span>{req.name}</span>
                                                                    <button 
                                                                        onClick={() => removeRequestedItem(i, req.id)}
                                                                        className="text-slate-400 hover:text-red-500 transition-colors ml-1"
                                                                    >
                                                                        <X size={14}/>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            value={newItemText[cat.id] || ''}
                                                            onChange={(e) => setNewItemText({ ...newItemText, [cat.id]: e.target.value })}
                                                            onKeyDown={(e) => e.key === 'Enter' && addRequestedItem(i)}
                                                            className="flex-1 p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-400"
                                                            placeholder={`e.g. ${cat.name === 'Desserts' ? 'Pumpkin Pie' : 'Chips'}`}
                                                        />
                                                        <button 
                                                            onClick={() => addRequestedItem(i)} 
                                                            className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition-colors"
                                                        >
                                                            Add Item
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                <button 
                                    onClick={addCategory} 
                                    className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl font-bold text-slate-500 hover:border-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <PlusCircle size={20}/> Add New Category
                                </button>

                                <div className="flex gap-3 pt-6 border-t border-slate-100">
                                    <button onClick={() => setStep(2)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Back</button>
                                    <button 
                                        onClick={handleCreate}
                                        disabled={isCreating}
                                        className="flex-1 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:opacity-90 bg-green-600 shadow-green-200"
                                    >
                                        {isCreating ? <Loader2 className="animate-spin"/> : <List />} Create Potluck Sheet
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PotluckCreate;
