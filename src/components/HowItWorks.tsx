import React from 'react';

const IconStep1 = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14h6m-6 4h4" />
    </svg>
);

const IconStep2 = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12v10H4V12" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 7h20v5H2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V7" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
);

const IconStep3 = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

interface StepProps {
    icon: React.ReactNode;
    title: string;
}

const Step: React.FC<StepProps> = ({ icon, title }) => (
    <div className="flex flex-col items-center p-4 relative z-10">
        <div className="bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-color-hover)] h-16 w-16 rounded-full flex items-center justify-center shadow-lg mb-4">
            {icon}
        </div>
        <h3 className="font-bold text-xl text-slate-800 mt-1">{title}</h3>
    </div>
);

const HowItWorks: React.FC = () => {
    const steps = [
        { icon: <IconStep1 />, title: '1. Add Names' },
        { icon: <IconStep2 />, title: '2. Generate Matches' },
        { icon: <IconStep3 />, title: '3. Download, Print & Send' },
    ];

    return (
        <div className="my-12 bg-slate-50/70 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-slate-200">
            <h2 className="text-3xl font-bold text-center text-slate-800 mb-8 font-serif">How It Works in 3 Easy Steps</h2>
            
            {/* Desktop View */}
            <div className="hidden md:grid grid-cols-3 gap-8 text-center relative">
                <div className="absolute top-8 left-0 w-full h-px z-0">
                    <svg width="100%" height="1" preserveAspectRatio="none" className="absolute">
                       <line x1="25%" y1="0" x2="75%" y2="0" stroke="#d1d5db" strokeWidth="2" strokeDasharray="6 6" />
                    </svg>
                </div>
                {steps.map((step, index) => (
                    <Step key={index} icon={step.icon} title={step.title} />
                ))}
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex flex-col items-center text-center -space-y-4">
                 {steps.flatMap((step, index) => {
                    const elements = [<Step key={`step-${index}`} icon={step.icon} title={step.title} />];
                    if (index < steps.length - 1) {
                        elements.push(<div key={`line-${index}`} className="h-16 w-px border-l-2 border-dashed border-gray-300"></div>);
                    }
                    return elements;
                })}
            </div>
        </div>
    );
};

export default HowItWorks;
