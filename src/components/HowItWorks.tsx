
import React from 'react';

const IconStep1 = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const IconStep2 = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
);

const IconStep3 = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

// FIX: Changed component definition to use React.FC and a named interface for props.
// This correctly types the component, allowing TypeScript to recognize special React props like 'key'.
interface StepProps {
    icon: React.ReactNode;
    step: number;
    title: string;
    description: string;
}

const Step: React.FC<StepProps> = ({ icon, step, title, description }) => (
    <div className="flex flex-col items-center p-4 relative z-10">
        <div className="bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-color-hover)] h-16 w-16 rounded-full flex items-center justify-center shadow-lg mb-4">
            {icon}
        </div>
        <p className="text-sm font-bold text-[var(--primary-color)] tracking-wider">STEP {step}</p>
        <h3 className="font-bold text-xl text-slate-800 mt-1 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm max-w-xs">{description}</p>
    </div>
);

const HowItWorks: React.FC = () => {
    const steps = [
        { icon: <IconStep1 />, title: 'Add Participants', description: "Enter the names, gift notes, and budget for everyone in your gift exchange." },
        { icon: <IconStep2 />, title: 'Set Rules & Style Cards', description: "Add exclusions to prevent people from drawing each other and choose a festive theme for your cards." },
        { icon: <IconStep3 />, title: 'Generate & Download', description: "Instantly generate your matches and download the printable cards and organizer's master list." },
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
                    <Step key={index} icon={step.icon} step={index + 1} title={step.title} description={step.description} />
                ))}
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex flex-col items-center text-center -space-y-4">
                 {steps.flatMap((step, index) => {
                    const elements = [<Step key={`step-${index}`} icon={step.icon} step={index + 1} title={step.title} description={step.description} />];
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
