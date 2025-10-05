import React from 'react';

// Icons for each step
const AddNamesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[var(--primary-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
);

const SetRulesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[var(--primary-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

const ShareLinksIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[var(--primary-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
);

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
                        <AddNamesIcon />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">1. Add Names</h3>
                    <p className="text-slate-600 mt-2 text-sm leading-relaxed">Easily enter participant names one by one or use the bulk add feature. It's fast, free, and requires no sign-ups or apps.</p>
                </div>
                
                <div className="hidden md:block">
                    <ChevronRight />
                </div>
                
                {/* Step 2 */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 w-full md:w-1/3 text-center transition-transform transform hover:-translate-y-1">
                    <div className="flex justify-center mb-4">
                        <SetRulesIcon />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">2. Set Rules &amp; Styles</h3>
                    <p className="text-slate-600 mt-2 text-sm leading-relaxed">Add exclusions to prevent people from drawing each other, then customize beautiful, printable cards for a personal touch.</p>
                </div>

                <div className="hidden md:block">
                    <ChevronRight />
                </div>

                {/* Step 3 */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 w-full md:w-1/3 text-center transition-transform transform hover:-translate-y-1">
                    <div className="flex justify-center mb-4">
                        <ShareLinksIcon />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">3. Share Links &amp; Cards</h3>
                    <p className="text-slate-600 mt-2 text-sm leading-relaxed">Instantly share private links so everyone can see their match online, or download the styled cards for your in-person party.</p>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
