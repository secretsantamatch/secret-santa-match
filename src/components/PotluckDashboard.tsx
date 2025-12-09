
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, User, ChefHat, Plus, Copy, Lock, Utensils, X, Check, Loader2, Sparkles, AlertCircle, Trash2, MapPin, Clock, CalendarCheck, Link as LinkIcon, Share2, List, Grid, Edit2, Eye, EyeOff, Save, Download, Timer, ExternalLink, Flag, Smartphone, MessageCircle, Mail } from 'lucide-react';
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

// --- UPGRADED THEME ENGINE ---
// Uses CSS background patterns for distinct looks
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
        pattern: 'radial-gradient(#fed7aa 1px, transparent 1px) 0 0/20px 20px', // Simple dots
        iconColor: 'text-orange-500', 
        modalHeader: 'bg-gradient-to-r from-orange-600 to-amber-600' 
    },
    picnic: { 
        bg: 'bg-emerald-50', 
        headerBg: 'bg-gradient-to-r from-emerald-600 to-green-600', 
        headerText: 'text-emerald-900', 
        accentBtn: 'bg-emerald-600 hover:bg-emerald-700', 
        cardBorder: 'border-emerald-200', 
        // Green Gingham
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
        // Subtle Grid
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
        // Zig Zag
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
        pattern: '', // Plain
        iconColor: 'text-gray-600', 
        modalHeader: 'bg-black' 
    },
    thanksgiving: { 
        bg: 'bg-amber-50', 
        headerBg: 'bg-gradient-to-r from-amber-700 to-orange-800', 
        headerText: 'text-amber-900', 
        accentBtn: 'bg-amber-700 hover:bg-amber-800', 
        cardBorder: 'border-amber-200', 
        // Dotted Fall
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
        // Candy Cane Stripes
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
        // Red Gingham
        pattern: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #fca5a5 19px, #fca5a5 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #fca5a5 19px, #fca5a5 20px)', 
        iconColor: 'text-red-700', 
        modalHeader: 'bg-gradient-to-r from-red-700 to-red-900' 
    },
    spooky: { 
        bg: 'bg-slate-900', 
        headerBg: 'bg-gradient-to-r from-purple-900 to-orange-700', 
        headerText: 'text-purple-100', 
        accentBtn: 'bg-orange-600 hover:bg-orange-700', 
        cardBorder: 'border-purple-900 bg-slate-800 text-white', 
        // Dark Stripes
        pattern: 'repeating-linear-gradient(45deg, #1e293b 0, #1e293b 10px, #0f172a 10px, #0f172a 20px)', 
        iconColor: 'text-orange-500', 
        modalHeader: 'bg-gradient-to-r from-purple-900 to-orange-700' 
    },
    baby: { 
        bg: 'bg-sky-50', 
        headerBg: 'bg-gradient-to-r from-sky-400 to-blue-500', 
        headerText: 'text-sky-900', 
        accentBtn: 'bg-sky-500 hover:bg-sky-600', 
        cardBorder: 'border-sky-200', 
        // Polka Dots
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
    
    // View State for Admin - Default to 'list' based on feedback
    const [viewMode, setViewMode] = useState<'cards' | 'list'>('list');
    const [isAdminView, setIsAdminView] = useState(false); 
    
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
        const stored = localStorage.getItem(`potluck_keys_${publicId}`);
        if (stored) {
            try {
                setMyDishKeys(JSON.parse(stored));
            } catch (e) {}
        }

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
        } catch (e: any) {
             if (e.message?.includes("Locked")) {
                alert("Editing is now locked for this event.");
             } else {
                alert("Failed to delete.");
             }
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

    const isAdmin = !!adminKey;
    const styles = THEME_STYLES[event.theme || 'classic'] || THEME_STYLES.classic;
    const shareLink = window.location.href.split('#')[0] + `#id=${publicId}`;
    const organizerLink = window.location.href; // Since we are in the admin view, the current URL has the key
    
    // Privacy Helper: Determine what name to display
    const getDisplayName = (dish: any) => {
        if (isAdmin || myDishKeys[dish.id]) return dish.guestName;
        if (event.hideNamesFromGuests) return "A Guest";
        return dish.guestName;
    };

    return (
        <div 
            className={`min-h-screen pb-24 ${styles.bg}`}
            style={{ 
                backgroundImage: styles.pattern,
                backgroundSize: '40px 40px' 
            }}
        >
            {/* ADMIN TOOLBAR - HIGH CONTRAST */}
            {isAdmin && (
                <div className="bg-[#1a1a1a] text-yellow-400 p-3 sticky top-0 z-50 shadow-md border-b-2 border-yellow-500">
                    <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="bg-yellow-500 text-black text-[11px] font-black px-2 py-0.5 rounded uppercase tracking-wider">ADMIN</span>
                            <span className="font-bold text-white">You are the Organizer.</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="hidden sm:inline text-white/70 text-xs">Save this link to manage your event.</span>
                            <button 
                                onClick={() => copyLink(organizerLink)}
                                className="flex items-center gap-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded border border-yellow-500/50 transition-colors text-xs font-bold"
                            >
                                <Lock size={12}/> {isCopied ? 'Link Saved!' : 'Copy Admin Link'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto p-4 md:p-8 relative z-10">
                
                {toastMsg && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-2 animate-fade-in">
                        <Check size={18} className="text-green-400"/> {toastMsg}
                    </div>
                )}

                {/* --- HEADER CARD --- */}
                <div className={`bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border ${styles.cardBorder}`}>
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

                {/* --- INVITE & SHARING CARD (For Everyone) --- */}
                {/* Changed: Always visible but styled differently for admin/guest to encourage sharing */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-slate-100 mb-10 transform hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className={`flex-shrink-0 p-4 rounded-full text-white shadow-lg ${styles.headerBg}`}>
                            <Share2 size={24} />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-xl font-bold text-slate-800">Invite Your Guests</h3>
                            <p className="text-slate-600 text-sm mt-1">Send this public link to your friends so they can sign up!</p>
                        </div>
                        <button 
                            onClick={() => copyLink(shareLink)} 
                            className={`px-6 py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-95 flex items-center gap-2 w-full md:w-auto justify-center ${isCopied ? 'bg-green-600' : `${styles.accentBtn}`}`}
                        >
                            {isCopied ? <Check size={20}/> : <LinkIcon size={20}/>}
                            {isCopied ? 'Link Copied!' : 'Copy Guest Link'}
                        </button>
                    </div>
                    
                    {/* Expanded Sharing Options */}
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
                            <button 
                                onClick={() => setIsAdminView(!isAdminView)}
                                className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
                            >
                                {isAdminView ? <EyeOff size={14} /> : <Eye size={14} />}
                                {isAdminView ? 'View as Guest' : 'Back to Admin View'}
                            </button>
                        )}
                        
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

                {/* --- LIST VIEW (Default) --- */}
                {viewMode === 'list' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className={`${styles.headerBg} text-white font-bold uppercase text-xs`}>
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
                                                        <button 
                                                            onClick={() => handleDeleteDish(dish.id)} 
                                                            className={`text-slate-300 hover:text-red-500 p-1 ${isEditLocked && !isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            title={isEditLocked && !isAdmin ? 'Editing Locked' : 'Delete'}
                                                        >
                                                            {isEditLocked && !isAdmin ? <Lock size={16}/> : <Trash2 size={16}/>}
                                                        </button>
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
                            const isFull = category.limit ? categoryDishes.length >= category.limit : false;
                            
                            return (
                                <div key={category.id} className={`bg-white rounded-2xl shadow-sm border ${styles.cardBorder} overflow-hidden`}>
                                    {/* Category Header */}
                                    <div className={`p-4 border-b ${styles.cardBorder} ${styles.bg} flex justify-between items-center`}>
                                        <h3 className={`font-bold text-xl font-serif ${styles.headerText}`}>{category.name}</h3>
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
                                                    const takenByDish = isTaken ? event.dishes.find(d => d.id === req.takenByDishId) : null;
                                                    const takenName = takenByDish ? getDisplayName(takenByDish) : 'Taken';

                                                    return (
                                                        <div key={req.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${isTaken ? 'bg-slate-100 text-slate-400 border-slate-200 line-through decoration-slate-400' : 'bg-white border-yellow-200 text-slate-700 shadow-sm'}`}>
                                                            <span>{req.name}</span>
                                                            {isTaken ? (
                                                                <span className="text-[10px] no-underline bg-slate-200 px-1.5 rounded text-slate-500">
                                                                    {takenName}
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
                                                    <button 
                                                        onClick={() => handleDeleteDish(dish.id)} 
                                                        className={`text-slate-300 hover:text-red-500 p-2 transition-colors ${isEditLocked && !isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        title={isEditLocked && !isAdmin ? 'Editing Locked' : 'Delete'}
                                                    >
                                                        {isEditLocked && !isAdmin ? <Lock size={16}/> : <Trash2 size={18} />}
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
                                            {isFull ? <span className="flex items-center gap-2"><Lock size={16}/> Category Full</span> : <span className="flex items-center gap-2"><Plus size={18}/> Bring Something Else</span>}
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
                                    // Default to first non-full category
                                    const firstOpenCat = event.categories.find(c => !c.limit || event.dishes.filter(d => d.categoryId === c.id).length < c.limit);
                                    if(firstOpenCat) openAddModal(firstOpenCat);
                                }}
                            >
                                <Plus size={28} />
                            </button>
                            {/* Category Quick Select Menu could go here, but keeping it simple for now */}
                        </div>
                     </div>
                )}

                <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="1234567890" data-ad-format="auto" data-full-width-responsive="true" />

                {/* ADD DISH MODAL */}
                {showAddModal && selectedCategory && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
                            <div className={`${styles.modalHeader} p-4 flex justify-between items-center text-white`}>
                                <h3 className="font-bold flex items-center gap-2"><Utensils size={20}/> {dishForm.fulfillmentId ? 'I\'ll Bring This!' : 'Bring a Dish'}</h3>
                                <button onClick={() => setShowAddModal(false)}><X size={24}/></button>
                            </div>
                            
                            <div className="p-6 space-y-4">
                                {dishForm.fulfillmentId && (
                                    <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm font-medium border border-yellow-200 flex items-center gap-2">
                                        <Check size={16} /> You are signing up to bring: <strong>{dishForm.dish}</strong>
                                    </div>
                                )}
                                
                                {viewMode === 'list' && (
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
                                            {event.categories.map(c => (
                                                <option key={c.id} value={c.id} disabled={c.limit > 0 && event.dishes.filter(d => d.categoryId === c.id).length >= c.limit}>
                                                    {c.name} {c.limit > 0 ? `(${event.dishes.filter(d => d.categoryId === c.id).length}/${c.limit})` : ''}
                                                </option>
                                            ))}
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
                                        readOnly={!!dishForm.fulfillmentId} 
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
                                    className={`w-full ${styles.accentBtn} text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none`}
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
                            <div className={`${styles.modalHeader} p-4 flex justify-between items-center text-white`}>
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
                                
                                <div className="border-t pt-4 space-y-3">
                                    <h4 className="text-sm font-bold text-slate-800">Privacy & Editing Settings</h4>
                                    
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-600">Hide Guest Names</label>
                                        <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                                            <input type="checkbox" name="toggleNames" id="toggleNames" checked={editForm.hideNamesFromGuests} onChange={e => setEditForm({...editForm, hideNamesFromGuests: e.target.checked})} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                                            <label htmlFor="toggleNames" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${editForm.hideNamesFromGuests ? 'bg-green-500' : 'bg-gray-300'}`}></label>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 -mt-2">If checked, guests will see "A Guest" instead of names.</p>
                                    
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-600">Allow Guest Editing</label>
                                        <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                                            <input type="checkbox" name="toggleEdit" id="toggleEdit" checked={editForm.allowGuestEditing} onChange={e => setEditForm({...editForm, allowGuestEditing: e.target.checked})} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                                            <label htmlFor="toggleEdit" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${editForm.allowGuestEditing ? 'bg-green-500' : 'bg-gray-300'}`}></label>
                                        </div>
                                    </div>

                                    {editForm.allowGuestEditing && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lock editing X days before:</label>
                                            <select 
                                                value={editForm.editLockDays}
                                                onChange={e => setEditForm({...editForm, editLockDays: parseInt(e.target.value)})}
                                                className="w-full p-2 border rounded text-sm"
                                            >
                                                <option value={0}>Never</option>
                                                <option value={1}>1 Day</option>
                                                <option value={2}>2 Days</option>
                                                <option value={7}>1 Week</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                                
                                <button 
                                    onClick={handleUpdateEvent}
                                    disabled={isSubmitting}
                                    className={`w-full ${styles.accentBtn} text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 mt-4`}
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} />} Save Changes
                                </button>
                                <style>{`
                                    .toggle-checkbox:checked { right: 0; border-color: #22c55e; }
                                    .toggle-checkbox { right: auto; left: 0; border-color: #d1d5db; transition: all 0.3s; }
                                `}</style>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default PotluckDashboard;
