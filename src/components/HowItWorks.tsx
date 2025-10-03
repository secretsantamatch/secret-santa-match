import React from 'react';

const HowItWorks: React.FC = () => {
  const steps = [
    { number: 1, title: 'Add Participants', description: "Enter the names of everyone playing. Add notes or gift ideas for each person." },
    { number: 2, title: 'Set the Rules', description: "Add exclusions to prevent people from drawing each other, set a budget, and add event details." },
    { number: 3, title: 'Generate Links', description: "Get a unique, private link for each participant. No emails or sign-ups needed!" },
    { number: 4, title: 'Share & Enjoy!', description: "Send each person their private link. They click it to see who they're buying for." },
  ];

  return (
    <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
      <h2 className="text-3xl font-bold text-slate-800 text-center mb-6 font-serif">How It Works</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
        {steps.map((step) => (
          <div key={step.number} className="flex flex-col items-center">
            <div className="flex items-center justify-center bg-[var(--primary-color)] text-white rounded-full h-12 w-12 text-2xl font-bold mb-3 shadow">
              {step.number}
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">{step.title}</h3>
            <p className="text-sm text-gray-600">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
