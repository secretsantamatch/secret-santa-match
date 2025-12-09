
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, User, ChefHat, Plus, Copy, Lock, Utensils, X, Check, Loader2, Sparkles, AlertCircle, Trash2, MapPin, Clock, CalendarCheck, Link as LinkIcon, Share2, List, Grid, Edit2, Eye, EyeOff, Save, Download, Timer, ExternalLink, Flag, Smartphone, MessageCircle, Mail, ArrowRight, Pencil, Ghost, CheckCircle, Shield, Settings, Trophy, Heart } from 'lucide-react';
import { getPotluck, addDish, removeDish, updatePotluckEvent, voteForDish } from '../services/potluckService';
import type { PotluckEvent, PotluckCategory, PotluckTheme } from '../types';
import { trackEvent } from '../services/analyticsService';
import { generatePotluckPdf } from '../services/pdfService';
import AdBanner from './AdBanner';
import confetti from 'canvas-confetti';

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

// --- AWARD-WINNING THEME ENGINE ---
// Rich gradients, subtle patterns, and coordinated UI elements
const THEME_STYLES: Record<PotluckTheme, { 
    bg: string, 
    glass: string,
    headerGradient: string, 
    headerText: string,
    accentBtn: string,
    cardBorder: string,
    pattern: string,
    iconColor: string,
    progressBar: string,
}> = {
    classic: { 
        bg: 'bg-[#fff7ed]', 
        glass: 'bg-white/80 backdrop-blur-md border-orange-100/50',
        headerGradient: 'bg-gradient-to-br from-orange-500 to-red-600', 
        headerText: 'text-orange-950', 
        accentBtn: 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-orange-500/30', 
        cardBorder: 'border-orange-100', 
        pattern: 'radial-gradient(#fed7aa 1px, transparent 1px) 0 0/20px 20px', 
        iconColor: 'text-orange-600', 
        progressBar: 'bg-orange-500'
    },
    picnic: { 
        bg: 'bg-emerald-50', 
        glass: 'bg-white/80 backdrop-blur-md border-emerald-100/50',
        headerGradient: 'bg-gradient-to-br from-emerald-500 to-green-700', 
        headerText: 'text-emerald-950', 
        accentBtn: 'bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 shadow-emerald-500/30', 
        cardBorder: 'border-emerald-100', 
        pattern: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #d1fae5 19px, #d1fae5 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #d1fae5 19px, #d1fae5 20px)', 
        iconColor: 'text-emerald-600',
        progressBar: 'bg-emerald-500'
    },
    corporate: { 
        bg: 'bg-slate-100', 
        glass: 'bg-white/90 backdrop-blur-xl border-slate-200/50',
        headerGradient: 'bg-gradient-to-br from-slate-700 to-slate-900', 
        headerText: 'text-slate-900', 
        accentBtn: 'bg-slate-800 hover:bg-slate-900 shadow-slate-500/30', 
        cardBorder: 'border-slate-200', 
        pattern: 'linear-gradient(#cbd5e1 1px, transparent 1px) 0 0/40px 40px, linear-gradient(90deg, #cbd5e1 1px, transparent 1px) 0 0/40px 40px',
        iconColor: 'text-slate-600',
        progressBar: 'bg-slate-600'
    },
    fiesta: { 
        bg: 'bg-rose-50', 
        glass: 'bg-white/80 backdrop-blur-md border-rose-100/50',
        headerGradient: 'bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500', 
        headerText: 'text-rose-950', 
        accentBtn: 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 shadow-pink-500/30', 
        cardBorder: 'border-rose-100', 
        pattern: 'linear-gradient(135deg, #fbcfe8 25%, transparent 25%) -10px 0/20px 20px, linear-gradient(225deg, #fbcfe8 25%, transparent 25%) -10px 0/20px 20px', 
        iconColor: 'text-pink-600',
        progressBar: 'bg-pink-500'
    },
    minimal: { 
        bg: 'bg-gray-50', 
        glass: 'bg-white border-gray-100',
        headerGradient: 'bg-black', 
        headerText: 'text-gray-900', 
        accentBtn: 'bg-black hover:bg-gray-800 shadow-xl', 
        cardBorder: 'border-gray-200', 
        pattern: '', 
        iconColor: 'text-black',
        progressBar: 'bg-black'
    },
    thanksgiving: { 
        bg: 'bg-amber-50', 
        glass: 'bg-white/80 backdrop-blur-md border-amber-100/50',
        headerGradient: 'bg-gradient-to-br from-amber-700 to-orange-800', 
        headerText: 'text-amber-950', 
        accentBtn: 'bg-gradient-to-r from-amber-700 to-orange-800 hover:from-amber-800 hover:to-orange-900 shadow-amber-500/30', 
        cardBorder: 'border-amber-100', 
        pattern: 'radial-gradient(#d97706 0.5px, transparent 0.5px) 0 0/12px 12px', 
        iconColor: 'text-amber-700',
        progressBar: 'bg-amber-700'
    },
    christmas: { 
        bg: 'bg-red-50', 
        glass: 'bg-white/90 backdrop-blur-md border-red-100/50',
        headerGradient: 'bg-gradient-to-br from-red-700 via-red-600 to-green-700', 
        headerText: 'text-red-950', 
        accentBtn: 'bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 shadow-red-500/30', 
        cardBorder: 'border-red-100', 
        pattern: 'repeating-linear-gradient(45deg, #fee2e2 0, #fee2e2 10px, #fecaca 10px, #fecaca 20px)', 
        iconColor: 'text-red-700',
        progressBar: 'bg-red-600'
    },
    bbq: { 
        bg: 'bg-stone-100', 
        glass: 'bg-white/90 backdrop-blur-md border-stone-200/50',
        headerGradient: 'bg-gradient-to-br from-red-700 to-stone-800', 
        headerText: 'text-red-950', 
        accentBtn: 'bg-red-700 hover:bg-red-800 shadow-red-500/30', 
        cardBorder: 'border-red-200', 
        pattern: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #fca5a5 19px, #fca5a5 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #fca5a5 19px, #fca5a5 20px)', 
        iconColor: 'text-red-700',
        progressBar: 'bg-red-700'
    },
    spooky: { 
        bg: 'bg-slate-950', 
        glass: 'bg-slate-900/80 backdrop-blur-md border-purple-900/50 text-white',
        headerGradient: 'bg-gradient-to-br from-purple-900 via-slate-900 to-orange-700', 
        headerText: 'text-purple-100', 
        accentBtn: 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/30 text-white', 
        cardBorder: 'border-purple-900/50', 
        pattern: 'radial-gradient(circle at 50% 50%, #1e1b4b 0%, #020617 100%)', 
        iconColor: 'text-orange-500',
        progressBar: 'bg-orange-500'
    },
    baby: { 
        bg: 'bg-sky-50', 
        glass: 'bg-white/80 backdrop-blur-md border-sky-100/50',
        headerGradient: 'bg-gradient-to-br from-sky-400 to-blue-500', 
        headerText: 'text-sky-950', 
        accentBtn: 'bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 shadow-sky-500/30', 
        cardBorder: 'border-sky-100', 
        pattern: 'radial-gradient(#bae6fd 2px, transparent 2px) 0 0/30px 30px', 
        iconColor: 'text-sky-500',
        progressBar: 'bg-sky-400'
    },
    easter: { 
        bg: 'bg-purple-50', 
        glass: 'bg-white/90 backdrop-blur-md border-purple-100/50',
        headerGradient: 'bg-gradient-to-br from-purple-400 via-pink-400 to-yellow-400', 
        headerText: 'text-purple-900', 
        accentBtn: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-purple-500/30', 
        cardBorder: 'border-purple-100', 
        pattern: 'radial-gradient(circle at 10px 10px, #f472b6 2px, transparent 0), radial-gradient(circle at 30px 30px, #60a5fa 2px, transparent 0)', 
        iconColor: 'text-purple-500',
        progressBar: 'bg-purple-400'
    },
    july4: { 
        bg: 'bg-blue-50', 
        glass: 'bg-white/90 backdrop-blur-md border-blue-100/50',
        headerGradient: 'bg-gradient-to-br from-blue-700 via-white to-red-600', 
        headerText: 'text-blue-900', 
        accentBtn: 'bg-gradient-to-r from-blue-700 to-red-700 hover:from-blue-800 hover:to-red-800 shadow-blue-500/30', 
        cardBorder: 'border-blue-200', 
        pattern: 'repeating-linear-gradient(90deg, #ef4444 0, #ef4444 20px, #ffffff 20px, #ffffff 40px, #3b82f6 40px, #3b82f6 60px, #ffffff 60px, #ffffff 80px)', 
        iconColor: 'text-blue-700',
        progressBar: 'bg-red-600'
    },
    gameday: { 
        bg: 'bg-green-50', 
        glass: 'bg-white/95 backdrop-blur-md border-green-200/50',
        headerGradient: 'bg-gradient-to-b from-green-700 to-green-900', 
        headerText: 'text-green-50', 
        accentBtn: 'bg-stone-800 hover:bg-stone-900 text-white shadow-xl border-2 border-white/20', 
        cardBorder: 'border-green-200', 
        pattern: 'repeating-linear-gradient(180deg, #4ade80 0, #4ade80 48px, #ffffff 48px, #ffffff 50px)', 
        iconColor: 'text-green-800',
        progressBar: 'bg-green-700'
    },
};

const PotluckDashboard: React.FC<PotluckDashboardProps> = ({ publicId, adminKey }) => {
    const [event, setEvent] = useState<PotluckEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [myDishKeys, setMyDishKeys] = useState<Record<string, string>>({});
    const [myVotedDishes, setMyVotedDishes] = useState<Set<string>>(new Set());
    
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
        
        // Load voted dishes
        const voted = localStorage.getItem(`potluck_voted_${publicId}`);
        if (voted) {
            try {
                setMyVotedDishes(new Set(JSON.parse(voted)));
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

    // --- LEADERBOARD LOGIC ---
    const topDishes = useMemo(() => {
        if (!event || !event.votingEnabled || !event.dishes) return [];
        // Sort dishes by votes descending, then by time added
        return [...event.dishes]
            .filter(d => (d.votes || 0) > 0)
            .sort((a, b) => (b.votes || 0) - (a.votes || 0))
            .slice(0, 3); // Top 3
    }, [event]);

    const handleVote = async (dishId: string) => {
        if (myVotedDishes.has(dishId)) return;
        
        // Optimistic UI update
        const currentVotes = event?.dishes.find(d => d.id === dishId)?.votes || 0;
        
        // Update local state to prevent spam
        const newVoted = new Set(myVotedDishes);
        newVoted.add(dishId);
        setMyVotedDishes(newVoted);
        localStorage.setItem(`potluck_voted_${publicId}`, JSON.stringify(Array.from(newVoted)));

        // Optimistically update event state for immediate feedback
        if (event) {
            const newDishes = event.dishes.map(d => 
                d.id === dishId ? { ...d, votes: (d.votes || 0) + 1 } : d
            );
            setEvent({ ...event, dishes: newDishes });
        }

        // Trigger confetti for fun
        confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#f59e0b', '#fbbf24', '#ffffff'] // Gold/Amber theme
        });

        try {
            await voteForDish(publicId, dishId);
            // Re-fetch handled by polling
        } catch (e) {
            console.error("Vote failed", e);
        }
    };

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
            hideNamesFromGuests: event?.hideNamesFromGuests,
            votingEnabled: event?.votingEnabled
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
        const headers = ['Category', 'Dish Name', 'Guest Name', 'Dietary Info', 'Votes'];
        const rows = event.dishes.map(d => {
            const cat = event.categories.find(c => c.id === d.categoryId)?.name || 'Unknown';
            const diet = d.dietary.map(dt => DIETARY_OPTIONS.find(o => o.id === dt)?.label).join(', ');
            return [cat, d.dishName, d.guestName, diet, d.votes || 0].map(field => `"${field}"`).join(',');
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
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border-4 border-white/50 animate-fade-in relative overflow-hidden text-slate-800">
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
            
            {/* MAIN CONTENT CONTAINER */}
            <div className="max-w-5xl mx-auto p-4 md:p-8 relative z-10">
                <div className={`rounded-[2rem] shadow-2xl p-6 md:p-10 border border-white/40 ${styles.glass}`}>
                
                    {toastMsg && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-2 animate-fade-in">
                            <Check size={18} className="text-green-400"/> {toastMsg}
                        </div>
                    )}

                    {/* --- HEADER CARD --- */}
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 transform transition-all hover:scale-[1.01]">
                        <div className={`${styles.headerGradient} p-8 md:p-12 text-center text-white relative overflow-hidden`}>
                            
                            {/* Decorative Shine */}
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

                            {isAdmin && (
                                <button 
                                    onClick={openEditModal} 
                                    className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl text-white transition-all flex items-center gap-2 text-xs font-bold border border-white/20 hover:border-white/50" 
                                    title="Edit Event Details"
                                >
                                    <Settings size={14} /> Edit
                                </button>
                            )}

                            {event.hideNamesFromGuests && !isAdmin && (
                                <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/10">
                                    <Lock size={10} /> Privacy Mode Active
                                </div>
                            )}
                            
                            {timeLeft && (
                                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 animate-pulse shadow-lg">
                                    <Timer size={14}/> {timeLeft.days} {timeLeft.label} Until Feast
                                </div>
                            )}
                            
                            <h1 className="text-4xl md:text-6xl font-black font-serif mb-4 drop-shadow-md tracking-tight leading-tight">{event.title}</h1>
                            
                            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-white/90 font-medium text-sm md:text-base">
                                <span className="flex items-center gap-2 bg-black/10 px-4 py-2 rounded-full backdrop-blur-sm"><Calendar size={16}/> {new Date(event.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                                {event.time && <span className="flex items-center gap-2 bg-black/10 px-4 py-2 rounded-full backdrop-blur-sm"><Clock size={16}/> {event.time}</span>}
                                <span className="flex items-center gap-2 bg-black/10 px-4 py-2 rounded-full backdrop-blur-sm"><User size={16}/> {event.hostName}</span>
                            </div>
                            
                            {event.location && (
                                 <a 
                                    href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="mt-6 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-xl text-sm font-bold border border-white/30 hover:bg-white/30 transition-all hover:scale-105"
                                >
                                    <MapPin size={16} className="text-white" />
                                    {event.location}
                                </a>
                            )}
                            
                            {event.dietaryNotes && (
                                <div className="mt-6 flex justify-center">
                                    <div className="inline-flex items-center gap-2 bg-amber-400/20 backdrop-blur-md px-5 py-2.5 rounded-xl text-sm font-bold border border-amber-300/40 text-amber-100 max-w-lg">
                                        <AlertCircle size={16} className="text-amber-300 flex-shrink-0" />
                                        <span>Note: {event.dietaryNotes}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-center gap-3 mt-8">
                                 <button onClick={addToCalendar} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/10 hover:border-white/30">
                                    <CalendarCheck size={14}/> Add to Calendar
                                </button>
                            </div>
                        </div>
                        {event.description && (
                            <div className={`p-8 bg-white/50 backdrop-blur-sm ${styles.headerText} text-center border-t border-white/50 italic relative text-lg`}>
                                "{event.description}"
                            </div>
                        )}
                    </div>

                    {/* --- INVITE & SHARING CARD (Admin Only) --- */}
                    {isAdmin && (
                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-20 -mt-20 z-0"></div>
                            
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                <div className={`flex-shrink-0 p-5 rounded-2xl text-white shadow-xl ${styles.headerGradient} rotate-3`}>
                                    <Share2 size={32} />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Invite Your Guests</h3>
                                    <p className="text-slate-500 font-medium mt-1">Send this public link to your guests so they can sign up!</p>
                                </div>
                                <button 
                                    onClick={() => copyLink(shareLink)} 
                                    className={`px-8 py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center gap-3 w-full md:w-auto justify-center hover:-translate-y-1 ${isCopied ? 'bg-green-600' : `${styles.accentBtn}`}`}
                                >
                                    {isCopied ? <Check size={20}/> : <LinkIcon size={20}/>}
                                    {isCopied ? 'Link Copied!' : 'Copy Guest Link'}
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100 relative z-10">
                                <button onClick={() => handleShare('sms')} className="flex flex-col items-center gap-2 p-3 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors group">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-full group-hover:bg-blue-100 transition-colors"><Smartphone size={20} /></div>
                                    <span className="text-[10px] font-bold uppercase tracking-wide">Text</span>
                                </button>
                                <button onClick={() => handleShare('whatsapp')} className="flex flex-col items-center gap-2 p-3 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors group">
                                    <div className="p-2 bg-green-50 text-green-600 rounded-full group-hover:bg-green-100 transition-colors"><MessageCircle size={20} /></div>
                                    <span className="text-[10px] font-bold uppercase tracking-wide">WhatsApp</span>
                                </button>
                                <button onClick={() => handleShare('email')} className="flex flex-col items-center gap-2 p-3 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors group">
                                    <div className="p-2 bg-red-50 text-red-600 rounded-full group-hover:bg-red-100 transition-colors"><Mail size={20} /></div>
                                    <span className="text-[10px] font-bold uppercase tracking-wide">Email</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- ADMIN MASTER LINK (Only Visible to Admin) --- */}
                    {isAdmin && (
                        <div className="bg-amber-50 border-2 border-amber-200 border-dashed rounded-2xl p-6 mb-12 flex flex-col md:flex-row items-center gap-6 justify-between relative overflow-hidden">
                             <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-16 bg-amber-300 rounded-r-full"></div>
                             <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-2 text-amber-800 font-bold text-lg">
                                    <Lock size={20} /> Organizer Master Key
                                </div>
                                <p className="text-amber-700/80 text-sm font-medium">
                                    This is your private control panel link. <span className="font-black bg-amber-100 px-1 rounded text-amber-900">Do not share this.</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto bg-white p-2 rounded-xl border border-amber-200 shadow-sm">
                                <input type="text" readOnly value={organizerLink} className="flex-1 text-xs text-slate-500 font-mono bg-transparent truncate outline-none w-full md:w-64 pl-2" />
                                <button onClick={() => copyLink(organizerLink)} className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-bold flex items-center gap-1 whitespace-nowrap transition-colors">
                                    <Copy size={14}/> Copy
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- MASTER LIST CONTROLS --- */}
                    <div className="flex flex-wrap justify-between items-end border-b border-slate-200 pb-6 gap-4 mt-8 mb-6">
                        <div>
                            <h3 className={`font-black text-3xl flex items-center gap-3 font-serif ${styles.headerText}`}>
                                <ChefHat className={styles.iconColor} size={32}/> Master Dish List
                            </h3>
                            {event.hideNamesFromGuests && !isAdmin && (
                                <p className="text-xs font-bold text-slate-400 mt-2 flex items-center gap-1.5 uppercase tracking-wide">
                                    <Lock size={10} /> Privacy Mode Active: Names Hidden
                                </p>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {isAdmin && (
                                <>
                                    <button 
                                        onClick={() => setIsAdminView(!isAdminView)}
                                        className="text-xs font-bold text-slate-600 flex items-center gap-1.5 hover:text-slate-900 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-sm transition-all"
                                    >
                                        {isAdminView ? <EyeOff size={14} /> : <Eye size={14} />}
                                        {isAdminView ? 'View as Guest' : 'Back to Admin'}
                                    </button>
                                    <div className="h-6 w-px bg-slate-200 mx-1"></div>
                                    <div className="flex gap-2">
                                         <button 
                                            onClick={downloadCSV}
                                            className="text-xs font-bold text-slate-600 flex items-center gap-1.5 hover:bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 transition-colors shadow-sm bg-white"
                                        >
                                            <Download size={14} /> CSV
                                        </button>
                                        <button 
                                            onClick={handlePdfDownload}
                                            className="text-xs font-bold text-red-600 flex items-center gap-1.5 hover:bg-red-50 px-4 py-2 rounded-xl border border-red-100 transition-colors shadow-sm bg-white"
                                        >
                                            <Download size={14} /> PDF
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                            <button 
                                onClick={() => setViewMode('cards')}
                                className={`p-2.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Card View"
                            >
                                <Grid size={18} />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="List View"
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>

                    {/* --- LIST VIEW --- */}
                    {viewMode === 'list' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className={`${styles.headerGradient} h-1.5 w-full`}></div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs tracking-wider">
                                        <tr>
                                            <th className="p-5 whitespace-nowrap border-b border-slate-100">Dish</th>
                                            <th className="p-5 whitespace-nowrap border-b border-slate-100">Guest</th>
                                            <th className="p-5 whitespace-nowrap border-b border-slate-100">Category</th>
                                            <th className="p-5 whitespace-nowrap border-b border-slate-100">Notes</th>
                                            <th className="p-5 text-right whitespace-nowrap border-b border-slate-100">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {event.dishes.length === 0 ? (
                                            <tr><td colSpan={5} className="p-12 text-center text-slate-400 italic">No dishes added yet.</td></tr>
                                        ) : (
                                            event.dishes.map(dish => {
                                                const catName = event.categories.find(c => c.id === dish.categoryId)?.name || 'Unknown';
                                                const isOwner = myDishKeys[dish.id];
                                                return (
                                                    <tr key={dish.id} className="hover:bg-slate-50/80 transition-colors group">
                                                        <td className="p-5 font-bold text-slate-800">
                                                            {dish.dishName}
                                                            {event.votingEnabled && (dish.votes || 0) > 0 && (
                                                                <span className="ml-2 text-xs font-bold text-amber-500 flex items-center gap-1 inline-flex">
                                                                    <Heart size={12} fill="currentColor" /> {dish.votes}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-5 text-slate-600 font-medium">{getDisplayName(dish)}</td>
                                                        <td className="p-5 text-slate-500"><span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wide text-slate-600 whitespace-nowrap">{catName}</span></td>
                                                        <td className="p-5">
                                                            <div className="flex gap-1.5">
                                                                {dish.dietary.map(d => (
                                                                    <span key={d} className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-full font-bold shadow-sm whitespace-nowrap">{DIETARY_OPTIONS.find(o=>o.id===d)?.icon}</span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="p-5 text-right">
                                                            {(isAdmin || isOwner) && (
                                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                     <button 
                                                                        onClick={() => openEditDishModal(dish)} 
                                                                        className={`text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors ${isEditLocked && !isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                        disabled={isEditLocked && !isAdmin}
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil size={16}/>
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDeleteDish(dish.id)} 
                                                                        className={`text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors ${isEditLocked && !isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        </div>
                    )}
                    
                    {/* --- CARD VIEW --- */}
                    {viewMode === 'cards' && (
                        <div className="space-y-8">
                            {event.categories.map(category => {
                                const categoryDishes = event.dishes.filter(d => d.categoryId === category.id);
                                const limit = category.limit || 0;
                                const isFull = limit > 0 && categoryDishes.length >= limit;
                                const progress = limit > 0 ? (categoryDishes.length / limit) * 100 : 0;
                                
                                return (
                                    <div key={category.id} className={`bg-white rounded-2xl shadow-sm border ${styles.cardBorder} overflow-hidden transition-all hover:shadow-md`}>
                                        {/* Category Header */}
                                        <div className={`p-5 border-b ${styles.cardBorder} ${styles.bg} flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 relative overflow-hidden`}>
                                            {limit > 0 && (
                                                <div className={`absolute bottom-0 left-0 h-1 ${styles.progressBar} transition-all duration-500`} style={{ width: `${progress}%` }}></div>
                                            )}
                                            
                                            <h3 className={`font-bold text-xl font-serif ${styles.headerText}`}>{category.name}</h3>
                                            
                                            {limit > 0 ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                                        {categoryDishes.length} / {limit} Filled
                                                    </div>
                                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${isFull ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700 animate-pulse'}`}>
                                                        {isFull ? 'Full' : 'Open'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-white/50 px-2 py-1 rounded-md">Unlimited</span>
                                            )}
                                        </div>
                                        
                                        {/* REQUESTED ITEMS SECTION */}
                                        {category.requestedItems && category.requestedItems.length > 0 && (
                                            <div className="p-5 bg-amber-50/50 border-b border-amber-100">
                                                <p className="text-[10px] font-black text-amber-700 uppercase mb-3 flex items-center gap-1.5 tracking-wider"><Flag size={12}/> Host Requests</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {category.requestedItems.map(req => {
                                                        const isTaken = !!req.takenByDishId;
                                                        const takenByDish = isTaken ? event.dishes.find(d => d.id === req.takenByDishId) : null;
                                                        const takenName = takenByDish ? getDisplayName(takenByDish) : 'Taken';

                                                        return (
                                                            <div key={req.id} className={`flex items-center gap-2 pr-1 pl-3 py-1 rounded-full border text-sm font-medium transition-all ${isTaken ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-white border-amber-200 text-slate-700 shadow-sm'}`}>
                                                                <span className={isTaken ? 'line-through decoration-slate-300' : ''}>{req.name}</span>
                                                                {isTaken ? (
                                                                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full text-slate-500 font-bold">
                                                                        {takenName}
                                                                    </span>
                                                                ) : (
                                                                    <button 
                                                                        onClick={() => openAddModal(category, req)}
                                                                        className="ml-1 text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-800 px-2.5 py-1 rounded-full font-bold uppercase tracking-wide transition-colors"
                                                                    >
                                                                        Claim
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div className="divide-y divide-slate-50">
                                            {categoryDishes.map(dish => {
                                                const isTopDish = topDishes.some(td => td.id === dish.id);
                                                
                                                return (
                                                    <div key={dish.id} className="p-5 flex items-start justify-between group hover:bg-slate-50/80 transition-colors">
                                                        <div>
                                                            <div className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                                                {dish.dishName}
                                                                {category.requestedItems?.some(r => r.takenByDishId === dish.id) && (
                                                                    <span title="Host Requested" className="flex items-center">
                                                                        <Sparkles size={14} className="text-amber-500" />
                                                                    </span>
                                                                )}
                                                                {isTopDish && event.votingEnabled && (
                                                                    <span title="Top Voted Dish!" className="flex items-center">
                                                                        <Trophy size={14} className="text-yellow-500" fill="currentColor" />
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 flex-wrap mt-1.5">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${styles.progressBar} opacity-80`}>
                                                                        {getDisplayName(dish).charAt(0)}
                                                                    </div>
                                                                    <span className="text-sm font-medium text-slate-600">{getDisplayName(dish)}</span>
                                                                </div>
                                                                
                                                                {dish.dietary.length > 0 && (
                                                                    <div className="flex gap-1">
                                                                        {dish.dietary.map(dt => {
                                                                            const tag = DIETARY_OPTIONS.find(o => o.id === dt);
                                                                            return tag ? (
                                                                                <span key={dt} title={tag.label} className={`text-[10px] px-1.5 py-0.5 rounded border ${tag.color.replace('text-', 'border-').replace('100', '200')} bg-white shadow-sm`}>
                                                                                    {tag.icon}
                                                                                </span>
                                                                            ) : null;
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-3">
                                                            {/* Voting Button */}
                                                            {event.votingEnabled && (
                                                                <div className="flex items-center gap-1">
                                                                    <button 
                                                                        onClick={() => handleVote(dish.id)}
                                                                        disabled={myVotedDishes.has(dish.id)}
                                                                        className={`p-1.5 rounded-full transition-all ${myVotedDishes.has(dish.id) ? 'text-rose-500 bg-rose-50' : 'text-slate-300 hover:text-rose-400 hover:bg-slate-100'}`}
                                                                    >
                                                                        <Heart size={18} fill={myVotedDishes.has(dish.id) ? "currentColor" : "none"} />
                                                                    </button>
                                                                    {(dish.votes || 0) > 0 && (
                                                                        <span className="text-xs font-bold text-slate-500">{dish.votes}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            
                                                            {(isAdmin || myDishKeys[dish.id]) && (
                                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button 
                                                                        onClick={() => openEditDishModal(dish)} 
                                                                        className={`text-slate-300 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors ${isEditLocked && !isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                        disabled={isEditLocked && !isAdmin}
                                                                    >
                                                                        <Pencil size={18} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDeleteDish(dish.id)} 
                                                                        className={`text-slate-300 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors ${isEditLocked && !isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                        disabled={isEditLocked && !isAdmin}
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            
                                            {categoryDishes.length === 0 && (
                                                <div className="p-8 text-center">
                                                    <p className="text-slate-400 italic text-sm font-medium">Nothing here yet.</p>
                                                    <p className="text-xs text-slate-300 mt-1">Be the first to bring something!</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* ADD BUTTON ALWAYS VISIBLE IN CARDS */}
                                        <div className="p-3 bg-slate-50/50 border-t border-slate-100">
                                            <button 
                                                onClick={() => openAddModal(category)}
                                                disabled={isFull}
                                                className={`w-full py-3.5 rounded-xl border-2 border-dashed font-bold flex items-center justify-center gap-2 transition-all ${
                                                    isFull 
                                                    ? 'border-slate-200 text-slate-300 cursor-not-allowed' 
                                                    : `border-slate-300 text-slate-500 hover:bg-white hover:${styles.cardBorder} hover:text-slate-800 hover:shadow-sm`
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
                                    className={`w-14 h-14 rounded-full shadow-xl shadow-slate-900/20 flex items-center justify-center text-white ${styles.accentBtn} transition-transform hover:scale-110`}
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
                            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in text-slate-800">
                                <div className={`${styles.headerGradient} p-5 flex justify-between items-center text-white`}>
                                    <h3 className="font-bold flex items-center gap-2 text-lg">
                                        <Utensils size={20}/> {editingDishId ? 'Edit Dish' : dishForm.fulfillmentId ? 'I\'ll Bring This!' : 'Bring a Dish'}
                                    </h3>
                                    <button onClick={() => setShowAddModal(false)} className="hover:bg-white/20 rounded-full p-1 transition-colors"><X size={24}/></button>
                                </div>
                                
                                <div className="p-6 space-y-5">
                                    {dishForm.fulfillmentId && !editingDishId && (
                                        <div className="bg-amber-50 text-amber-900 p-4 rounded-xl text-sm font-medium border border-amber-200 flex items-center gap-3">
                                            <div className="bg-amber-100 p-1.5 rounded-full"><Check size={16} /></div>
                                            You are signing up to bring: <strong>{dishForm.dish}</strong>
                                        </div>
                                    )}
                                    
                                    {viewMode === 'list' && !editingDishId && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wide">Category</label>
                                            <div className="relative">
                                                <select 
                                                    value={selectedCategory.id}
                                                    onChange={e => {
                                                        const cat = event.categories.find(c => c.id === e.target.value);
                                                        if(cat) setSelectedCategory(cat);
                                                    }}
                                                    className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none bg-slate-50 font-medium text-slate-700 appearance-none focus:border-slate-400 transition-colors"
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
                                                <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400"><List size={16} /></div>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wide">Your Name</label>
                                        <input 
                                            autoFocus
                                            type="text" 
                                            value={dishForm.name}
                                            onChange={e => setDishForm({...dishForm, name: e.target.value})}
                                            className="w-full p-3.5 border-2 border-slate-200 rounded-xl outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all font-medium text-slate-800"
                                            placeholder="e.g. Sarah"
                                        />
                                    </div>
                                    
                                    {!dishForm.fulfillmentId && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wide">Dish Name</label>
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    value={dishForm.dish}
                                                    onChange={e => setDishForm({...dishForm, dish: e.target.value})}
                                                    className="w-full p-3.5 border-2 border-slate-200 rounded-xl outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all font-medium text-slate-800"
                                                    placeholder="e.g. Deviled Eggs"
                                                />
                                                <button 
                                                    onClick={() => setDishForm({...dishForm, dish: SUGGESTIONS[Math.floor(Math.random()*SUGGESTIONS.length)]})}
                                                    className="absolute right-2 top-2 text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-1.5 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200"
                                                >
                                                    Suggestion?
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Dietary Info (Optional)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {DIETARY_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => toggleDietary(opt.id)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${dishForm.dietary.includes(opt.id) ? opt.color + ' ring-2 ring-offset-1 ring-slate-100' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:border-slate-300'}`}
                                                >
                                                    <span>{opt.icon}</span> {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleSaveDish}
                                        disabled={!dishForm.name || !dishForm.dish || isSubmitting}
                                        className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 transform active:scale-95 ${styles.accentBtn} disabled:opacity-50 disabled:scale-100`}
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
                            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden transform transition-all scale-100 text-slate-800">
                                <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 text-green-600 shadow-sm">
                                    <Check size={40} strokeWidth={3} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Dish Added!</h3>
                                <p className="text-slate-500 mb-8 font-medium">Thanks for signing up!</p>
                                
                                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 mb-8 text-left relative overflow-hidden">
                                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-100 rounded-full blur-xl opacity-50"></div>
                                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Lock size={12}/> Edit Link (Save This!)</p>
                                    <p className="text-xs text-blue-600 mb-4 leading-relaxed font-medium">
                                        Need to change your dish from another device? You'll need this private link.
                                    </p>
                                    <div className="flex gap-2">
                                        <input type="text" readOnly value={lastAddedDishLink} className="flex-1 p-2.5 text-xs bg-white border border-blue-200 rounded-lg text-slate-500 truncate font-mono shadow-sm" />
                                        <button 
                                            onClick={() => copyLink(lastAddedDishLink)}
                                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-sm ${isCopied ? 'bg-green-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                                        >
                                            {isCopied ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center mb-6">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Tech Tip</p>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                        If the page ever looks blank, try clearing your cache or using Incognito mode.
                                    </p>
                                </div>

                                <button onClick={() => setShowSuccessModal(false)} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg">
                                    Done
                                </button>
                            </div>
                        </div>
                    )}

                    {/* EDIT EVENT MODAL */}
                    {showEditEventModal && isAdmin && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-slate-800">
                                <div className={`${styles.headerGradient} p-5 flex justify-between items-center text-white`}>
                                    <h3 className="font-bold text-lg">Edit Event Details</h3>
                                    <button onClick={() => setShowEditEventModal(false)} className="hover:bg-white/20 rounded-full p-1 transition-colors"><X size={24}/></button>
                                </div>
                                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                                    {/* SECTION 1: BASICS */}
                                    <div className="space-y-4">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Event Info</p>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Event Name</label>
                                            <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200 transition-all font-medium text-slate-800"/>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Date</label>
                                                <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200 transition-all text-slate-800"/>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Time</label>
                                                <input type="text" value={editForm.time} onChange={e => setEditForm({...editForm, time: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200 transition-all text-slate-800"/>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Location</label>
                                            <input type="text" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200 transition-all text-slate-800"/>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Dietary Notes</label>
                                            <input type="text" value={editForm.dietaryNotes} onChange={e => setEditForm({...editForm, dietaryNotes: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200 transition-all text-slate-800"/>
                                        </div>
                                    </div>

                                    {/* SECTION 2: PRIVACY & PERMISSIONS */}
                                    <div className="pt-2">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4 flex items-center gap-2">
                                            <Shield size={12} /> Privacy & Permissions
                                        </p>
                                        
                                        <div className="space-y-4">
                                            {/* Toggle: Voting */}
                                            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <div>
                                                    <span className="font-bold text-sm text-slate-700 block flex items-center gap-1.5"><Heart size={14} className="text-amber-500"/> Recipe Voting</span>
                                                    <span className="text-xs text-slate-500">Enable "Best Dish" heart button</span>
                                                </div>
                                                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                                    <input 
                                                        type="checkbox" 
                                                        name="voting-enabled" 
                                                        id="voting-enabled" 
                                                        checked={editForm.votingEnabled}
                                                        onChange={(e) => setEditForm({...editForm, votingEnabled: e.target.checked})}
                                                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                    />
                                                    <label htmlFor="voting-enabled" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${editForm.votingEnabled ? 'bg-amber-500' : 'bg-slate-300'}`}></label>
                                                </div>
                                            </div>

                                            {/* Toggle: Guest Editing */}
                                            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <div>
                                                    <span className="font-bold text-sm text-slate-700 block">Allow Guest Editing</span>
                                                    <span className="text-xs text-slate-500">Guests can edit their own dishes</span>
                                                </div>
                                                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                                    <input 
                                                        type="checkbox" 
                                                        name="guest-edit" 
                                                        id="guest-edit" 
                                                        checked={editForm.allowGuestEditing}
                                                        onChange={(e) => setEditForm({...editForm, allowGuestEditing: e.target.checked})}
                                                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                    />
                                                    <label htmlFor="guest-edit" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${editForm.allowGuestEditing ? 'bg-green-500' : 'bg-slate-300'}`}></label>
                                                </div>
                                            </div>

                                            {/* Toggle: Hide Names */}
                                            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <div>
                                                    <span className="font-bold text-sm text-slate-700 block flex items-center gap-1.5">
                                                        Hide Guest Names {editForm.hideNamesFromGuests && <Lock size={12} className="text-amber-500"/>}
                                                    </span>
                                                    <span className="text-xs text-slate-500">Guests see "A Guest" instead of names</span>
                                                </div>
                                                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                                    <input 
                                                        type="checkbox" 
                                                        name="hide-names" 
                                                        id="hide-names" 
                                                        checked={editForm.hideNamesFromGuests}
                                                        onChange={(e) => setEditForm({...editForm, hideNamesFromGuests: e.target.checked})}
                                                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                    />
                                                    <label htmlFor="hide-names" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${editForm.hideNamesFromGuests ? 'bg-amber-500' : 'bg-slate-300'}`}></label>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Lock Editing Before Event</label>
                                                <div className="relative">
                                                    <select value={editForm.editLockDays} onChange={e => setEditForm({...editForm, editLockDays: parseInt(e.target.value)})} className="w-full p-3 border rounded-lg outline-none bg-white font-medium text-slate-700 appearance-none focus:ring-2 focus:ring-slate-200 transition-all">
                                                        <option value={0}>Never Lock</option>
                                                        <option value={1}>1 Day Before</option>
                                                        <option value={2}>2 Days Before</option>
                                                        <option value={3}>3 Days Before</option>
                                                        <option value={5}>5 Days Before</option>
                                                        <option value={7}>1 Week Before</option>
                                                    </select>
                                                    <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400"><Lock size={16}/></div>
                                                </div>
                                            </div>
                                        </div>
                                        <style>{`
                                            .toggle-checkbox:checked { right: 0; border-color: transparent; }
                                            .toggle-checkbox { right: auto; left: 0; border-color: transparent; transition: all 0.3s; }
                                        `}</style>
                                    </div>
                                </div>
                                <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
                                    <button onClick={() => setShowEditEventModal(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:text-slate-700 transition-colors">Cancel</button>
                                    <button onClick={handleUpdateEvent} disabled={isSubmitting} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transform active:scale-95 transition-all">
                                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                                    </button>
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
