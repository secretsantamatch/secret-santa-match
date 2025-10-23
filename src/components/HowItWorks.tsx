import React from 'react';

const ChevronRight = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);

const HowItWorks: React.FC = () => {
    return (
        <section className="my-10 md:my-16">
            <h2 className="text-3xl font-bold text-center text-slate-800 font-serif mb-8">How It Works</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                {/* Step 1 */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 w-full md:w-1/3 text-center transition-transform transform hover:-translate-y-1">
                    <div className="flex justify-center mb-4">
                        <img src="/step_1.webp" alt="Add Names" className="h-12 w-12" width="48" height="48" />
                    </div>
                    <h3 className="text-xl font-bold text-[#c62828]">1. Add Names</h3>
                    <p className="text-slate-600 mt-2 text-sm leading-relaxed">Easily enter participant names one by one or use the bulk add feature. It's fast, free, and requires no sign-ups or apps.</p>
                </div>
                
                <div className="hidden md:block">
                    <ChevronRight />
                </div>
                
                {/* Step 2 */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 w-full md:w-1/3 text-center transition-transform transform hover:-translate-y-1">
                    <div className="flex justify-center mb-4">
                        <img src="/step_2.webp" alt="Set Rules & Styles" className="h-12 w-12" width="48" height="48" />
                    </div>
                    <h3 className="text-xl font-bold text-[#c62828]">2. Set Rules &amp; Styles</h3>
                    <p className="text-slate-600 mt-2 text-sm leading-relaxed">Add exclusions to prevent people from drawing each other, then customize beautiful, printable cards for a personal touch.</p>
                </div>

                <div className="hidden md:block">
                    <ChevronRight />
                </div>

                {/* Step 3 */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 w-full md:w-1/3 text-center transition-transform transform hover:-translate-y-1">
                    <div className="flex justify-center mb-4">
                        <img src="/step_3.webp" alt="Share Links & Cards" className="h-12 w-12" width="48" height="48" />
                    </div>
                    <h3 className="text-xl font-bold text-[#c62828]">3. Share Links &amp; Cards</h3>
                    <p className="text-slate-600 mt-2 text-sm leading-relaxed">Instantly share private links so everyone can see their match online, or download the styled cards for your in-person party.</p>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
