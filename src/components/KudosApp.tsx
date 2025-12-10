
import React, { useState, useEffect } from 'react';
import KudosCreate from './KudosCreate';
import KudosDashboard from './KudosDashboard';
import Header from './Header';
import Footer from './Footer';

const KudosApp: React.FC = () => {
    const [route, setRoute] = useState<'create' | 'dashboard'>('create');
    const [publicId, setPublicId] = useState<string | null>(null);
    const [adminKey, setAdminKey] = useState<string | null>(null);

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1);
            const params = new URLSearchParams(hash);
            const pId = params.get('id');
            const aKey = params.get('admin');

            if (pId) {
                setPublicId(pId);
                setAdminKey(aKey);
                setRoute('dashboard');
            } else {
                setRoute('create');
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        handleHashChange();

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
            <Header />
            <main className="flex-grow">
                {route === 'create' ? (
                    <KudosCreate />
                ) : (
                    <KudosDashboard publicId={publicId!} adminKey={adminKey} />
                )}
            </main>
            <Footer />
        </div>
    );
};

export default KudosApp;
