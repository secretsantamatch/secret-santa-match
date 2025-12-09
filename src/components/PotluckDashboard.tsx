
import React, { useState, useEffect } from 'react';
import { Calendar, User, ChefHat, Plus, Copy, Lock, Utensils, X, Check, Loader2, Sparkles, AlertCircle, Trash2, Info, Flag, MapPin, Clock, CalendarCheck, Link as LinkIcon, Share2, List, Grid, Edit2, Eye, EyeOff, Save, Download } from 'lucide-react';
import { getPotluck, addDish, removeDish, updatePotluckEvent } from '../services/potluckService';
import type { PotluckEvent, PotluckCategory, PotluckDish, PotluckTheme } from '../types';
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
    { id: 'halal', label: 'Halal', color: 'bg-purple-100 text-purple-700', icon: '🍖' },
    { id: 'kosher', label: 'Kosher', color: 'bg-cyan-100 text-cyan-700', icon: '✡️' },
];

const SUGGESTIONS = [
    "Buffalo Chicken Dip", "Caprese Skewers", "Deviled Eggs", "Spinach Artichoke Dip",
    "Meatballs", "Fruit Kabobs", "Mac & Cheese", "Potato Salad", "Brownies",
    "Pulled Pork Sliders", "Pasta Salad", "Veggie Tray", "Cookies", "Sangria"
];

const THEME_STYLES: Record<PotluckTheme, { bg: string, header: string, text: string, accent: string, card: string, pattern?: string }> = {
    classic: { bg: 'bg-[#fff7ed]', header: 'bg-slate-900', text: 'text-orange-900', accent: 'bg-orange-600', card: 'border-orange-200' },
    picnic: { bg: 'bg-[#f0fdf4]', header: 'bg-emerald-900', text: 'text-emerald-900', accent: 'bg-emerald-600', card: 'border-emerald-200', pattern: 'conic-gradient(#dcfce7 90deg, transparent 0 180deg, #dcfce7 0 270deg, transparent 0) 0 0/40px 40px' },
    corporate: { bg: 'bg-[#f8fafc]', header: 'bg-slate-800', text: 'text-slate-900', accent: 'bg-slate-600', card: 'border-slate-200' },
    fiesta: { bg: 'bg-[#fdf2f8]', header: 'bg-pink-900', text: 'text-pink-900', accent: 'bg-pink-600', card: 'border-pink-200', pattern: 'linear-gradient(135deg, #fbcfe8 25%, transparent 25%) -10px 0/20px 20px, linear-gradient(225deg, #fbcfe8 25%, transparent 25%) -10px 0/20px 20px, linear-gradient(315deg, #fbcfe8 25%, transparent 25%) 0 0/20px 20px, linear-gradient(45deg, #fbcfe8 25%, transparent 25%) 0 0/20px 20px' },
    minimal: { bg: 'bg-[#fafafa]', header: 'bg-black', text: 'text-gray-900', accent: 'bg-black', card: 'border-gray-200' },
    thanksgiving: { bg: 'bg-[#fffbeb]', header: 'bg-amber-900', text: 'text-amber-900', accent: 'bg-amber-600', card: 'border-amber-200', pattern: 'radial-gradient(circle, #fcd34d 1px, transparent 1px) 0 0/20px 20px' },
    christmas: { bg: 'bg-[#fef2f2]', header: 'bg-red-900', text: 'text-red-900', accent: 'bg-red-600', card: 'border-red-200', pattern: 'repeating-linear-gradient(45deg, #fee2e2 0, #fee2e2 10px, #fef2f2 10px, #fef2f2 20px)' },
};

const PotluckDashboard: React.FC<PotluckDashboardProps> = ({ publicId, adminKey }) => {
    const [event, setEvent] = useState<PotluckEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [myDishKeys, setMyDishKeys] = useState<Record<string, string>>({});
    
    // Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showEditEventModal, setShowEditEventModal] = useState(false);
    const [lastAddedDishLink, setLastAddedDishLink] = useState('');
    
    // View State for Admin
    const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
    const [isAdminView, setIsAdminView] = useState(false); // Controls hiding/showing cards for admin
    
    const [selectedCategory, setSelectedCategory] = useState<PotluckCategory | null>(null);
    const [dishForm, setDishForm] = useState({ name: '', dish: '', dietary: [] as string[], fulfillmentId: undefined as string | undefined });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    // Edit Event Form
    const [editForm, setEditForm] = useState<Partial<PotluckEvent>>({});

    useEffect(() => {
        const stored = localStorage.getItem(`potluck_keys_${publicId}`);
        if (stored) {
            try {
                setMyDishKeys(JSON.parse(stored));
            } catch (e) {}
        }

        // Auto-switch to admin view if key present
        if (adminKey) setIsAdminView(true);

        const hash = window.location.hash;
        if (hash.includes('claim=')) {
            const params = new URLSearchParams(hash.slice(1));
            const claim = params.get('claim');
            if (claim && claim.includes(':')) {
                const [dishId, editKey] = claim.split(':');
                if (dishId && editKey) {
                    setMyDishKeys(prev => {
                        const newKeys = { ...prev, [dishId]: editKey };
                        localStorage.setItem(`potluck_keys_${publicId}`, JSON.stringify(newKeys));
                        return newKeys;
                    });
                    setToastMsg("Dish ownership restored!");
                    window.history.replaceState(null, '', `#id=${publicId}${adminKey ? `&admin=${adminKey}` : ''}`);
                }
            }
        }

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
    }, [publicId, adminKey]);

    const handleAddDish = async () => {
        if (!event || !selectedCategory || !dishForm.name || !dishForm.dish) return;
        setIsSubmitting(true);
        try {
            const newDish = await addDish(event.publicId, selectedCategory.id, dishForm);
            
            if (newDish.editKey) {
                const newKeys = { ...myDishKeys, [newDish.id]: newDish.editKey };
                setMyDishKeys(newKeys);
                localStorage.setItem(`potluck_keys_${publicId}`, JSON.stringify(newKeys));
                const link = `${window.location.origin}${window.location.pathname}#id=${publicId}&claim=${newDish.id}:${newDish.editKey}`;
                setLastAddedDishLink(link);
            }

            // Optimistic Update
            let updatedCategories = event.categories;
            if (dishForm.fulfillmentId) {
                updatedCategories = event.categories.map(cat => {
                    if (cat.id === selectedCategory.id && cat.requestedItems) {
                        return {
                            ...cat,
                            requestedItems: cat.requestedItems.map(req => 
                                req.id === dishForm.fulfillmentId ? { ...req, takenByDishId: newDish.id } : req
                            )
                        };
                    }
                    return cat;
                });
            }

            setEvent({ ...event, categories: updatedCategories, dishes: [...event.dishes, newDish] });
            setShowAddModal(false);
            setShowSuccessModal(true);
            setDishForm({ name: '', dish: '', dietary: [], fulfillmentId: undefined });
            trackEvent('potluck_dish_added', { category: selectedCategory.name });
        } catch (e) {
            alert("Failed to add dish.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteDish = async (dishId: string) => {
        const editKey = myDishKeys[dishId];
        if (!adminKey && !editKey) return;
        if (!confirm("Remove this dish from the list?")) return;

        try {
            await removeDish(event!.publicId, dishId, adminKey, editKey);
            
            if (editKey) {
                const newKeys = { ...myDishKeys };
                delete newKeys[dishId];
                setMyDishKeys(newKeys);
                localStorage.setItem(`potluck_keys_${publicId}`, JSON.stringify(newKeys));
            }
            
            const updatedCategories = event!.categories.map(cat => {
                if (cat.requestedItems) {
                    return {
                        ...cat,
                        requestedItems: cat.requestedItems.map(req => 
                            req.takenByDishId === dishId ? { ...req, takenByDishId: undefined } : req
                        )
                    };
                }
                return cat;
            });

            setEvent({ ...event!, categories: updatedCategories, dishes: event!.dishes.filter(d => d.id !== dishId) });
        } catch (e) {
            alert("Failed to delete.");
        }
    };

    const handleUpdateEvent = async () => {
        if (!adminKey || !event) return;
        setIsSubmitting(true);
        try {
            const updatedEvent = await updatePotluckEvent(event.publicId, adminKey, editForm);
            // Merge response to keep dishes/categories populated if server returned partial
            setEvent({ ...event, ...updatedEvent, dishes: event.dishes, categories: event.categories }); 
            setShowEditEventModal(false);
            setToastMsg("Event updated successfully!");
        } catch (e) {
            alert("Failed to update event.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = () => {
        setEditForm({
            title: event?.title,
            date: event?.date,
            time: event?.time,
            location: event?.location,
            description: event?.description,
            dietaryNotes: event?.dietaryNotes
        });
        setShowEditEventModal(true);
    };

    const openAddModal = (cat: PotluckCategory, prefillItem?: { id: string, name: string }) => {
        setSelectedCategory(cat);
        setDishForm(prev => ({ 
            ...prev, 
            name: '',
            dish: prefillItem ? prefillItem.name : '', 
            dietary: [],
            fulfillmentId: prefillItem?.id 
        }));
        setShowAddModal(true);
    };

    const toggleDietary = (id: string) => {
        setDishForm(prev => ({
            ...prev,
            dietary: prev.dietary.includes(id) 
                ? prev.dietary.filter(d => d !== id)
                : [...prev.dietary, id]
        }));
    };

    const copyLink = (text: string) => {
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const addToCalendar = () => {
        if (!event) return;
        const start = new Date(event.date + (event.time ? ' ' + event.time : '')).toISOString().replace(/-|:|\.\d\d\d/g, "");
        const details = encodeURIComponent(event.description || "Potluck!");
        const location = encodeURIComponent(event.location || "");
        const title = encodeURIComponent(event.title);
        const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${start}&details=${details}&location=${location}&sf=true&output=xml`;
        window.open(url, '_blank');
    };

    const downloadCSV = () => {
        if (!event) return;
        const headers = ['Category', 'Dish Name', 'Guest Name', 'Dietary Info'];
        const rows = event.dishes.map(d => {
            const cat = event.categories.find(c => c.id === d.categoryId)?.name || 'Unknown';
            const diet = d.dietary.map(dt => DIETARY_OPTIONS.find(o => o.id === dt)?.label).join(', ');
            return [cat, d.dishName, d.guestName, diet].map(field => `"${field}"`).join(',');
        });
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${event.title.replace(/\s+/g, '_')}_Potluck_List.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        trackEvent('potluck_csv_download');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={40}/></div>;
    if (error || !event) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

    const isAdmin = !!adminKey;
    const styles = THEME_STYLES[event.theme || 'classic'] || THEME_STYLES.classic;
    const shareLink = window.location.href.split('#')[0] + `#id=${publicId}`;

    return (
        <div 
            className={`min-h-screen pb-24 ${styles.bg}`}
            style={{ 
                backgroundImage: styles.pattern,
                backgroundBlendMode: 'multiply'
            }}
        >
            <div className="max-w-4xl mx-auto p-4 md:p-8 relative z-10">
                
                {toastMsg && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-2 animate-fade-in">
                        <Check size={18} className="text-green-400"/> {toastMsg}
                    </div>
                )}

                {/* --- HEADER CARD --- */}
                <div className={`bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border ${styles.card}`}>
                    <div className={`${styles.header} p-8 text-center text-white relative group`}>
                        {isAdmin && (
                            <button 
                                onClick={openEditModal} 
                                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-white transition-colors flex items-center gap-2 text-xs font-bold" 
                                title="Edit Event Details"
                            >
                                <Edit2 size={14} /> Edit Event Details
                            </button>
                        )}
                        <h1 className="text-3xl md:text-5xl font-black font-serif mb-2">{event.title}</h1>
                        {isAdmin && (
                            <div className="inline-block bg-yellow-400/20 border border-yellow-400/50 px-3 py-1 rounded-full text-xs font-bold text-yellow-100 uppercase tracking-widest mb-4">
                                Organizer Dashboard
                            </div>
                        )}
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-white/90 font-medium">
                            <span className="flex items-center gap-1.5"><Calendar size={18}/> {new Date(event.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                            {event.time && <span className="flex items-center gap-1.5"><Clock size={18}/> {event.time}</span>}
                            <span className="flex items-center gap-1.5"><User size={18}/> Hosted by {event.hostName}</span>
                        </div>
                        
                        {event.location && (
                             <a 
                                href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-lg text-sm font-bold border border-white/20 hover:bg-white/20 transition-colors"
                            >
                                <MapPin size={16} className="text-red-400" />
                                {event.location}
                            </a>
                        )}
                        
                        {event.dietaryNotes && (
                            <div className="mt-4 flex justify-center">
                                <div className="inline-flex items-center gap-2 bg-yellow-500/20 backdrop-blur px-4 py-2 rounded-lg text-sm font-bold border border-yellow-400/50 text-yellow-50">
                                    <AlertCircle size={16} className="text-yellow-400" />
                                    Note: {event.dietaryNotes}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center gap-3 mt-6">
                             <button onClick={addToCalendar} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2">
                                <CalendarCheck size={14}/> Add to Calendar
                            </button>
                        </div>
                    </div>
                    {event.description && (
                        <div className={`p-6 ${styles.bg} ${styles.text} text-center border-b ${styles.card} italic relative group`}>
                            "{event.description}"
                            {isAdmin && (
                                <button onClick={openEditModal} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Edit2 size={14} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* --- ORGANIZER CONTROLS (ADMIN ONLY) --- */}
                {isAdmin && (
                    <div className="mb-10 space-y-6">
                        
                        {/* SHARE CARD */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-orange-100 flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-shrink-0 bg-orange-100 p-4 rounded-full text-orange-600">
                                <Share2 size={32} />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-xl font-bold text-slate-800">Invite Your Guests</h3>
                                <p className="text-slate-600 text-sm mt-1">Share this link so guests can sign up.</p>
                            </div>
                            <button 
                                onClick={() => copyLink(shareLink)} 
                                className={`px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 ${isCopied ? 'bg-green-600' : 'bg-orange-600 hover:bg-orange-700'}`}
                            >
                                {isCopied ? <Check size={20}/> : <Copy size={20}/>}
                                {isCopied ? 'Link Copied!' : 'Copy Guest Link'}
                            </button>
                        </div>

                        {/* MASTER LIST HEADER */}
                        <div className="flex flex-wrap justify-between items-end border-b border-slate-200 pb-4 gap-4">
                            <div>
                                <h3 className="font-black text-slate-800 text-2xl flex items-center gap-2 font-serif">
                                    <ChefHat className="text-slate-400" size={28}/> Master Dish List
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Manage all contributions in one place.</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {/* Toggle View Mode */}
                                <button 
                                    onClick={() => setIsAdminView(!isAdminView)}
                                    className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
                                >
                                    {isAdminView ? <EyeOff size={14} /> : <Eye size={14} />}
                                    {isAdminView ? 'View as Guest' : 'Back to Admin View'}
                                </button>

                                {/* Download CSV */}
                                {isAdminView && (
                                    <button 
                                        onClick={downloadCSV}
                                        className="text-xs font-bold text-slate-600 flex items-center gap-1 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                                    >
                                        <Download size={14} /> Download CSV
                                    </button>
                                )}
                            </div>
                            
                            {/* Table/Card Toggle for Master List */}
                            {isAdminView && (
                                <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                                    <button 
                                        onClick={() => setViewMode('cards')}
                                        className={`p-2 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                                        title="Card View"
                                    >
                                        <Grid size={18} />
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                                        title="List View"
                                    >
                                        <List size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* MASTER LIST TABLE (ONLY VISIBLE IN LIST MODE + ADMIN VIEW) */}
                        {isAdminView && viewMode === 'list' && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-800 text-slate-200 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="p-4">Dish</th>
                                            <th className="p-4">Guest</th>
                                            <th className="p-4">Category</th>
                                            <th className="p-4">Notes</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {event.dishes.length === 0 ? (
                                            <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">No dishes added yet.</td></tr>
                                        ) : (
                                            event.dishes.map(dish => {
                                                const catName = event.categories.find(c => c.id === dish.categoryId)?.name || 'Unknown';
                                                return (
                                                    <tr key={dish.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="p-4 font-bold text-slate-800">{dish.dishName}</td>
                                                        <td className="p-4 text-slate-600">{dish.guestName}</td>
                                                        <td className="p-4 text-slate-500"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{catName}</span></td>
                                                        <td className="p-4">
                                                            <div className="flex gap-1">
                                                                {dish.dietary.map(d => (
                                                                    <span key={d} className="text-[10px] bg-white border px-1.5 py-0.5 rounded">{DIETARY_OPTIONS.find(o=>o.id===d)?.icon}</span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <button onClick={() => handleDeleteDish(dish.id)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="1234567890" data-ad-format="auto" data-full-width-responsive="true" />

                {/* --- MENU CARDS (STANDARD VIEW / GUEST VIEW) --- */}
                {/* Show if NOT admin, OR if admin turned off AdminView, OR if admin is in Card mode */}
                {(!isAdmin || !isAdminView || viewMode === 'cards') && (
                    <div className="space-y-8">
                        {event.categories.map(category => {
                            const categoryDishes = event.dishes.filter(d => d.categoryId === category.id);
                            const isFull = category.limit ? categoryDishes.length >= category.limit : false;
                            
                            return (
                                <div key={category.id} className={`bg-white rounded-2xl shadow-sm border ${styles.card} overflow-hidden`}>
                                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                        <h3 className={`font-bold text-xl font-serif ${styles.text.replace('text-', 'text-opacity-80 text-')}`}>{category.name}</h3>
                                        {category.limit ? (
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${isFull ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {categoryDishes.length} / {category.limit} Filled
                                            </span>
                                        ) : (
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unlimited</span>
                                        )}
                                    </div>
                                    
                                    {/* REQUESTED ITEMS SECTION */}
                                    {category.requestedItems && category.requestedItems.length > 0 && (
                                        <div className="p-4 bg-yellow-50 border-b border-yellow-100">
                                            <p className="text-xs font-bold text-yellow-700 uppercase mb-2 flex items-center gap-1"><Flag size={12}/> Host Requested:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {category.requestedItems.map(req => {
                                                    const isTaken = !!req.takenByDishId;
                                                    // Find the dish that took it to show who
                                                    const takenByDish = isTaken ? event.dishes.find(d => d.id === req.takenByDishId) : null;

                                                    return (
                                                        <div key={req.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${isTaken ? 'bg-slate-100 text-slate-400 border-slate-200 line-through decoration-slate-400' : 'bg-white border-yellow-200 text-slate-700 shadow-sm'}`}>
                                                            <span>{req.name}</span>
                                                            {isTaken ? (
                                                                <span className="text-[10px] no-underline bg-slate-200 px-1.5 rounded text-slate-500">
                                                                    {takenByDish?.guestName || 'Taken'}
                                                                </span>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => openAddModal(category, req)}
                                                                    className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded font-bold"
                                                                >
                                                                    Bring This
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="divide-y divide-slate-100">
                                        {categoryDishes.map(dish => (
                                            <div key={dish.id} className="p-4 flex items-start justify-between group hover:bg-slate-50 transition-colors">
                                                <div>
                                                    <div className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                                        {dish.dishName}
                                                        {category.requestedItems?.some(r => r.takenByDishId === dish.id) && (
                                                            <span title="Host Requested" className="flex items-center">
                                                                <Sparkles size={14} className="text-yellow-500" />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-slate-500 flex items-center gap-2 flex-wrap mt-1">
                                                        <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-xs">by {dish.guestName}</span>
                                                        {dish.dietary.map(dt => {
                                                            const tag = DIETARY_OPTIONS.find(o => o.id === dt);
                                                            return tag ? (
                                                                <span key={dt} title={tag.label} className={`text-[10px] px-1.5 py-0.5 rounded border ${tag.color.replace('text-', 'border-').replace('100', '200')} bg-white`}>
                                                                    {tag.icon} {tag.label}
                                                                </span>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                </div>
                                                {/* Show delete if admin OR if I own this dish (key check) */}
                                                {(isAdmin || myDishKeys[dish.id]) && (
                                                    <button onClick={() => handleDeleteDish(dish.id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        
                                        {categoryDishes.length === 0 && (
                                            <div className="p-6 text-center text-slate-400 italic text-sm">
                                                No dishes yet. Be the first!
                                            </div>
                                        )}
                                    </div>

                                    {/* Hide the "Add Dish" button if we are in strict Admin View mode (unless toggled to view as guest) */}
                                    {(!isAdmin || !isAdminView) && (
                                        <div className="p-3 bg-slate-50/50 border-t border-slate-100">
                                            <button 
                                                onClick={() => openAddModal(category)}
                                                disabled={isFull}
                                                className={`w-full py-3 rounded-xl border-2 border-dashed font-bold flex items-center justify-center gap-2 transition-all ${
                                                    isFull 
                                                    ? 'border-slate-200 text-slate-400 cursor-not-allowed' 
                                                    : `border-slate-300 text-slate-500 hover:bg-white hover:border-${styles.accent.replace('bg-', '')} hover:text-slate-800`
                                                }`}
                                            >
                                                {isFull ? <span className="flex items-center gap-2"><Lock size={16}/> Category Full</span> : <span className="flex items-center gap-2"><Plus size={18}/> Bring Something Else</span>}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ADD DISH MODAL */}
                {showAddModal && selectedCategory && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
                            <div className={`${styles.header} p-4 flex justify-between items-center text-white`}>
                                <h3 className="font-bold flex items-center gap-2"><Utensils size={20}/> {dishForm.fulfillmentId ? 'I\'ll Bring This!' : 'Bring a Dish'}</h3>
                                <button onClick={() => setShowAddModal(false)}><X size={24}/></button>
                            </div>
                            
                            <div className="p-6 space-y-4">
                                {dishForm.fulfillmentId && (
                                    <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm font-medium border border-yellow-200 flex items-center gap-2">
                                        <Check size={16} /> You are signing up to bring: <strong>{dishForm.dish}</strong>
                                    </div>
                                )}

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
                                        {!dishForm.fulfillmentId && (
                                            <button onClick={() => setDishForm({...dishForm, dish: SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)]})} className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline">
                                                <Sparkles size={12}/> Suggest Idea
                                            </button>
                                        )}
                                    </div>
                                    <input 
                                        type="text" 
                                        value={dishForm.dish}
                                        onChange={e => setDishForm({...dishForm, dish: e.target.value})}
                                        className="w-full p-3 border rounded-lg focus:border-orange-500 outline-none"
                                        placeholder="e.g. Spicy Meatballs"
                                        readOnly={!!dishForm.fulfillmentId} // Lock if fulfilling request
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
                                    className={`w-full ${styles.accent} hover:opacity-90 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none`}
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin"/> : <Check />} Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* SUCCESS MODAL with Edit Link */}
                {showSuccessModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in text-center p-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                <Check size={32}/>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Dish Added!</h3>
                            <p className="text-slate-500 text-sm mb-6">
                                Thanks for signing up!
                            </p>
                            
                            <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200 text-left">
                                <p className="text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1">
                                    <LinkIcon size={12}/> Edit Link (Save This!)
                                </p>
                                <p className="text-xs text-slate-500 mb-2">
                                    If you need to change or remove your dish from another device, you'll need this private link.
                                </p>
                                <div className="flex gap-2">
                                    <input type="text" readOnly value={lastAddedDishLink} className="flex-1 text-xs border rounded p-1.5 bg-white text-slate-400" />
                                    <button onClick={() => copyLink(lastAddedDishLink)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 rounded font-bold text-xs">Copy</button>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}

                {/* EDIT EVENT MODAL (ADMIN) */}
                {showEditEventModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
                            <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                                <h3 className="font-bold flex items-center gap-2"><Edit2 size={20}/> Edit Event Details</h3>
                                <button onClick={() => setShowEditEventModal(false)}><X size={24}/></button>
                            </div>
                            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                                    <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                                    <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Time</label>
                                    <input type="text" value={editForm.time} onChange={e => setEditForm({...editForm, time: e.target.value})} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                                    <input type="text" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Welcome Message</label>
                                    <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full p-2 border rounded h-20" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dietary Notes</label>
                                    <input type="text" value={editForm.dietaryNotes} onChange={e => setEditForm({...editForm, dietaryNotes: e.target.value})} className="w-full p-2 border rounded" />
                                </div>
                                <button 
                                    onClick={handleUpdateEvent}
                                    disabled={isSubmitting}
                                    className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} />} Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default PotluckDashboard;
