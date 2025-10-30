import React, { useState, useEffect, useRef } from 'react';
import { Newspaper, ClipboardList, Calculator, Grid, Gift } from 'lucide-react';
import type { Resource } from '../types';

const iconMap: { [key: string]: React.ElementType } = {
    'generator': Gift,
    'questionnaire': ClipboardList,
    'holiday-budget-calculator': Calculator,
    'bingo-guide': Grid,
    'default': Newspaper
};

const Header: React.FC = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [resources, setResources] = useState<any[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('/resources.json')
            .then(res => res.json())
            .then((data: Resource[]) => {
                const navLinks = [
                    { id: 'generator', title: 'Free Generator', link: '/generator.html', icon: 'generator' },
                    { id: 'blog', title: 'Holiday Blog', link: '/blog.html', icon: 'default' },
                    ...data
                        .filter(r => ['questionnaire', 'holiday-budget-calculator', 'bingo-guide'].includes(r.id))
                        .map(r => ({ id: r.id, title: r.title, link: r.linkUrl, icon: r.id }))
                ];
                 setResources(navLinks);
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
                    Site Navigation
                    <svg className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border py-2 animate-fade-in-down">
                        {resources.map((resource) => {
                             const Icon = iconMap[resource.icon] || iconMap.default;
                             return (
                                <a
                                    key={resource.id}
                                    href={resource.link}
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
                <a href="/generator.html" aria-label="Go to generator homepage">
                    <img src="/logo_256.png" alt="Secret Santa Generator Logo" className="w-16 h-16" />
                </a>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mt-2">The Easiest Way to Draw Names Online</h1>
            <h2 className="text-2xl md:text-3xl font-bold text-orange-500 font-serif mt-2">Secret Santa Generator</h2>
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
