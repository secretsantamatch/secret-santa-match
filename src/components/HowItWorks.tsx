import React from 'react';

const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

interface HowItWorksProps {
    onStepClick: (step: number) => void;
}

const HowItWorks: React.FC<HowItWorksProps> = ({ onStepClick }) => {
    const steps = [
        { num: '1', title: 'Add Names & Details', description: 'Enter participant names, gift ideas, budget, and optional emails for easy sharing.' },
        { num: '2', title: 'Set Rules & Generate', description: 'Add exclusions or required matches, then let the generator create fair, random pairings instantly.' },
        { num: '3', title: 'Share the Results', description: 'Send matches secretly via email or download beautiful, custom-styled printable cards to share.' },
    ];

    return (
        <div className="my-12">
            <h2 className="text-3xl font-bold text-center text-slate-800 mb-10 font-serif">How It Works</h2>
            
            {/* Desktop View */}
            <div className="hidden md:flex justify-center items-stretch gap-4">
                {steps.map((step, index) => (
                    <React.Fragment key={index}>
                        <button 
                            onClick={() => onStepClick(index + 1)}
                            className="flex-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-lg text-center transform hover:-translate-y-2 transition-transform duration-300 focus:outline-none focus:ring-4 focus:ring-offset-0 focus:ring-[var(--primary-focus-ring-color)]"
                        >
                            <div className="text-5xl font-bold text-[var(--primary-text)] font-serif mb-3">{step.num}</div>
                            <h3 className="font-bold text-lg text-slate-800 mb-2">{step.title}</h3>
                            <p className="text-gray-600 text-sm">{step.description}</p>
                        </button>
                        {index < steps.length - 1 && (
                            <div className="flex-shrink-0 flex items-center">
                                <ChevronRightIcon />
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-6">
                {steps.map((step, index) => (
                    <button 
                        key={step.num}
                        onClick={() => onStepClick(index + 1)}
                        className="w-full bg-white rounded-2xl p-6 border border-slate-200 shadow-lg flex items-start gap-4 text-left"
                    >
                        <div className="text-4xl font-bold text-[var(--primary-text)] font-serif">{step.num}</div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 mb-1">{step.title}</h3>
                            <p className="text-gray-600 text-sm">{step.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default HowItWorks;
