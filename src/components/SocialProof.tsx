import React from 'react';
import { Star, Users, Building, Heart } from 'lucide-react';

const SocialProof: React.FC = () => {
    return (
        <section className="my-10 md:my-16">
            <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                <h2 className="text-3xl font-bold text-center text-slate-800 font-serif mb-8">
                    An Organizer's Best Friend
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center max-w-4xl mx-auto">
                    <div className="bg-slate-50 p-6 rounded-xl border">
                        <Heart className="h-10 w-10 text-red-500 mx-auto mb-3" fill="currentColor"/>
                        <p className="text-lg text-slate-600 italic">"The only generator that didn't force my whole family to create an account. A lifesaver!"</p>
                        <p className="font-semibold not-italic mt-3">- Sarah K., Family Organizer</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-xl border">
                         <Building className="h-10 w-10 text-indigo-500 mx-auto mb-3" />
                         <p className="text-lg text-slate-600 italic">"Used this for our 50-person office party. The exclusions feature worked perfectly. Took me 5 minutes."</p>
                         <p className="font-semibold not-italic mt-3">- Mark T., Office Manager</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SocialProof;
