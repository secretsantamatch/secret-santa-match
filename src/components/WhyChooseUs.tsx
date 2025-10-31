import React from 'react';
import { ShieldCheck, Zap, MailX, Building, Users, GlassWater } from 'lucide-react';

const WhyChooseUs: React.FC = () => {
    return (
        <section className="my-10 md:my-16">
            <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                <h2 className="text-3xl font-bold text-center text-slate-800 font-serif mb-8">
                    Why Choose SecretSantaMatch.com?
                </h2>
                <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    <div className="text-center">
                        <div className="flex items-center justify-center h-16 w-16 bg-red-100 text-red-600 rounded-full mx-auto mb-4">
                            <MailX size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">No Sign-Ups, No Emails</h3>
                        <p className="text-slate-600 mt-2">We're the only major generator that doesn't force you or your participants to create an account or provide an email address. Get started instantly.</p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center h-16 w-16 bg-blue-100 text-blue-600 rounded-full mx-auto mb-4">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Total Privacy</h3>
                        <p className="text-slate-600 mt-2">All your group's information is stored in the private links you share, not on our servers. We never see or save your data, period.</p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center h-16 w-16 bg-green-100 text-green-600 rounded-full mx-auto mb-4">
                            <Zap size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Instant & Easy</h3>
                        <p className="text-slate-600 mt-2">The entire process, from adding names to sharing links, takes less than 5 minutes. It's the fastest, simplest way to organize your gift exchange.</p>
                    </div>
                </div>
                 <div className="mt-12 pt-8 border-t border-slate-200">
                    <h3 className="text-2xl font-bold text-center text-slate-700 font-serif mb-6">Perfect For Any Group</h3>
                    <div className="flex flex-wrap justify-center gap-8 text-center text-slate-600 font-semibold">
                        <div className="flex flex-col items-center gap-2">
                            <Building className="w-10 h-10 text-indigo-500"/>
                            <span>Office Parties</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Users className="w-10 h-10 text-rose-500"/>
                            <span>Family Gatherings</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <GlassWater className="w-10 h-10 text-emerald-500"/>
                            <span>Friends & Clubs</span>
                        </div>
                    </div>
                </div>
                 <div className="text-center mt-12">
                    <a href="/elfster-alternative.html" className="text-indigo-600 hover:text-indigo-800 font-semibold">See how we compare to other sites &rarr;</a>
                </div>
            </div>
        </section>
    );
};

export default WhyChooseUs;
