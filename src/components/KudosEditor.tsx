import React, { useState } from 'react';
import { X, Gift, Sparkles, Send, Loader2, Link as LinkIcon, Search, ChevronDown, ChevronRight, Award } from 'lucide-react';
import { addKudosCard } from '../services/kudosService';
import type { KudosTheme, KudosBadge } from '../types';
import { trackEvent } from '../services/analyticsService';

interface KudosEditorProps {
    boardId: string;
    onClose: () => void;
    theme: KudosTheme;
}

// ===========================================
// MESSAGE TEMPLATES LIBRARY
// ===========================================
const MESSAGE_TEMPLATES: Record<string, { label: string; icon: string; messages: string[] }> = {
    general: {
        label: 'General Thank You',
        icon: '🙏',
        messages: [
            "Thank you for [specific action]. Your [quality] made a real difference in [outcome].",
            "I wanted to acknowledge the effort you put into [task]. Your dedication directly contributed to [result].",
            "Your consistent [excellence/reliability/positivity] is something the team can always count on.",
            "I know you don't always get the spotlight, but your work on [task] makes everything else possible.",
            "Your positive attitude during [situation] helped keep the whole team motivated.",
        ]
    },
    teamwork: {
        label: 'Teamwork',
        icon: '🤝',
        messages: [
            "Your collaboration with [team/person] on [project] made a huge difference in the outcome.",
            "During [project], you consistently put the team's success above individual recognition. That's what makes us work so well together.",
            "Thank you for taking time to share your expertise on [topic] with the team.",
            "The way you welcomed and supported [new team member] made their transition so much smoother.",
            "I noticed how you always make sure everyone's voice is heard in meetings. That inclusive approach makes our discussions richer.",
        ]
    },
    above_beyond: {
        label: 'Above & Beyond',
        icon: '⭐',
        messages: [
            "You didn't have to [extra action], but you did anyway. That initiative made a real difference.",
            "I know you put in extra time on [project] to meet the deadline. That sacrifice didn't go unnoticed.",
            "Your [proactive action] prevented what could have been a major issue. Most people wouldn't have caught that.",
            "When [crisis] happened, you were the first to jump in. Your calm response under pressure was exactly what we needed.",
            "I asked for [basic deliverable], and you delivered something far beyond what I expected.",
        ]
    },
    project: {
        label: 'Project Win',
        icon: '🎯',
        messages: [
            "Congratulations on launching [project]! Your work on [specific area] was critical to making this happen.",
            "We did it—[project] delivered on time! Your contribution was essential to hitting that deadline.",
            "The [technical challenge] you solved in [project] was no small feat. Thank you for turning a blocker into a success.",
            "The quality of [deliverable] exceeded expectations. Your attention to [detail] meant we could ship with confidence.",
            "[Client] specifically mentioned how happy they were with [deliverable]. Your work directly created that positive relationship.",
        ]
    },
    leadership: {
        label: 'Leadership',
        icon: '👑',
        messages: [
            "Your decision to [choice] showed real leadership. The team rallied behind your direction.",
            "The way you've developed [team/person] is impressive. That investment in others multiplies our impact.",
            "Leading the team through [change] wasn't easy, but you navigated it with grace. We came out stronger.",
            "Thank you for going to bat for [team/project/resources]. Knowing you advocate for us means a lot.",
            "When [issue] happened, you took responsibility and focused on solutions rather than blame. That accountability set the tone.",
        ]
    },
    mentorship: {
        label: 'Mentorship',
        icon: '🌱',
        messages: [
            "Thank you for teaching me [skill]. Your patience made something confusing finally click.",
            "Our conversation about [career topic] really helped me see things more clearly. Thank you for investing in my growth.",
            "Thank you for making my first weeks here so much smoother. Your willingness to answer my questions helped me feel part of the team.",
            "The [documentation/training] you created for [process] has helped so many people learn faster.",
            "Watching how you handle [situation type] has taught me more than any training could.",
        ]
    },
    customer: {
        label: 'Customer Service',
        icon: '💬',
        messages: [
            "The way you handled [frustrated customer] was impressive. You stayed calm and found a solution that turned them from angry to appreciative.",
            "[Customer] specifically mentioned you in their feedback. That recognition is earned through genuine care.",
            "Your quick thinking in resolving [issue] prevented a much bigger problem. The customer walked away happy.",
            "When [customer] was considering leaving, your [action] helped us keep them. That's relationship protection in action.",
            "Your customer satisfaction scores are consistently excellent. That comes from caring about every single interaction.",
        ]
    },
    innovation: {
        label: 'Innovation',
        icon: '💡',
        messages: [
            "Your idea to [innovation] is now showing real results. Thank you for pushing past 'that's how we've always done it.'",
            "The new process you designed for [area] is saving [time/money/errors]. Your willingness to question the status quo benefits everyone.",
            "When we were stuck on [problem], your creative approach broke the logjam. That thinking outside the box was exactly what we needed.",
            "The automation you built for [task] is a game-changer. That's working smarter, not harder.",
            "Thank you for having the courage to try [experiment]. That willingness to test assumptions is how we get better.",
        ]
    },
    milestone: {
        label: 'Work Anniversary',
        icon: '🎂',
        messages: [
            "Happy [X]-year anniversary! It's hard to imagine the team without you now.",
            "Congratulations on [X] years! Your contributions have shaped who we are today.",
            "Happy anniversary! Beyond your excellent work, you've made this a better place to be.",
            "Looking back at your journey—from [start] to [current achievements]—is inspiring. Here's to continued growth!",
            "The team wouldn't be the same without you. Thank you for [X] years of making us stronger.",
        ]
    },
    farewell: {
        label: 'Farewell',
        icon: '👋',
        messages: [
            "Working with you has been a privilege. Your contributions won't be forgotten. All the best in your next chapter!",
            "I'll always remember how you [specific moment]. That's the kind of impact that stays with a team.",
            "Thank you for everything you taught me. I'm a better [professional/person] because of your mentorship.",
            "You didn't just do great work—you made this team better. We're losing someone special.",
            "After [X years] of dedication, you've earned this next chapter. Your legacy here will continue.",
        ]
    },
};

// ===========================================
// BADGE OPTIONS
// ===========================================
const BADGES: { id: KudosBadge; label: string; icon: string; color: string }[] = [
    { id: 'none', label: 'No Badge', icon: '', color: '' },
    { id: 'team_player', label: 'Team Player', icon: '🤝', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'innovator', label: 'Innovator', icon: '💡', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { id: 'customer_hero', label: 'Customer Hero', icon: '⭐', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { id: 'mentor', label: 'Mentor', icon: '🌱', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { id: 'above_beyond', label: 'Above & Beyond', icon: '🚀', color: 'bg-rose-100 text-rose-700 border-rose-200' },
    { id: 'problem_solver', label: 'Problem Solver', icon: '🔧', color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

const GIFT_VENDORS = [
    { name: 'Starbucks', url: 'https://www.starbucks.com/card', icon: '☕' },
    { name: 'Amazon', url: 'https://www.amazon.com/gift-cards', icon: '📦' },
    { name: 'Visa', url: 'https://www.giftcards.com/visa-gift-cards', icon: '💳' },
];

const KudosEditor: React.FC<KudosEditorProps> = ({ boardId, onClose, theme }) => {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [badge, setBadge] = useState<KudosBadge>('none');
    
    // Media & Gifts
    const [showGiftInput, setShowGiftInput] = useState(false);
    const [giftLink, setGiftLink] = useState('');
    const [activeTab, setActiveTab] = useState<'write' | 'templates' | 'gif'>('write');
    const [gifUrl, setGifUrl] = useState<string | undefined>(undefined);
    
    // Templates
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    
    // Giphy State
    const [gifSearch, setGifSearch] = useState('');
    const [gifs, setGifs] = useState<any[]>([]);
    const [loadingGifs, setLoadingGifs] = useState(false);

    const handleTemplateSelect = (template: string) => {
        setMessage(template);
        setActiveTab('write');
    };

    const searchGiphy = async () => {
        if (!gifSearch) return;
        setLoadingGifs(true);
        try {
            const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(gifSearch)}&limit=12&rating=g`);
            const data = await res.json();
            setGifs(data.data);
        } catch (e) {
            console.error("Giphy error", e);
        } finally {
            setLoadingGifs(false);
        }
    };

    const handleSubmit = async () => {
        if (!from || !to || !message) return;
        setIsSubmitting(true);
        try {
            await addKudosCard(boardId, {
                from,
                to,
                message,
                style: 'classic', 
                badge: badge !== 'none' ? badge : undefined,
                giftLink: giftLink.trim() || undefined,
                gifUrl: gifUrl
            });
            trackEvent('kudos_card_added', { has_gift: !!giftLink, has_gif: !!gifUrl, badge: badge });
            onClose();
        } catch (e) {
            alert("Failed to post. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[95vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">Add Kudos</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><X size={24}/></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-5">
                    {/* To/From Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">To</label>
                            <input type="text" className="w-full p-3 border rounded-lg bg-slate-50 focus:bg-white outline-none" placeholder="Name" value={to} onChange={e => setTo(e.target.value)} autoFocus />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">From</label>
                            <input type="text" className="w-full p-3 border rounded-lg bg-slate-50 focus:bg-white outline-none" placeholder="Your Name" value={from} onChange={e => setFrom(e.target.value)} />
                        </div>
                    </div>

                    {/* Badge Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                            <Award size={12} /> Award Badge (Optional)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {BADGES.map(b => (
                                <button
                                    key={b.id}
                                    onClick={() => setBadge(b.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                        badge === b.id 
                                            ? b.id === 'none' 
                                                ? 'bg-slate-200 border-slate-400' 
                                                : `${b.color} ring-2 ring-offset-1 ring-current`
                                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                                    }`}
                                >
                                    {b.icon} {b.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-slate-200">
                        <button onClick={() => setActiveTab('write')} className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'write' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Write Message</button>
                        <button onClick={() => setActiveTab('templates')} className={`pb-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-1 ${activeTab === 'templates' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>
                            <Sparkles size={12}/> Templates
                        </button>
                        <button onClick={() => setActiveTab('gif')} className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'gif' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Add GIF</button>
                    </div>

                    {/* Write Tab */}
                    {activeTab === 'write' && (
                        <div className="relative">
                            <textarea 
                                className="w-full p-4 border rounded-xl h-32 resize-none focus:ring-2 focus:ring-indigo-500 outline-none transition text-lg"
                                placeholder="Write your message of appreciation..."
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                            />
                            <p className="text-xs text-slate-400 mt-1">💡 Tip: Be specific about what they did and why it mattered.</p>
                        </div>
                    )}

                    {/* Templates Tab */}
                    {activeTab === 'templates' && (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            <p className="text-xs text-slate-500 mb-3">Click a template to use it, then customize the [bracketed] parts.</p>
                            {Object.entries(MESSAGE_TEMPLATES).map(([key, category]) => (
                                <div key={key} className="border border-slate-200 rounded-lg overflow-hidden">
                                    <button 
                                        onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}
                                        className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-colors"
                                    >
                                        <span className="font-bold text-slate-700 flex items-center gap-2">
                                            <span>{category.icon}</span> {category.label}
                                        </span>
                                        {expandedCategory === key ? <ChevronDown size={16} className="text-slate-400"/> : <ChevronRight size={16} className="text-slate-400"/>}
                                    </button>
                                    {expandedCategory === key && (
                                        <div className="p-2 space-y-1 bg-white">
                                            {category.messages.map((msg, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleTemplateSelect(msg)}
                                                    className="w-full text-left p-3 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors"
                                                >
                                                    "{msg.substring(0, 80)}..."
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* GIF Tab */}
                    {activeTab === 'gif' && (
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    className="flex-1 p-2 border rounded-lg text-sm outline-none" 
                                    placeholder="Search Giphy (e.g. 'high five')" 
                                    value={gifSearch} 
                                    onChange={e => setGifSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && searchGiphy()}
                                />
                                <button onClick={searchGiphy} className="bg-indigo-600 text-white px-4 rounded-lg"><Search size={16}/></button>
                            </div>
                            <div className="h-48 overflow-y-auto grid grid-cols-3 gap-2 p-1 border rounded-lg bg-slate-50">
                                {loadingGifs ? <div className="col-span-3 text-center py-10"><Loader2 className="animate-spin mx-auto text-slate-400"/></div> : 
                                 gifs.map(g => (
                                     <div key={g.id} onClick={() => { setGifUrl(g.images.fixed_height.url); setActiveTab('write'); }} className="cursor-pointer hover:opacity-80">
                                         <img src={g.images.fixed_height_small.url} alt={g.title} className="w-full h-full object-cover rounded"/>
                                     </div>
                                 ))
                                }
                            </div>
                        </div>
                    )}
                    
                    {/* Selected GIF Preview */}
                    {gifUrl && (
                        <div className="relative rounded-lg overflow-hidden border border-slate-200">
                            <img src={gifUrl} alt="Selected GIF" className="w-full h-32 object-cover" />
                            <button onClick={() => setGifUrl(undefined)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"><X size={14}/></button>
                        </div>
                    )}

                    {/* Gift Module */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-amber-900 flex items-center gap-2">
                                <Gift size={18} className="text-amber-600"/> Attach a Gift?
                            </span>
                            {!showGiftInput && (
                                <button onClick={() => setShowGiftInput(true)} className="text-xs font-bold bg-white border border-amber-200 text-amber-700 px-3 py-1 rounded-full shadow-sm hover:bg-amber-50 transition-colors">
                                    Add Gift Card
                                </button>
                            )}
                        </div>
                        
                        {showGiftInput && (
                            <div className="space-y-3 animate-fade-in">
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {GIFT_VENDORS.map(v => (
                                        <a key={v.name} href={v.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:border-amber-400 hover:text-amber-800 transition-colors">
                                            {v.icon} Buy {v.name}
                                        </a>
                                    ))}
                                </div>
                                <div className="relative">
                                    <LinkIcon size={16} className="absolute left-3 top-3.5 text-amber-400" />
                                    <input type="text" placeholder="Paste the gift link here..." value={giftLink} onChange={e => setGiftLink(e.target.value)} className="w-full pl-9 p-3 rounded-lg border border-amber-200 focus:border-amber-400 outline-none text-sm"/>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={!from || !to || !message || isSubmitting} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50">
                        {isSubmitting ? <Loader2 className="animate-spin"/> : <Send size={18}/>} Post Kudos
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KudosEditor;