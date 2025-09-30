import React from 'react';

const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const NamesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-[var(--primary-color)]"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><line x1="9" y1="12" x2="15" y2="12"></line><line x1="9" y1="16" x2="15" y2="16"></line></svg>;
const RulesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-[var(--primary-color)]"><path d="m12 3-1.9 4.8-4.8 1.9 4.8 1.9L12 16l1.9-4.8 4.8-1.9-4.8-1.9z"></path><path d="M5 21v-4"></path><path d="M3 19h4"></path><path d="M19 3v4"></path><path d="M17 5h4"></path></svg>;
const GiftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-[var(--primary-color)]"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>;

// FIX: Add props interface to allow for click handling
interface HowItWorksProps {
    onStepClick?: (stepNumber: number) => void;
}

const HowItWorks: React.FC<HowItWorksProps> = ({ onStepClick }) => {
    const steps = [
        { num: '1', title: 'Add Names', Icon: NamesIcon },
        { num: '2', title: 'Set Rules', Icon: RulesIcon },
        { num: '3', title: 'Share Results', Icon: GiftIcon },
    ];

    return (
        <div className="my-12">
            <h2 className="text-3xl font-bold text-center text-slate-800 mb-10 font-serif">How It Works</h2>
            
            {/* Desktop View */}
            <div className="hidden md:flex justify-center items-stretch gap-4">
                {steps.map((step, index) => (
                    <React.Fragment key={index}>
                        <div 
                            // FIX: Add onClick handler and conditional styling for interactive steps
                            className={`flex-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-lg text-center flex flex-col items-center justify-center transition-colors ${index < 2 && onStepClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                            onClick={() => index < 2 && onStepClick && onStepClick(index + 1)}
                        >
                            <div className="mb-4"><step.Icon /></div>
                            <h3 className="font-bold text-xl text-slate-800">{step.num}. {step.title}</h3>
                        </div>
                        {index < steps.length - 1 && (
                            <div className="flex-shrink-0 flex items-center">
                                <ChevronRightIcon />
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {steps.map((step) => (
                    <div 
                        key={step.num}
                        // FIX: Add onClick handler and conditional styling for interactive steps
                        className={`w-full bg-white rounded-2xl p-6 border border-slate-200 shadow-lg flex items-center gap-4 text-left transition-colors ${parseInt(step.num, 10) <= 2 && onStepClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                        onClick={() => parseInt(step.num, 10) <= 2 && onStepClick && onStepClick(parseInt(step.num, 10))}
                    >
                        <step.Icon />
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">{step.num}. {step.title}</h3>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HowItWorks;
