import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, User, ChefHat, Plus, Copy, Lock, Utensils, X, Check, Loader2, Sparkles, AlertCircle, Trash2, MapPin, Clock, CalendarCheck, Link as LinkIcon, Share2, List, Grid, Edit2, Eye, EyeOff, Save, Download, Timer, ExternalLink, Flag, Smartphone, MessageCircle, Mail, ArrowRight, Pencil, Ghost, CheckCircle } from 'lucide-react';
import { getPotluck, addDish, removeDish, updatePotluckEvent } from '../services/potluckService';
import type { PotluckEvent, PotluckCategory, PotluckTheme } from '../types';
import { trackEvent } from '../services/analyticsService';
import { generatePotluckPdf } from '../services/pdfService';
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

// --- THEME ENGINE ---
const THEME_STYLES: Record<PotluckTheme, { 
    bg: string, 
    headerBg: string, 
    headerText: string,
    accentBtn: string,
    cardBorder: string,
    pattern: string,
    iconColor: string,
    modalHeader: string
}> = {
    classic: { 
        bg: 'bg-orange-50', 
        headerBg: 'bg-gradient-to-r from-orange-600 to-amber-600', 
        headerText: 'text-orange-900', 
        accentBtn: 'bg-orange-600 hover:bg-orange-700', 
        cardBorder: 'border-orange-200', 
        pattern: 'radial-gradient(#fed7aa 1px, transparent 1px) 0 0/20px 20px', 
        iconColor: 'text-orange-500', 
        modalHeader: 'bg-gradient-to-r from-orange-600 to-amber-600' 
    },
    picnic: { 
        bg: 'bg-emerald-50', 
        headerBg: 'bg-gradient-to-r from-emerald-600 to-green-600', 
        headerText: 'text-emerald-900', 
        accentBtn: 'bg-emerald-600 hover:bg-emerald-700', 
        cardBorder: 'border-emerald-200', 
        pattern: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #a7f3d0 19px, #a7f3d0 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #a7f3d0 19px, #a7f3d0 20px)', 
        iconColor: 'text-emerald-500', 
        modalHeader: 'bg-gradient-to-r from-emerald-500 to-green-600' 
    },
    corporate: { 
        bg: 'bg-slate-100', 
        headerBg: 'bg-gradient-to-r from-slate-700 to-slate-900', 
        headerText: 'text-slate-900', 
        accentBtn: 'bg-slate-700 hover:bg-slate-800', 
        cardBorder: 'border-slate-200', 
        pattern: 'linear-gradient(#e2e8f0 1px, transparent 1px) 0 0/40px 40px, linear-gradient(90deg, #e2e8f0 1px, transparent 1px) 0 0/40px 40px',
        iconColor: 'text-slate-500', 
        modalHeader: 'bg-gradient-to-r from-slate-700 to-slate-900' 
    },
    fiesta: { 
        bg: 'bg-pink-50', 
        headerBg: 'bg-gradient-to-r from-pink-500 to-rose-600', 
        headerText: 'text-pink-900', 
        accentBtn: 'bg-pink-600 hover:bg-pink-700', 
        cardBorder: 'border-pink-200', 
        pattern: 'linear-gradient(135deg, #fbcfe8 25%, transparent 25%) -10px 0/20px 20px, linear-gradient(225deg, #fbcfe8 25%, transparent 25%) -10px 0/20px 20px, linear-gradient(315deg, #fbcfe8 25%, transparent 25%) 0 0/20px 20px, linear-gradient(45deg, #fbcfe8 25%, transparent 25%) 0 0/20px 20px', 
        iconColor: 'text-pink-500', 
        modalHeader: 'bg-gradient-to-r from-pink-500 to-rose-600' 
    },
    minimal: { 
        bg: 'bg-gray-50', 
        headerBg: 'bg-black', 
        headerText: 'text-gray-900', 
        accentBtn: 'bg-black hover:bg-gray-800', 
        cardBorder: 'border-gray-200', 
        pattern: '', 
        iconColor: 'text-gray-600', 
        modalHeader: 'bg-black' 
    },
    thanksgiving: { 
        bg: 'bg-amber-50', 
        headerBg: 'bg-gradient-to-r from-amber-700 to-orange-800', 
        headerText: 'text-amber-900', 
        accentBtn: 'bg-amber-700 hover:bg-amber-800', 
        cardBorder: 'border-amber-200', 
        pattern: 'radial-gradient(#fbbf24 1.5px, transparent 1.5px) 0 0/24px 24px', 
        iconColor: 'text-amber-700', 
        modalHeader: 'bg-gradient-to-r from-amber-600 to-orange-700' 
    },
    christmas: { 
        bg: 'bg-red-50', 
        headerBg: 'bg-gradient-to-r from-red-700 to-green-700', 
        headerText: 'text-red-900', 
        accentBtn: 'bg-red-700 hover:bg-red-800', 
        cardBorder: 'border-red-200', 
        pattern: 'repeating-linear-gradient(45deg, #fee2e2 0, #fee2e2 10px, #fecaca 10px, #fecaca 20px)', 
        iconColor: 'text-red-600', 
        modalHeader: 'bg-gradient-to-r from-red-600 to-green-700' 
    },
    bbq: { 
        bg: 'bg-red-50', 
        headerBg: 'bg-gradient-to-r from-red-700 to-red-900', 
        headerText: 'text-red-900', 
        accentBtn: 'bg-red-700 hover:bg-red-800', 
        cardBorder: 'border-red-300', 
        pattern: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #fca5a5 19px, #fca5a5 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #fca5a5 19px, #fca5a5 20px)', 
        iconColor: 'text-red-700', 
        modalHeader: 'bg-gradient-to-r from-red-700 to-red-900' 
    },
    spooky: { 
        bg: 'bg-slate-900', 
        headerBg: 'bg-gradient-to-r from-purple-900 to-orange-600', 
        headerText: 'text-orange-100', 
        accentBtn: 'bg-orange-600 hover:bg-orange-700', 
        cardBorder: 'border-purple-900 bg-slate-800/50 text-white', 
        pattern: 'radial-gradient(circle at 50% 50%, #1e1b4b 0%, #020617 100%)', 
        iconColor: 'text-orange-500', 
        modalHeader: 'bg-gradient-to-r from-purple-900 to-orange-700' 
    },
    baby: { 
        bg: 'bg-sky-50', 
        headerBg: 'bg-gradient-to-r from-sky-400 to-blue-500', 
        headerText: 'text-sky-900', 
        accentBtn: 'bg-sky-500 hover:bg-sky-600', 
        cardBorder: 'border-sky-200', 
        pattern: 'radial-gradient(#bfdbfe 2px, transparent 2px) 0 0/30px 30px', 
        iconColor: 'text-sky-500', 
        modalHeader: 'bg-gradient-to-r from-sky-400 to-blue-500' 
    },
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
    const [editingDishId, setEditingDishId] = useState<string | null>(null);
    
    // View State
    const isAdmin = !!adminKey;
    const [viewMode, setViewMode] = useState<'cards' | 'list'>('list');
    const [isAdminView, setIsAdminView] = useState(false); 
    
    // Welcome Gatekeeper State
    const [hasEntered, setHasEntered] = useState(false);
    
    const [selectedCategory, setSelectedCategory] = useState<PotluckCategory | null>(null);
    const [dishForm, setDishForm] = useState({ name: '', dish: '', dietary: [] as string[], fulfillmentId: undefined as string | undefined });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    // Edit Event Form
    const [editForm, setEditForm] = useState<Partial<PotluckEvent>>({});

    // Countdown State
    const [timeLeft, setTimeLeft] = useState<{days: number, label: string} | null>(null);

    useEffect(() => {
        // Admins bypass the welcome screen
        if (adminKey) {
            setHasEntered(true);
            setViewMode('list');
            setIsAdminView(true);
        } else {
            // Guests see cards by default
            setViewMode('cards');
        }

        const stored = localStorage.getItem(`potluck_keys_${publicId}`);
        if (stored) {
            try {
                setMyDishKeys(JSON.parse(stored));
            } catch (e) {}
        }

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

    useEffect(() => {
        if (event && event.date) {
            const calculateTime = () => {
                const eventDate = new Date(`${event.date}T${event.time ? convertTime12to24(event.time) : '00:00:00'}`);
                const now = new Date();
                const diff = eventDate.getTime() - now.getTime();
                
                if (diff > 0) {
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const label = days === 1 ? 'Day' : 'Days';
                    setTimeLeft({ days: days + (diff % (1000 * 60 * 60 * 24) > 0 ? 1 : 0), label });
                } else {
                    setTimeLeft(null); // Event started or passed
                }
            };
            calculateTime();
            const timer = setInterval(calculateTime, 60000); 
            return () => clearInterval(timer);
        }
    }, [event]);

    const convertTime12to24 = (time12h: string) => {
        const [time, modifier] = time12h.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') hours = '00';
        if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString();
        return `${hours}:${minutes}`;
    };

    const handleSaveDish = async () => {
        if (!event || !selectedCategory || !dishForm.name || !dishForm.dish) return;
        setIsSubmitting(true);
        
        try {
            // If editing, delete the old dish first (simple atomic replacement logic)
            if (editingDishId) {
                const editKey = myDishKeys[editingDishId];
                if (editKey || adminKey) {
                   await removeDish(event.publicId, editingDishId, adminKey, editKey);
                }
            }

            const newDish = await addDish(event.publicId, selectedCategory.id, dishForm);
            
            if (newDish.editKey) {
                const newKeys = { ...myDishKeys, [newDish.id]: newDish.editKey };
                // If we replaced a dish, remove the old key
                if (editingDishId) delete newKeys[editingDishId];
                
                setMyDishKeys(newKeys);
                localStorage.setItem(`potluck_keys_${publicId}`, JSON.stringify(newKeys));
                const link = `${window.location.origin}${window.location.pathname}#id=${publicId}&claim=${newDish.id}:${newDish.editKey}`;
                setLastAddedDishLink(link);
            }

            // Refetch event to be safe, but optimistic update too
            const data = await getPotluck(publicId);
            setEvent(data);

            setShowAddModal(false);
            setShowSuccessModal(true);
            setDishForm({ name: '', dish: '', dietary: [], fulfillmentId: undefined });
            setEditingDishId(null);
            trackEvent(editingDishId ? 'potluck_dish_edited' : 'potluck_dish_added', { category: selectedCategory.name });
        } catch (e) {
            alert("Failed to save dish.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isEditLocked = useMemo(() => {
        if (!event || !event.date) return false;
        if (!event.allowGuestEditing && !adminKey) return true;
        if (adminKey) return false; 
        
        const daysLock = event.editLockDays || 0;
        if (daysLock === 0) return false;

        const eventDate = new Date(event.date);
        const lockDate = new Date(eventDate);
        lockDate.setDate(eventDate.getDate() - daysLock);
        
        return new Date() > lockDate;
    }, [event, adminKey]);

    const handleDeleteDish = async (dishId: string) => {
        const editKey = myDishKeys[dishId];
        
        if (!adminKey && isEditLocked) {
            alert("Editing is now locked for this event. Please contact the host.");
            return;
        }

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
            
            // Refresh
            const data = await getPotluck(publicId);
            setEvent(data);
        } catch (e: any) {
             alert(e.message?.includes("Locked") ? "Editing is now locked for this event." : "Failed to delete.");
        }
    };

    const handleUpdateEvent = async () => {
        if (!adminKey || !event) return;
        setIsSubmitting(true);
        try {
            const updatedEvent = await updatePotluckEvent(event.publicId, adminKey, editForm);
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
            dietaryNotes: event?.dietaryNotes,
            allowGuestEditing: event?.allowGuestEditing,
            editLockDays: event?.editLockDays,
            hideNamesFromGuests: event?.hideNamesFromGuests
        });
        setShowEditEventModal(true);
    };

    const openAddModal = (cat: PotluckCategory, prefillItem?: { id: string, name: string }) => {
        setEditingDishId(null);
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

    const openEditDishModal = (dish: any) => {
        const cat = event?.categories.find(c => c.id === dish.categoryId);
        if (!cat) return;
        
        setEditingDishId(dish.id);
        setSelectedCategory(cat);
        setDishForm({
            name: dish.guestName,
            dish: dish.dishName,
            dietary: dish.dietary || [],
            fulfillmentId: dish.fulfillmentId
        });
        setShowAddModal(true);
    }

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
    
    // Sharing Actions
    const handleShare = (type: 'sms' | 'whatsapp' | 'email') => {
        if (!event) return;
        const url = window.location.href.split('#')[0] + `#id=${publicId}`;
        const msg = `Join my Potluck: ${event.title}! Sign up here: ${url}`;
        
        if (type === 'sms') window.open(`sms:?body=${encodeURIComponent(msg)}`);
        if (type === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
        if (type === 'email') window.open(`mailto:?subject=${encodeURIComponent("Join my Potluck: " + event.title)}&body=${encodeURIComponent(msg)}`);
    };

    const addToCalendar = () => {
        if (!event) return;
        const start = new Date(event.date + (event.time ? ' ' + convertTime12to24(event.time) : '')).toISOString().replace(/-|:|\.\d\d\d/g, "");
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

    const handlePdfDownload = () => {
        if (!event) return;
        generatePotluckPdf(event);
        trackEvent('potluck_pdf_download');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={40}/></div>;
    if (error || !event) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

    const styles = THEME_STYLES[event.theme || 'classic'] || THEME_STYLES.classic;
    const shareLink = window.location.href.split('#')[0] + `#id=${publicId}`;
    const organizerLink = window.location.href; // Since we are in the admin view, the current URL has the key
    
    // Privacy Helper: Determine what name to display
    const getDisplayName = (dish: any) => {
        if (isAdmin || myDishKeys[dish.id]) return dish.guestName;
        if (event.hideNamesFromGuests) return "A Guest";
        return dish.guestName;
    };

    // Determine Welcome Back Name
    const myExistingDish = event.dishes.find(d => myDishKeys[d.id]);
    const welcomeBackName = myExistingDish ? myExistingDish.guestName : null;

    // --- WELCOME SCREEN (GATEKEEPER) ---
    if (!hasEntered) {
        return (
            <div 
                className={`min-h-screen flex items-center justify-center p-4 ${styles.bg}`}
                style={{ 
                    backgroundImage: styles.pattern,
                    backgroundSize: '40px 40px' 
                }}
            >
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border-4 border-white/50 animate-fade-in relative overflow-hidden">
                    {event.theme === 'spooky' && (
                        <div className="absolute top-2 right-4 text-4xl animate-bounce opacity-80">👻</div>
                    )}
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Utensils className="text-white w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 font-serif mb-2">{event.title}</h1>
                    <p className="text-slate-500 font-medium mb-6">Hosted by {event.hostName}</p>
                    
                    {welcomeBackName && (
                        <div className="bg-green-50 text-green-800 p-3 rounded-xl mb-6 font-bold text-sm flex items-center justify-center gap-2 border border-green-200">
                             <CheckCircle size={16} /> Welcome back, {welcomeBackName}!
                        </div>
                    )}
                    
                    <div className="bg-slate-50 rounded-xl p-4 mb-8 border border-slate-100 text-sm text-slate-600">
                        <p className="flex items-center justify-center gap-2 mb-2"><Calendar size={16}/> {new Date(event.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                        {event.time && <p className="flex items-center justify-center gap-2"><Clock size={16}/> {event.time}</p>}
                    </div>

                    <button 
                        onClick={() => setHasEntered(true)}
                        className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:opacity-90 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 ${styles.accentBtn}`}
                    >
                         View Sign-Up Sheet <ArrowRight />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div 
            className={`min-h-screen pb-24 ${styles.bg}`}
            style={{ 
                backgroundImage: styles.pattern,
                backgroundSize: '40px 40px' 
            }}
        >
            {event.theme === 'spooky' && (
                 <div className="fixed top-20 right-10 text-6xl animate-pulse pointer-events-none opacity-40 z-0">👻</div>
            )}
            
            {/* PAGE-WITHIN-PAGE CONTAINER */}
            <div className="max-w-5xl mx-auto p-4 md:p-6 relative z-10">
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border-4 border-white/50 p-6 md:p-10">
                    
                    {toastMsg && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-2 animate-fade-in">
                            <Check size={18} className="text-green-400"/> {toastMsg}
                        </div>
                    )}

                    {/* --- HEADER CARD --- */}
                    <div className={`bg-white rounded-2xl shadow-md overflow-hidden mb-8 border ${styles.cardBorder}`}>
                        <div className={`${styles.headerBg} p-8 text-center text-white relative group`}>
                            {isAdmin && (
                                <button 
                                    onClick={openEditModal} 
                                    className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-white transition-colors flex items-center gap-2 text-xs font-bold" 
                                    title="Edit Event Details"
                                >
                                    <Edit2 size={14} /> Edit Event
                                </button>
                            )}
                            
                            {timeLeft && (
                                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 animate-pulse">
                                    <Timer size={14}/> {timeLeft.days} {timeLeft.label} Until Feast
                                </div>
                            )}
                            
                            <h1 className="text-3xl md:text-5xl font-black font-serif mb-2 drop-shadow-sm">{event.title}</h1>
                            
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
                                    <MapPin size={16} className="text-white" />
                                    {event.location}
                                </a>
                            )}
                            
                            {event.dietaryNotes && (
                                <div className="mt-4 flex justify-center">
                                    <div className="inline-flex items-center gap-2 bg-yellow-500/20 backdrop-blur px-4 py-2 rounded-lg text-sm font-bold border border-yellow-400/50 text-white">
                                        <AlertCircle size={16} className="text-yellow-300" />
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
                            <div className={`p-6 ${styles.bg} ${styles.headerText} text-center border-b ${styles.cardBorder} italic relative group`}>
                                "{event.description}"
                            </div>
                        )}
                    </div>

                    {/* --- INVITE & SHARING CARD (Admin Only) --- */}
                    {isAdmin && (
                        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 mb-6 transform hover:-translate-y-1 transition-transform duration-300">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className={`flex-shrink-0 p-4 rounded-full text-white shadow-lg ${styles.headerBg}`}>
                                    <Share2 size={24} />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-xl font-bold text-slate-800">Invite Your Guests</h3>
                                    <p className="text-slate-600 text-sm mt-1">Send this public link to your guests so they can sign up!</p>
                                </div>
                                <button 
                                    onClick={() => copyLink(shareLink)} 
                                    className={`px-6 py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-95 flex items-center gap-2 w-full md:w-auto justify-center ${isCopied ? 'bg-green-600' : `${styles.accentBtn}`}`}
                                >
                                    {isCopied ? <Check size={20}/> : <LinkIcon size={20}/>}
                                    {isCopied ? 'Link Copied!' : 'Copy Guest Link'}
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3 mt-6 border-t pt-4">
                                <button onClick={() => handleShare('sms')} className="flex flex-col items-center gap-1 p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors">
                                    <Smartphone size={20} className="text-blue-500" />
                                    <span className="text-[10px] font-bold uppercase">Text</span>
                                </button>
                                <button onClick={() => handleShare('whatsapp')} className="flex flex-col items-center gap-1 p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors">
                                    <MessageCircle size={20} className="text-green-500" />
                                    <span className="text-[10px] font-bold uppercase">WhatsApp</span>
                                </button>
                                <button onClick={() => handleShare('email')} className="flex flex-col items-center gap-1 p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors">
                                    <Mail size={20} className="text-red-500" />
                                    <span className="text-[10px] font-bold uppercase">Email</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- ADMIN MASTER LINK (Only Visible to Admin) --- */}
                    {isAdmin && (
                        <div className="bg-amber-50 border-2 border-amber-200 border-dashed rounded-xl p-5 mb-10 flex flex-col md:flex-row items-center gap-4 justify-between">
                             <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 text-amber-800 font-bold">
                                    <Lock size={18} /> Organizer Master Key
                                </div>
                                <p className="text-amber-700 text-sm">
                                    This is your private control panel link. <span className="font-extrabold underline">Do not share this.</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <input type="text" readOnly value={organizerLink} className="flex-1 text-xs text-slate-500 border rounded p-2 bg-white truncate outline-none w-full md:w-64" />
                                <button onClick={() => copyLink(organizerLink)} className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded text-xs font-bold flex items-center gap-1 whitespace-nowrap">
                                    <Copy size={14}/> Copy
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- MASTER LIST CONTROLS --- */}
                    <div className="flex flex-wrap justify-between items-end border-b border-slate-200 pb-4 gap-4 mt-8">
                        <div>
                            <h3 className={`font-black text-2xl flex items-center gap-2 font-serif ${styles.headerText}`}>
                                <ChefHat className={styles.iconColor} size={28}/> Master Dish List
                            </h3>
                            {event.hideNamesFromGuests && !isAdmin && (
                                <p className="text-xs text-slate-500 mt-1 italic">Guest names are hidden by the host.</p>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {isAdmin && (
                                <>
                                    <button 
                                        onClick={() => setIsAdminView(!isAdminView)}
                                        className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
                                    >
                                        {isAdminView ? <EyeOff size={14} /> : <Eye size={14} />}
                                        {isAdminView ? 'View as Guest' : 'Back to Admin View'}
                                    </button>
                                    <div className="flex gap-2">
                                         <button 
                                            onClick={downloadCSV}
                                            className="text-xs font-bold text-slate-600 flex items-center gap-1 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                                        >
                                            <Download size={14} /> CSV
                                        </button>
                                        <button 
                                            onClick={handlePdfDownload}
                                            className="text-xs font-bold text-red-600 flex items-center gap-1 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
                                        >
                                            <Download size={14} /> PDF
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        
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
                    </div>

                    {/* --- LIST VIEW --- */}
                    {viewMode === 'list' && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                            <div className={`${styles.headerBg} h-2 w-full`}></div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="p-4 whitespace-nowrap">Dish</th>
                                        <th className="p-4 whitespace-nowrap">Guest</th>
                                        <th className="p-4 whitespace-nowrap">Category</th>
                                        <th className="p-4 whitespace-nowrap">Notes</th>
                                        <th className="p-4 text-right whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {event.dishes.length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">No dishes added yet.</td></tr>
                                    ) : (
                                        event.dishes.map(dish => {
                                            const catName = event.categories.find(c => c.id === dish.categoryId)?.name || 'Unknown';
                                            const isOwner = myDishKeys[dish.id];
                                            return (
                                                <tr key={dish.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 font-bold text-slate-800">{dish.dishName}</td>
                                                    <td className="p-4 text-slate-600">{getDisplayName(dish)}</td>
                                                    <td className="p-4 text-slate-500"><span className="bg-slate-100 px-2 py-1 rounded text-xs whitespace-nowrap">{catName}</span></td>
                                                    <td className="p-4">
                                                        <div className="flex gap-1">
                                                            {dish.dietary.map(d => (
                                                                <span key={d} className="text-[10px] bg-white border px-1.5 py-0.5 rounded whitespace-nowrap">{DIETARY_OPTIONS.find(o=>o.id===d)?.icon}</span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {(isAdmin || isOwner) && (
                                                            <div className="flex justify-end gap-2">
                                                                 <button 
                                                                    onClick={() => openEditDishModal(dish)} 
                                                                    className={`text-slate-400 hover:text-blue-500 p-1 ${isEditLocked && !isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    disabled={isEditLocked && !isAdmin}
                                                                    title="Edit"
                                                                >
                                                                    <Pencil size={16}/>
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteDish(dish.id)} 
                                                                    className={`text-slate-400 hover:text-red-500 p-1 ${isEditLocked && !isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    disabled={isEditLocked && !isAdmin}
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={16}/>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                    
                    {/* --- CARD VIEW --- */}
                    {viewMode === 'cards' && (
                        <div className="space-y-8">
                            {event.categories.map(category => {
                                const categoryDishes = event.dishes.filter(d => d.categoryId === category.id);
                                const limit = category.limit || 0;
                                const isFull = limit > 0 && categoryDishes.length >= limit;
                                
                                return (
                                    <div key={category.id} className={`bg-white rounded-2xl shadow-sm border ${styles.cardBorder} overflow-hidden`}>
                                        {/* Category Header */}
                                        <div className={`p-4 border-b ${styles.cardBorder} ${styles.bg} flex justify-between items-center`}>
                                            <h3 className={`font-bold text-xl font-serif ${styles.headerText}`}>{category.name}</h3>
                                            {limit > 0 ? (
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${isFull ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                    {categoryDishes.length} / {limit} Filled
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unlimited</span>
                                            )}
                                        </div>
                                        
                                        {/* REQUESTED ITEMS SECTION - REDESIGNED */}
                                        {category.requestedItems && category.requestedItems.length > 0 && (
                                            <div className="p-4 bg-yellow-50/50 border-b border-yellow-100">
                                                <p className="text-xs font-bold text-yellow-700 uppercase mb-3 flex items-center gap-1"><Flag size={12}/> Host Requested:</p>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {category.requestedItems.map(req => {
                                                        const isTaken = !!req.takenByDishId;
                                                        const takenByDish = isTaken ? event.dishes.find(d => d.id === req.takenByDishId) : null;
                                                        const takenName = takenByDish ? getDisplayName(takenByDish) : 'Taken';

                                                        return (
                                                            <button 
                                                                key={req.id} 
                                                                onClick={() => !isTaken && openAddModal(category, req)}
                                                                disabled={isTaken}
                                                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all group relative overflow-hidden ${
                                                                    isTaken 
                                                                    ? 'bg-slate-50 border-slate-200 cursor-default opacity-60' 
                                                                    : 'bg-white border-dashed border-yellow-300 hover:bg-yellow-50 hover:border-yellow-500 hover:shadow-md cursor-pointer'
                                                                }`}
                                                            >
                                                                {isTaken && (
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 backdrop-blur-[1px] z-10">
                                                                         <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">Taken by {takenName}</span>
                                                                    </div>
                                                                )}
                                                                
                                                                <span className="font-bold text-slate-800 text-lg mb-2">{req.name}</span>
                                                                
                                                                {!isTaken && (
                                                                    <>
                                                                        <div className="bg-yellow-100 text-yellow-700 rounded-full p-1.5 group-hover:scale-110 transition-transform mb-1">
                                                                           <Plus size={18} />
                                                                        </div>
                                                                        <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider">Bring This</span>
                                                                    </>
                                                                )}
                                                            </button>
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
                                                            <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-xs">by {getDisplayName(dish)}</span>
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
                                                    {(isAdmin || myDishKeys[dish.id]) && (
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => openEditDishModal(dish)} 
                                                                className={`text-slate-300 hover:text-blue-500 p-2 transition-colors ${isEditLocked && !isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                disabled={isEditLocked && !isAdmin}
                                                            >
                                                                <Pencil size={18} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteDish(dish.id)} 
                                                                className={`text-slate-300 hover:text-red-500 p-2 transition-colors ${isEditLocked && !isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                disabled={isEditLocked && !isAdmin}
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            
                                            {categoryDishes.length === 0 && (
                                                <div className="p-6 text-center text-slate-400 italic text-sm">
                                                    No dishes yet. Be the first!
                                                </div>
                                            )}
                                        </div>

                                        {/* ADD BUTTON ALWAYS VISIBLE IN CARDS */}
                                        <div className="p-3 bg-slate-50/50 border-t border-slate-100">
                                            <button 
                                                onClick={() => openAddModal(category)}
                                                disabled={isFull}
                                                className={`w-full py-3 rounded-xl border-2 border-dashed font-bold flex items-center justify-center gap-2 transition-all ${
                                                    isFull 
                                                    ? 'border-slate-200 text-slate-400 cursor-not-allowed' 
                                                    : `border-slate-300 text-slate-500 hover:bg-white hover:${styles.cardBorder} hover:text-slate-800`
                                                }`}
                                            >
                                                {isFull ? (
                                                    <span className="flex items-center gap-2"><Lock size={16}/> Category Full</span>
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        <Plus size={18}/> 
                                                        {categoryDishes.length === 0 ? `Add the First ${category.name.replace(/s$/, '')}` : 'Bring Something Else'}
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    
                    {/* Floating Action Button for List View */}
                    {viewMode === 'list' && (
                         <div className="fixed bottom-6 right-6 z-40">
                            <div className="relative group">
                                <button 
                                    className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white ${styles.accentBtn} transition-transform hover:scale-110`}
                                    onClick={() => {
                                        const firstOpenCat = event.categories.find(c => {
                                            const limit = c.limit || 0;
                                            const count = event.dishes.filter(d => d.categoryId === c.id).length;
                                            return limit === 0 || count < limit;
                                        });
                                        if(firstOpenCat) openAddModal(firstOpenCat);
                                    }}
                                >
                                    <Plus size={28} />
                                </button>
                            </div>
                         </div>
                    )}

                    <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="1234567890" data-ad-format="auto" data-full-width-responsive="true" />

                    {/* ADD/EDIT DISH MODAL */}
                    {showAddModal && selectedCategory && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
                                <div className={`${styles.modalHeader} p-4 flex justify-between items-center text-white`}>
                                    <h3 className="font-bold flex items-center gap-2">
                                        <Utensils size={20}/> {editingDishId ? 'Edit Dish' : dishForm.fulfillmentId ? 'I\'ll Bring This!' : 'Bring a Dish'}
                                    </h3>
                                    <button onClick={() => setShowAddModal(false)}><X size={24}/></button>
                                </div>
                                
                                <div className="p-6 space-y-4">
                                    {dishForm.fulfillmentId && !editingDishId && (
                                        <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm font-medium border border-yellow-200 flex items-center gap-2">
                                            <Check size={16} /> You are signing up to bring: <strong>{dishForm.dish}</strong>
                                        </div>
                                    )}
                                    
                                    {viewMode === 'list' && !editingDishId && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                                            <select 
                                                value={selectedCategory.id}
                                                onChange={e => {
                                                    const cat = event.categories.find(c => c.id === e.target.value);
                                                    if(cat) setSelectedCategory(cat);
                                                }}
                                                className="w-full p-3 border rounded-lg outline-none bg-slate-50"
                                                disabled={!!dishForm.fulfillmentId}
                                            >
                                                {event.categories.map(c => {
                                                    const limit = c.limit || 0;
                                                    const currentCount = event.dishes.filter(d => d.categoryId === c.id).length;
                                                    const isFull = limit > 0 && currentCount >= limit;
                                                    return (
                                                        <option key={c.id} value={c.id} disabled={isFull}>
                                                            {c.name} {limit > 0 ? `(${currentCount}/${limit})` : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Your Name</label>
                                        <input 
                                            autoFocus
                                            type="text" 
                                            value={dishForm.name}
                                            onChange={e => setDishForm({...dishForm, name: e.target.value})}
                                            className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-orange-400 transition"
                                            placeholder="e.g. Sarah"
                                        />
                                    </div>
                                    
                                    {!dishForm.fulfillmentId && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dish Name</label>
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    value={dishForm.dish}
                                                    onChange={e => setDishForm({...dishForm, dish: e.target.value})}
                                                    className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-orange-400 transition"
                                                    placeholder="e.g. Deviled Eggs"
                                                />
                                                <button 
                                                    onClick={() => setDishForm({...dishForm, dish: SUGGESTIONS[Math.floor(Math.random()*SUGGESTIONS.length)]})}
                                                    className="absolute right-2 top-2 text-xs text-orange-500 font-bold bg-orange-50 px-2 py-1 rounded hover:bg-orange-100"
                                                >
                                                    Suggestion?
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Dietary Info (Optional)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {DIETARY_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => toggleDietary(opt.id)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${dishForm.dietary.includes(opt.id) ? opt.color + ' ring-2 ring-offset-1' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white'}`}
                                                >
                                                    {opt.icon} {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleSaveDish}
                                        disabled={!dishForm.name || !dishForm.dish || isSubmitting}
                                        className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 ${styles.accentBtn} disabled:opacity-50`}
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin"/> : editingDishId ? 'Save Changes' : 'Bring It!'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SUCCESS MODAL */}
                    {showSuccessModal && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                    <Check size={32} strokeWidth={3} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-2">Dish Added!</h3>
                                <p className="text-slate-500 mb-6">Thanks for signing up!</p>
                                
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-6 text-left">
                                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1"><Lock size={12}/> Edit Link (Save This!)</p>
                                    <p className="text-xs text-blue-600 mb-3 leading-relaxed">
                                        If you need to change your dish from another device, you'll need this private link.
                                    </p>
                                    <div className="flex gap-2">
                                        <input type="text" readOnly value={lastAddedDishLink} className="flex-1 p-2 text-xs bg-white border border-blue-200 rounded text-slate-500 truncate" />
                                        <button 
                                            onClick={() => copyLink(lastAddedDishLink)}
                                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${isCopied ? 'bg-green-600 text-white' : 'bg-blue-200 text-blue-800 hover:bg-blue-300'}`}
                                        >
                                            {isCopied ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center mb-6">
                                    <p className="text-xs text-slate-800 mb-2 font-bold uppercase">Pro Tip</p>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        If you ever return and see a blank page, try opening in Incognito mode or clearing your cache. Browsers sometimes hold onto old versions!
                                    </p>
                                </div>

                                <button onClick={() => setShowSuccessModal(false)} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800">
                                    Done
                                </button>
                            </div>
                        </div>
                    )}

                    {/* EDIT EVENT MODAL */}
                    {showEditEventModal && isAdmin && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                                <div className={`${styles.modalHeader} p-4 flex justify-between items-center text-white`}>
                                    <h3 className="font-bold">Edit Event Details</h3>
                                    <button onClick={() => setShowEditEventModal(false)}><X size={24}/></button>
                                </div>
                                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Event Name</label>
                                        <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full p-3 border rounded-lg"/>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                                            <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} className="w-full p-3 border rounded-lg"/>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Time</label>
                                            <input type="text" value={editForm.time} onChange={e => setEditForm({...editForm, time: e.target.value})} className="w-full p-3 border rounded-lg"/>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                                        <input type="text" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} className="w-full p-3 border rounded-lg"/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dietary Notes</label>
                                        <input type="text" value={editForm.dietaryNotes} onChange={e => setEditForm({...editForm, dietaryNotes: e.target.value})} className="w-full p-3 border rounded-lg"/>
                                    </div>
                                    
                                    <div className="pt-4 border-t space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm">Allow Guest Editing</span>
                                            <input type="checkbox" checked={editForm.allowGuestEditing} onChange={e => setEditForm({...editForm, allowGuestEditing: e.target.checked})} className="w-5 h-5"/>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm">Hide Guest Names (Privacy)</span>
                                            <input type="checkbox" checked={editForm.hideNamesFromGuests} onChange={e => setEditForm({...editForm, hideNamesFromGuests: e.target.checked})} className="w-5 h-5"/>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lock Editing Before Event</label>
                                            <select value={editForm.editLockDays} onChange={e => setEditForm({...editForm, editLockDays: parseInt(e.target.value)})} className="w-full p-2 border rounded">
                                                <option value={0}>Never Lock</option>
                                                <option value={1}>1 Day Before</option>
                                                <option value={2}>2 Days Before</option>
                                                <option value={3}>3 Days Before</option>
                                                <option value={5}>5 Days Before</option>
                                                <option value={7}>1 Week Before</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                                    <button onClick={() => setShowEditEventModal(false)} className="px-4 py-2 text-slate-500 font-bold">Cancel</button>
                                    <button onClick={handleUpdateEvent} disabled={isSubmitting} className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg">{isSubmitting ? 'Saving...' : 'Save Changes'}</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PotluckDashboard;