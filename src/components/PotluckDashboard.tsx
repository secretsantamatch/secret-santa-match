
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, User, ChefHat, Plus, Copy, Lock, Utensils, X, Check, Loader2, Sparkles, AlertCircle, Trash2 } from 'lucide-react';
import { getPotluck, addDish, removeDish } from '../services/potluckService';
import type { PotluckEvent, PotluckCategory, PotluckDish } from '../types';
import { trackEvent } from '../services/analyticsService';
import AdBanner from './AdBanner';

interface PotluckDashboardProps {
    publicId: string;
    adminKey: string | null;
}

const DIETARY_OPTIONS = [
    { id: 'v', label: 'Vegetarian', color: 'bg-green-100 text-green-700', icon: '🥦' },
    { id: 'vg', label: 'Vegan', color: 'bg-emerald-100 text-emerald-700', icon: '🌱' },
    { id: 'gf', label: 'Gluten Free', color: 'bg-amber-100 text-amber-700', icon: '🌾' },
    { id: 'df', label: 'Dairy Free', color: 'bg-blue-100 text-blue-700', icon: '🥛' },
    { id: 'nf', label: 'Nut Free', color: 'bg-rose-100 text-rose-700', icon: '🥜' },
];

const SUGGESTIONS = [
    "Buffalo Chicken Dip", "Caprese Skewers", "Deviled Eggs", "Spinach Artichoke Dip",
    "Meatballs", "Fruit Kabobs", "Mac & Cheese", "Potato Salad", "Brownies",
    "Pulled Pork Sliders", "Pasta Salad", "Veggie Tray", "Cookies", "Sangria"
];

const PotluckDashboard: React.FC<PotluckDashboardProps> = ({ publicId, adminKey }) => {
    const [event, setEvent] = useState<PotluckEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<PotluckCategory | null>(null);
    const [dishForm, setDishForm] = useState({ name: '', dish: '', dietary: [] as string[] });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Polling
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const data = await getPotluck(publicId);
                setEvent(data);
                setLoading(false);
            } catch (err) {
                setError("Event not found.");
                setLoading(false);
            }
        };
        fetchEvent();
        const interval = setInterval(fetchEvent, 5000);
        return () => clearInterval(interval);
    }, [publicId]);

    const handleAddDish = async () => {
        if (!event || !selectedCategory || !dishForm.name || !dishForm.dish) return;
        setIsSubmitting(true);
        try {
            const newDish = await addDish(event.publicId, selectedCategory.id, dishForm);
            setEvent({ ...event, dishes: [...event.dishes, newDish] });
            setShowAddModal(false);
            setDishForm({ name: '', dish: '', dietary: [] });
            trackEvent('potluck_dish_added', { category: selectedCategory.name });
        } catch (e) {
            alert("Failed to add dish.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteDish = async (dishId: string) => {
        if (!adminKey || !event) return;
        if (!confirm("Remove this dish?")) return;
        try {
            await removeDish(event.publicId, dishId, adminKey);
            setEvent({ ...event, dishes: event.dishes.filter(d => d.id !== dishId) });
        } catch (e) {
            alert("Failed to delete.");
        }
    };

    const toggleDietary = (id: string) => {
        setDishForm(prev => ({
            ...prev,
            dietary: prev.dietary.includes(id) 
                ? prev.dietary.filter(d => d !== id)
                : [...prev.dietary, id]
        }));
    };

    const suggestDish = () => {
        const random = SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)];
        setDishForm(prev => ({ ...prev, dish: random }));
    };

    const copyLink = () => {
        // Strip admin key for sharing
        const url = window.location.href.split('&')[0];
        navigator.clipboard.writeText(url);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={40}/></div>;
    if (error || !event) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

    const isAdmin = !!adminKey;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 pb-24">
            
            {/* Header Card */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border border-slate-200">
                <div className="bg-slate-900 p-8 text-center text-white relative">
                    <h1 className="text-3xl md:text-5xl font-black font-serif mb-2">{event.title}</h1>
                    <div className="flex items-center justify-center gap-4 text-orange-200 font-medium">
                        <span className="flex items-center gap-1"><Calendar size={16}/> {new Date(event.date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><User size={16}/> Hosted by {event.hostName}</span>
                    </div>
                    {isAdmin && (
                        <div className="mt-6 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 inline-flex flex-col sm:flex-row items-center gap-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-orange-300 flex items-center gap-1"><Lock size={12}/> Admin Mode</span>
                            <div className="h-4 w-px bg-white/20 hidden sm:block"></div>
                            <span className="text-sm">Share this link with guests:</span>
                            <button onClick={copyLink} className="bg-white text-slate-900 px-3 py-1 rounded-lg text-xs font-bold hover:bg-orange-100 transition-colors flex items-center gap-1">
                                {isCopied ? <Check size={14}/> : <Copy size={14}/>} {isCopied ? 'Copied' : 'Copy Link'}
                            </button>
                        </div>
                    )}
                </div>
                {event.description && (
                    <div className="p-6 bg-orange-50 text-orange-900 text-center border-b border-orange-100 italic">
                        "{event.description}"
                    </div>
                )}
            </div>

            <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="1234567890" data-ad-format="auto" data-full-width-responsive="true" />

            {/* Menu Sections */}
            <div className="space-y-8">
                {event.categories.map(category => {
                    const categoryDishes = event.dishes.filter(d => d.categoryId === category.id);
                    const isFull = category.limit ? categoryDishes.length >= category.limit : false;
                    
                    return (
                        <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-xl font-serif text-slate-800">{category.name}</h3>
                                {category.limit ? (
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${isFull ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {categoryDishes.length} / {category.limit} Filled
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unlimited</span>
                                )}
                            </div>
                            
                            <div className="divide-y divide-slate-100">
                                {categoryDishes.map(dish => (
                                    <div key={dish.id} className="p-4 flex items-start justify-between group hover:bg-slate-50 transition-colors">
                                        <div>
                                            <div className="font-bold text-slate-800 text-lg">{dish.dishName}</div>
                                            <div className="text-sm text-slate-500 flex items-center gap-2">
                                                <span className="font-medium text-slate-600">from {dish.guestName}</span>
                                                {dish.dietary.map(dt => {
                                                    const tag = DIETARY_OPTIONS.find(o => o.id === dt);
                                                    return tag ? <span key={dt} title={tag.label} className="text-xs cursor-help">{tag.icon}</span> : null;
                                                })}
                                            </div>
                                        </div>
                                        {isAdmin && (
                                            <button onClick={() => handleDeleteDish(dish.id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                
                                {categoryDishes.length === 0 && (
                                    <div className="p-8 text-center text-slate-400 italic text-sm">
                                        Nothing here yet. Be the first!
                                    </div>
                                )}
                            </div>

                            <div className="p-3 bg-slate-50 border-t border-slate-100">
                                <button 
                                    onClick={() => { setSelectedCategory(category); setShowAddModal(true); }}
                                    disabled={isFull}
                                    className={`w-full py-3 rounded-xl border-2 border-dashed font-bold flex items-center justify-center gap-2 transition-all ${
                                        isFull 
                                        ? 'border-slate-200 text-slate-400 cursor-not-allowed' 
                                        : 'border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300'
                                    }`}
                                >
                                    {isFull ? <span className="flex items-center gap-2"><Lock size={16}/> Full</span> : <span className="flex items-center gap-2"><Plus size={18}/> Bring a Dish</span>}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ADD DISH MODAL */}
            {showAddModal && selectedCategory && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
                        <div className="bg-orange-600 p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold flex items-center gap-2"><Utensils size={20}/> Bring {selectedCategory.name}</h3>
                            <button onClick={() => setShowAddModal(false)}><X size={24}/></button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Your Name</label>
                                <input 
                                    autoFocus
                                    type="text" 
                                    value={dishForm.name}
                                    onChange={e => setDishForm({...dishForm, name: e.target.value})}
                                    className="w-full p-3 border rounded-lg focus:border-orange-500 outline-none"
                                    placeholder="Jane Doe"
                                />
                            </div>
                            
                            <div>
                                <div className="flex justify-between items-end mb-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">What are you bringing?</label>
                                    <button onClick={suggestDish} className="text-xs text-orange-600 font-bold flex items-center gap-1 hover:underline">
                                        <Sparkles size={12}/> Suggest Idea
                                    </button>
                                </div>
                                <input 
                                    type="text" 
                                    value={dishForm.dish}
                                    onChange={e => setDishForm({...dishForm, dish: e.target.value})}
                                    className="w-full p-3 border rounded-lg focus:border-orange-500 outline-none"
                                    placeholder="e.g. Spicy Meatballs"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Dietary Info (Optional)</label>
                                <div className="flex flex-wrap gap-2">
                                    {DIETARY_OPTIONS.map(opt => (
                                        <button 
                                            key={opt.id}
                                            onClick={() => toggleDietary(opt.id)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1 ${
                                                dishForm.dietary.includes(opt.id) 
                                                ? opt.color + ' border-transparent ring-2 ring-offset-1 ring-slate-200' 
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                            }`}
                                        >
                                            <span>{opt.icon}</span> {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={handleAddDish}
                                disabled={isSubmitting || !dishForm.name || !dishForm.dish}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin"/> : <Check />} I'll Bring It!
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default PotluckDashboard;
