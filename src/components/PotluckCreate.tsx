
import React, { useState } from 'react';
import { Calendar, ChefHat, Plus, Trash2, ArrowRight, Loader2, List, Settings, Palette, PlusCircle, X, MapPin, Clock } from 'lucide-react';
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

const THEMES: { id: PotluckTheme; name: string; color: string; border: string; bg: string }[] = [
    { id: 'classic', name: 'Classic Warmth', color: 'text-orange-900', border: 'border-orange-500', bg: 'bg-orange-50' },
    { id: 'picnic', name: 'Summer Picnic', color: 'text-emerald-900', border: 'border-emerald-500', bg: 'bg-emerald-50' },
    { id: 'corporate', name: 'Corporate/Office', color: 'text-slate-900', border: 'border-slate-500', bg: 'bg-slate-50' },
    { id: 'fiesta', name: 'Fiesta Party', color: 'text-red-900', border: 'border-red-500', bg: 'bg-red-50' },
    { id: 'minimal', name: 'Modern Minimal', color: 'text-gray-900', border: 'border-gray-800', bg: 'bg-white' },
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
            alert("Please fill in all required fields.");
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

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8">
            <div className="text-center mb-10">
                <h1 className={`text-4xl md:text-5xl font-black font-serif mb-4 ${activeTheme.color}`}>Potluck Planner</h1>
                <p className={`${activeTheme.color} opacity-80 text-lg`}>Create a beautiful, free sign-up sheet for your feast.</p>
            </div>

            <div className={`bg-white rounded-3xl shadow-xl border-2 ${activeTheme.border.replace('border', 'border-opacity-20')} overflow-hidden`}>
                <div className={`${activeTheme.bg} p-2 flex`}>
                    <div className={`flex-1 py-2 text-center text-sm font-bold rounded-xl transition-all ${step === 1 ? 'bg-white shadow-sm ' + activeTheme.color : 'opacity-60 ' + activeTheme.color}`}>1. Details & Theme</div>
                    <div className={`flex-1 py-2 text-center text-sm font-bold rounded-xl transition-all ${step === 2 ? 'bg-white shadow-sm ' + activeTheme.color : 'opacity-60 ' + activeTheme.color}`}>2. Menu & Requests</div>
                </div>

                <div className="p-6 md:p-10 min-h-[400px]">
                    {step === 1 ? (
                        <div className="space-y-6 animate-fade-in">
                            {/* Theme Selection */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                                {THEMES.map(theme => (
                                    <button
                                        key={theme.id}
                                        onClick={() => setFormData({...formData, theme: theme.id})}
                                        className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${formData.theme === theme.id ? theme.border + ' ' + theme.bg + ' ' + theme.color : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                    >
                                        <div className={`w-full h-6 rounded mb-2 ${theme.bg} border ${theme.border}`}></div>
                                        {theme.name}
                                    </button>
                                ))}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Event Name</label>
                                <input 
                                    type="text" 
                                    className={`w-full p-4 text-lg font-bold border-2 rounded-xl outline-none transition ${activeTheme.bg} ${activeTheme.border.replace('border', 'focus:border')}`}
                                    placeholder="e.g. Friendsgiving 2025"
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Host Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-3 border-2 border-slate-100 rounded-xl outline-none transition focus:border-slate-400"
                                        placeholder="Your Name"
                                        value={formData.hostName}
                                        onChange={e => setFormData({...formData, hostName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Date</label>
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
                                <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Important Restrictions / Notes</label>
                                <input 
                                    type="text" 
                                    className="w-full p-3 border-2 border-slate-100 rounded-xl outline-none transition focus:border-slate-400"
                                    placeholder="e.g. Nut-Free Facility, Vegan Only, Halal, etc."
                                    value={formData.dietaryNotes}
                                    onChange={e => setFormData({...formData, dietaryNotes: e.target.value})}
                                />
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
                            <button 
                                onClick={() => setStep(2)}
                                className={`w-full text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all mt-4 hover:opacity-90 ${formData.theme === 'classic' ? 'bg-orange-600' : formData.theme === 'picnic' ? 'bg-emerald-600' : formData.theme === 'fiesta' ? 'bg-red-600' : formData.theme === 'corporate' ? 'bg-slate-700' : 'bg-black'}`}
                            >
                                Next: Set The Menu <ArrowRight />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-fade-in">
                            <div className={`flex items-center gap-3 ${activeTheme.color} mb-4`}>
                                <ChefHat />
                                <div>
                                    <h2 className="text-xl font-bold font-serif">Menu Categories</h2>
                                    <p className="text-sm opacity-70">Add specific requests so people know what to bring.</p>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                {formData.categories.map((cat, i) => (
                                    <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <input 
                                                type="text" 
                                                value={cat.name}
                                                onChange={(e) => updateCategory(i, 'name', e.target.value)}
                                                className="flex-1 p-2 border border-slate-300 rounded-lg font-bold text-slate-800"
                                                placeholder="Category Name"
                                            />
                                            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-2" title="Limit number of dishes">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Limit:</span>
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    max="99"
                                                    value={cat.limit || ''}
                                                    onChange={(e) => updateCategory(i, 'limit', parseInt(e.target.value) || 0)}
                                                    className="w-8 bg-transparent text-center font-bold outline-none text-sm"
                                                    placeholder="∞"
                                                />
                                            </div>
                                            <button onClick={() => removeCategory(i)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"><Trash2 size={18}/></button>
                                        </div>

                                        {/* Specific Items Area */}
                                        <div className="pl-2 border-l-2 border-slate-200 ml-1">
                                            <div className="space-y-2 mb-2">
                                                {cat.requestedItems && cat.requestedItems.map((req) => (
                                                    <div key={req.id} className="flex items-center gap-2 text-sm text-slate-600 bg-white p-2 rounded border border-slate-100">
                                                        <span className="flex-1 font-medium">• {req.name}</span>
                                                        <button onClick={() => removeRequestedItem(i, req.id)}><X size={14} className="text-slate-400 hover:text-red-500"/></button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="text" 
                                                    value={newItemText[cat.id] || ''}
                                                    onChange={(e) => setNewItemText({ ...newItemText, [cat.id]: e.target.value })}
                                                    onKeyDown={(e) => e.key === 'Enter' && addRequestedItem(i)}
                                                    className="flex-1 p-2 text-sm border border-slate-200 rounded bg-white"
                                                    placeholder={`Ask for specific item (e.g. ${cat.name === 'Desserts' ? 'Apple Pie' : 'Chips'})...`}
                                                />
                                                <button onClick={() => addRequestedItem(i)} className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-2 rounded">Add</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <button onClick={addCategory} className={`font-bold text-sm flex items-center gap-1 hover:underline ${activeTheme.color}`}>
                                <PlusCircle size={16}/> Add New Category
                            </button>

                            <div className="flex gap-3 pt-6 border-t border-slate-100">
                                <button onClick={() => setStep(1)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Back</button>
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
