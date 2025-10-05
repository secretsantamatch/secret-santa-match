import React from 'react';

const BlogPromo: React.FC = () => {
    return (
        <div className="my-10 md:my-16">
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-200 text-center">
                    <h2 className="text-3xl font-bold text-slate-800 font-serif mb-3">Need Some Gift Ideas?</h2>
                    <p className="text-slate-600 max-w-2xl mx-auto mb-6">
                        Download our free, printable Secret Santa Questionnaire! It's the perfect way to help everyone
                        get a gift they'll truly love.
                    </p>
                    <a 
                        href="/secret-santa-questionnaire.html" 
                        className="inline-block bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white font-bold py-3 px-8 rounded-full text-lg transition-colors transform hover:scale-105"
                    >
                        Get the Free Printable
                    </a>
                </div>
            </div>
        </div>
    );
};

export default BlogPromo;
