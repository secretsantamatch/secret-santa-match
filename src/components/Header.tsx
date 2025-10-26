import React, { useState, useEffect, useRef } from 'react';
import type { Resource } from '../types';
import { Newspaper, ClipboardList, Calculator, Grid } from 'lucide-react';

const iconMap: { [key: string]: React.ElementType } = {
    'questionnaire': ClipboardList,
    'holiday-budget-calculator': Calculator,
    'bingo-guide': Grid,
    'default': Newspaper
};

const Header: React.FC = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [resources, setResources] = useState<Resource[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch only the resources needed for the dropdown
        fetch('/resources.json')
            .then(res => res.json())
            .then((data: Resource[]) => {
                const navLinks = [
                    { id: 'blog', title: 'The Main Blog', link: '/', icon: 'default' },
                    ...data
                        .filter(r => ['questionnaire', 'holiday-budget-calculator', 'bingo-guide'].includes(r.id))
                        .map(r => ({ id: r.id, title: r.title, link: r.linkUrl, icon: r.id }))
                ];
                // Ensure correct order
                const orderedLinks = [
                    navLinks.find(n => n.id === 'blog'),
                    navLinks.find(n => n.id === 'questionnaire'),
                    navLinks.find(n => n.id === 'holiday-budget-calculator'),
                    navLinks.find(n => n.id === 'bingo-guide')
                ].filter(Boolean) as { id: string, title: string, link: string, icon: string }[];
                
                setResources(orderedLinks.map(r => ({ ...r, type: 'Article', description: '', thumbnailUrl: '', linkUrl: r.link } as Resource)));
            });
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="text-center py-4 relative">
             <div className="absolute top-4 right-0 z-20" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-orange-500 font-semibold transition-colors bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full border"
                    aria-haspopup="true"
                    aria-expanded={isDropdownOpen}
                >
                    Holiday Resources
                    <svg className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border py-2 animate-fade-in-down">
                        {resources.map((resource) => {
                             const Icon = iconMap[resource.id] || iconMap.default;
                             return (
                                <a
                                    key={resource.id}
                                    href={resource.linkUrl}
                                    className="flex items-center gap-4 px-4 py-3 text-slate-700 hover:bg-slate-100 transition-colors text-left"
                                >
                                    <Icon className="w-5 h-5 text-slate-500" />
                                    <span className="font-semibold text-sm">{resource.title}</span>
                                </a>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="inline-block mb-4">
                <img src="/logo_256.png" alt="Secret Santa Generator Logo" className="w-16 h-16" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-orange-500 font-serif">Secret Santa Generator</h1>
            <h2 className="text-xl md:text-2xl font-bold text-slate-700 mt-2">The Easiest Way to Draw Names Online</h2>
            <p className="text-base text-gray-600 mt-4 max-w-3xl mx-auto">
                The best free Secret Santa generator for your gift exchange! Instantly draw names,
                add exclusions, download printable cards, and share private links with each
                participant—all with no sign-ups required. Perfect for office, family, and friends.
            </p>
             <style>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.2s ease-out forwards;
                }
            `}</style>
        </header>
    );
};

export default Header;
