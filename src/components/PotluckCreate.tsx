
import React, { useState } from 'react';
import { Calendar, ChefHat, Plus, Trash2, ArrowRight, Loader2, List } from 'lucide-react';
import { createPotluck } from '../services/potluckService';
import type { PotluckCategory } from '../types';
import { trackEvent } from '../services/analyticsService';

const DEFAULT_CATEGORIES: PotluckCategory[] = [
    { id: 'appetizers', name: 'Appetizers', limit: 0 },
    { id: 'mains', name: 'Main Dishes', limit: 0 },
    { id: 'sides', name: 'Sides', limit: 0 },
    { id: 'desserts', name: 'Desserts', limit: 0 },
    { id: 'drinks', name: 'Drinks', limit: 0 },
    { id: 'cutlery', name: 'Utensils & Napkins', limit: 0 },
];

const PotluckCreate: React.FC = () => {
    const [step, setStep] = useState(1);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        hostName: '',
        date: '',
        description: '',
        categories: DEFAULT_CATEGORIES
    });

    const handleCreate = async () => {
        if (!formData.title || !formData.date || !formData.hostName) {
            alert("Please fill in all required fields.");
            return;
        }
        setIsCreating(true);
        try {
            const result = await createPotluck(formData);
            trackEvent('potluck_created', { category_count: formData.categories.length });
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
            categories: [...formData.categories, { id: crypto.randomUUID(), name: '', limit: 0 }]
        });
    };

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8">
            <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-black text-orange-900 font-serif mb-4">Potluck Planner</h1>
                <p className="text-orange-800/80 text-lg">Create a beautiful, free sign-up sheet for your feast.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-orange-100 overflow-hidden">
                <div className="bg-orange-100 p-2 flex">
                    <div className={`flex-1 py-2 text-center text-sm font-bold rounded-xl transition-all ${step === 1 ? 'bg-white text-orange-800 shadow-sm' : 'text-orange-400'}`}>1. Details</div>
                    <div className={`flex-1 py-2 text-center text-sm font-bold rounded-xl transition-all ${step === 2 ? 'bg-white text-orange-800 shadow-sm' : 'text-orange-400'}`}>2. Menu</div>
                </div>

                <div className="p-6 md:p-10 min-h-[400px]">
                    {step === 1 ? (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Event Name</label>
                                <input 
                                    type="text" 
                                    className="w-full p-4 text-lg font-bold border-2 border-orange-100 rounded-xl focus:border-orange-500 outline-none transition bg-orange-50/30"
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
                                        className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-orange-500 outline-none transition"
                                        placeholder="Your Name"
                                        value={formData.hostName}
                                        onChange={e => setFormData({...formData, hostName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-orange-500 outline-none transition"
                                        value={formData.date}
                                        onChange={e => setFormData({...formData, date: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Welcome Message / Notes (Optional)</label>
                                <textarea 
                                    className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-orange-500 outline-none transition h-24 resize-none"
                                    placeholder="e.g. Bring your favorite dish! We have an oven for heating."
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                            <button 
                                onClick={() => setStep(2)}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all mt-4"
                            >
                                Next: Set The Menu <ArrowRight />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center gap-3 text-orange-800 mb-4">
                                <ChefHat />
                                <h2 className="text-xl font-bold font-serif">Customize Categories</h2>
                            </div>
                            <p className="text-sm text-slate-500">Set limits to prevent 50 bags of chips (leave 0 for unlimited).</p>
                            
                            <div className="space-y-3">
                                {formData.categories.map((cat, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <input 
                                            type="text" 
                                            value={cat.name}
                                            onChange={(e) => updateCategory(i, 'name', e.target.value)}
                                            className="flex-1 p-3 border border-slate-200 rounded-lg font-medium"
                                            placeholder="Category Name"
                                        />
                                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Limit:</span>
                                            <input 
                                                type="number" 
                                                min="0"
                                                max="99"
                                                value={cat.limit || ''}
                                                onChange={(e) => updateCategory(i, 'limit', parseInt(e.target.value) || 0)}
                                                className="w-12 bg-transparent text-center font-bold outline-none"
                                                placeholder="∞"
                                            />
                                        </div>
                                        <button onClick={() => removeCategory(i)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                                    </div>
                                ))}
                            </div>
                            
                            <button onClick={addCategory} className="text-orange-600 font-bold text-sm flex items-center gap-1 hover:underline">
                                <Plus size={16}/> Add Category
                            </button>

                            <div className="flex gap-3 pt-6">
                                <button onClick={() => setStep(1)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Back</button>
                                <button 
                                    onClick={handleCreate}
                                    disabled={isCreating}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-200"
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
