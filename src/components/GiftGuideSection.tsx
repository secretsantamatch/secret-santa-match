
import React from 'react';
import { Gift, Shirt, ArrowRight, ShoppingBag } from 'lucide-react';

interface GiftGuidesSectionProps {
    variant?: 'compact' | 'full';
}

const GiftGuidesSection: React.FC<GiftGuidesSectionProps> = ({ variant = 'full' }) => {
    return (
        <section className={`w-full max-w-5xl mx-auto ${variant === 'compact' ? 'my-6' : 'my-12'} px-4`}>
            {variant === 'full' && (
                <div className="flex items-center gap-3 mb-6 justify-center">
                    <ShoppingBag className="text-red-600" size={24} />
                    <h2 className="text-2xl font-bold text-slate-800 font-serif">Trending Holiday Guides</h2>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* White Elephant Guide */}
                <a 
                    href="/white-elephant-gifts-that-get-stolen.html" 
                    target="_blank"
                    className="group relative overflow-hidden rounded-2xl border-2 border-emerald-100 bg-white shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col sm:flex-row"
                >
                    <div className="bg-emerald-50 p-6 flex items-center justify-center sm:w-1/3 group-hover:bg-emerald-100 transition-colors">
                        <div className="text-5xl group-hover:scale-110 transition-transform duration-300">🐘</div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-center text-left">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Most Popular</span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 leading-tight mb-2 group-hover:text-emerald-700 transition-colors">
                            25 White Elephant Gifts That Actually Get Stolen
                        </h3>
                        <p className="text-sm text-slate-500 mb-3">Don't bring the boring gift. See the data-backed list of party hits.</p>
                        <div className="mt-auto flex items-center text-sm font-bold text-emerald-600 gap-1">
                            Read Guide <ArrowRight size={16} />
                        </div>
                    </div>
                </a>

                {/* Ugly Sweater Guide */}
                <a 
                    href="/ugly-christmas-sweaters.html" 
                    target="_blank"
                    className="group relative overflow-hidden rounded-2xl border-2 border-red-100 bg-white shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col sm:flex-row"
                >
                    <div className="bg-red-50 p-6 flex items-center justify-center sm:w-1/3 group-hover:bg-red-100 transition-colors">
                        <div className="text-5xl group-hover:scale-110 transition-transform duration-300">🧥</div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-center text-left">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">New for 2025</span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 leading-tight mb-2 group-hover:text-red-700 transition-colors">
                            The Best Ugly Christmas Sweaters & Jumpers
                        </h3>
                        <p className="text-sm text-slate-500 mb-3">From LED light-ups to contest winners. Stand out at your next party.</p>
                        <div className="mt-auto flex items-center text-sm font-bold text-red-600 gap-1">
                            See Collection <ArrowRight size={16} />
                        </div>
                    </div>
                </a>
            </div>
        </section>
    );
};

export default GiftGuidesSection;
