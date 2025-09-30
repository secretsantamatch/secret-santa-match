import React from 'react';

interface HowItWorksProps {
    onStepClick: (step: number) => void;
}

const Step: React.FC<{ icon: React.ReactNode; title: string; onClick: () => void }> = ({ icon, title, onClick }) => (
    <button onClick={onClick} className="text-left p-4 bg-slate-50 rounded-lg w-full h-full hover:bg-slate-100 hover:shadow-md transition-all transform hover:-translate-y-1 border border-transparent hover:border-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)]">
        <div className="text-4xl mb-3">{icon}</div>
        <h3 className="font-bold text-slate-800">{title}</h3>
    </button>
);

const HowItWorks: React.FC<HowItWorksProps> = ({ onStepClick }) => {
  return (
    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 text-center mb-6">How It Works</h2>
      <div className="grid md:grid-cols-3 gap-6 items-center text-center">
        <Step icon="📝" title="1. Add Names" onClick={() => onStepClick(1)} />
        <Step icon="✨" title="2. Set Rules" onClick={() => onStepClick(2)} />
        <Step icon="💌" title="3. Share the Results" onClick={() => onStepClick(3)} />
      </div>
    </div>
  );
};

export default HowItWorks;
