
import React, { useState } from 'react';
import { Calendar, ChefHat, Plus, Trash2, ArrowRight, Loader2, List, Settings, Palette, PlusCircle, X, MapPin, Clock, HelpCircle, AlertCircle, Minus, Infinity } from 'lucide-react';
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
    { id: 'thanksgiving', name: 'Thanksgiving', color: 'text-amber-900', border: 'border-amber-600', bg: 'bg-amber-50', pattern: 'radial-gradient(circle, #fef3c7 1px, transparent 1px) 0 0/10px 10px' },
    { id: 'christmas', name: 'Christmas', color: 'text-red-900', border: 'border-red-600', bg: 'bg-red-50', pattern: 'repeating-linear-gradient(45deg, #fecaca 0, #fecaca 1px, transparent 0, transparent 50%) 0 0/10px 10px' },
    { id: 'picnic', name: 'Summer Picnic', color: 'text-emerald-900', border: 'border-emerald-500', bg: 'bg-emerald-50', pattern: 'conic-gradient(#dcfce7 90deg, transparent 0 180deg, #dcfce7 0 270deg, transparent 0) 0 0/20px 20px' },
    { id: 'corporate', name: 'Corporate/Office', color: 'text-slate-900', border: 'border-slate-500', bg: 'bg-slate-50' },
    { id: 'fiesta', name: 'Fiesta Party', color: 'text-pink-900', border: 'border-pink-500', bg: 'bg-pink-50', pattern: 'linear-gradient(135deg, #fbcfe8 25%, transparent 25%) -10px 0/20px 20px, linear-gradient(225deg, #fbcfe8 25%, transparent 25%) -10px 0/20px 20px, linear-gradient(315deg, #fbcfe8 25%, transparent 25%) 0 0/20px 20px, linear-gradient(45deg, #fbcfe8 25%, transparent 25%) 0 0/20px 20px' },
    { id: 'minimal', name: 'Modern Minimal', color: 'text-gray-900', border: 'border-gray-800', bg: 'bg-white' },
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
    const [formData, setFormData] = useState({
        title: '',
        hostName: '',
        date: '',
        time: '',
        location: '',
        description: '',
        dietaryNotes: '',
        theme: 'classic' as PotluckTheme,
        categories: DEFAULT_CATEGORIES
    });

    const [newItemText, setNewItemText] = useState<{ [key: string]: string }>({});

    const handleCreate = async () => {
        if (!formData.title || !formData.date || !formData.hostName) {
            alert("Please fill in all required fields (Event Name, Host Name, Date).");
            setStep(1);
            return;
        }
        setIsCreating(true);
        try {
            const result = await createPotluck(formData);
            trackEvent('potluck_created', { 
                category_count: formData.categories.length,
                theme: formData.theme
            });
            window.location.hash = `id=${result.publicId}&admin=${result.adminKey}`;
        } catch (error) {
            console.error(error);
            alert("Failed to create event. Please try again.");
            setIsCreating(false);
        }
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

    // Specific Item Requests Logic
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

    // Helper for tabs
    const TabButton = ({ num, label }: { num: number, label: string }) => (
        <button
            onClick={() => setStep(num)}
            className={`flex-1 py-3 text-center text-sm font-bold rounded-t-xl transition-all border-b-2 ${
                step === num 
                ? 'bg-white ' + activeTheme.color + ' ' + activeTheme.border.replace('border', 'border-b-4') 
                : 'bg-transparent opacity-60 hover:opacity-80 border-transparent'
            }`}
        >
            <span className="mr-2 text-xs opacity-70">{num}.</span>{label}
        </button>
    );

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="text-center mb-8">
                <h1 className={`text-4xl md:text-5xl font-black font-serif mb-2 ${activeTheme.color}`}>Potluck Planner</h1>
                <p className={`${activeTheme.color} opacity-80 text-lg`}>Create a beautiful, free sign-up sheet for your feast.</p>
            </div>

            <div className={`bg-white rounded-3xl shadow-xl border-2 ${activeTheme.border.replace('border', 'border-opacity-20')} overflow-hidden`}>
                
                {/* TABS */}
                <div className={`${activeTheme.bg} flex px-4 pt-4 gap-2 border-b ${activeTheme.border.replace('border', 'border-opacity-10')}`}>
                    <TabButton num={1} label="Details" />
                    <TabButton num={2} label="Theme & Diet" />
                    <TabButton num={3} label="Menu" />
                </div>

                <div className="p-6 md:p-8 min-h-[400px]">
                    
                    {/* STEP 1: DETAILS */}
                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Event Name *</label>
                                <input 
                                    type="text" 
                                    className={`w-full p-4 text-lg font-bold border-2 rounded-xl outline-none transition ${activeTheme.bg} ${activeTheme.border.replace('border', 'focus:border')}`}
                                    placeholder="e.g. Friendsgiving 2025"
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    autoFocus
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Host Name *</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-3 border-2 border-slate-100 rounded-xl outline-none transition focus:border-slate-400"
                                        placeholder="Your Name"
                                        value={formData.hostName}
                                        onChange={e => setFormData({...formData, hostName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Date *</label>
                                    <input 
                                        type="date" 
                                        className="w-full p-3 border-2 border-slate-100 rounded-xl outline-none transition focus:border-slate-400"
                                        value={formData.date}
                                        onChange={e => setFormData({...formData, date: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Time (Optional)</label>
                                    <div className="relative">
                                        <Clock size={16} className="absolute left-3 top-3.5 text-slate-400" />
                                        <input 
                                            type="text" 
                                            className="w-full p-3 pl-10 border-2 border-slate-100 rounded-xl outline-none transition focus:border-slate-400"
                                            placeholder="e.g. 6:00 PM"
                                            value={formData.time}
                                            onChange={e => setFormData({...formData, time: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Location / Address (Optional)</label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-3 top-3.5 text-slate-400" />
                                        <input 
                                            type="text" 
                                            className="w-full p-3 pl-10 border-2 border-slate-100 rounded-xl outline-none transition focus:border-slate-400"
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
                                    className="w-full p-3 border-2 border-slate-100 rounded-xl outline-none transition focus:border-slate-400 h-24 resize-none"
                                    placeholder="e.g. Bring your favorite dish! We have an oven for heating."
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                            
                            <div className="flex justify-end pt-4">
                                <button 
                                    onClick={() => setStep(2)}
                                    className={`px-8 py-3 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg ${activeTheme.id === 'minimal' || activeTheme.id === 'corporate' ? 'bg-slate-800' : activeTheme.border.replace('border-', 'bg-').replace('500', '600')}`}
                                >
                                    Next Step <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: CUSTOMIZATION */}
                    {step === 2 && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <label className="block text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <Palette size={20} /> Choose a Theme
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {THEMES.map(theme => (
                                        <button
                                            key={theme.id}
                                            onClick={() => setFormData({...formData, theme: theme.id})}
                                            className={`relative overflow-hidden p-4 rounded-xl border-2 text-sm font-bold transition-all text-left group ${formData.theme === theme.id ? theme.border + ' ring-2 ring-offset-2 ring-slate-200' : 'border-slate-100 hover:border-slate-300'}`}
                                        >
                                            <div 
                                                className={`absolute inset-0 opacity-20 ${theme.bg}`} 
                                                style={{ background: theme.pattern ? `${theme.pattern}, ${theme.id === 'classic' ? '#fff7ed' : theme.id === 'picnic' ? '#f0fdf4' : theme.id === 'fiesta' ? '#fef2f2' : theme.id === 'thanksgiving' ? '#fffbeb' : theme.id === 'christmas' ? '#fef2f2' : '#f8fafc'}` : undefined }}
                                            ></div>
                                            <div className="relative z-10 flex flex-col h-full justify-between gap-2">
                                                <div className={`w-8 h-8 rounded-full ${theme.bg} border-2 ${theme.border} flex items-center justify-center`}>
                                                    {formData.theme === theme.id && <div className={`w-3 h-3 rounded-full ${theme.border.replace('border-', 'bg-').replace('500', '600')}`}></div>}
                                                </div>
                                                <span className={`${theme.color}`}>{theme.name}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                                <label className="block text-lg font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <AlertCircle size={20} className="text-amber-500" /> Dietary Restrictions & Notes
                                </label>
                                <p className="text-sm text-slate-500 mb-3">
                                    Any global rules for the event? (e.g. "Nut-Free Facility", "Vegetarian Only", "Oven not available")
                                </p>
                                <input 
                                    type="text" 
                                    className="w-full p-4 border-2 border-slate-200 rounded-xl outline-none transition focus:border-slate-400 bg-white"
                                    placeholder="e.g. Please no peanuts due to allergies."
                                    value={formData.dietaryNotes}
                                    onChange={e => setFormData({...formData, dietaryNotes: e.target.value})}
                                />
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(1)} className="text-slate-500 font-bold hover:text-slate-800 px-4">Back</button>
                                <button 
                                    onClick={() => setStep(3)}
                                    className={`px-8 py-3 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg ${activeTheme.id === 'minimal' || activeTheme.id === 'corporate' ? 'bg-slate-800' : activeTheme.border.replace('border-', 'bg-').replace('500', '600')}`}
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
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-1">
                                    <HelpCircle size={18}/> How to build your menu
                                </h3>
                                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                    <li><strong>Categories:</strong> Broad groups like 'Mains' or 'Desserts'.</li>
                                    <li><strong>Limits:</strong> Set a max number if you don't want 20 desserts (0 = Unlimited).</li>
                                    <li><strong>Requests:</strong> Add specific items (e.g. 'Turkey') if you need them.</li>
                                </ul>
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
                                    className={`flex-1 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:opacity-90 ${formData.theme === 'classic' ? 'bg-green-600 shadow-green-200' : 'bg-slate-900 shadow-slate-300'}`}
                                >
                                    {isCreating ? <Loader2 className="animate-spin"/> : <List />} Create Potluck Sheet
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PotluckCreate;
