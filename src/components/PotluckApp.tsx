
import React, { useState, useEffect } from 'react';
import PotluckCreate from './PotluckCreate';
import PotluckDashboard from './PotluckDashboard';
import Header from './Header';
import Footer from './Footer';

const PotluckApp: React.FC = () => {
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
        handleHashChange(); // Init

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    return (
        <div className="min-h-screen bg-[#fff7ed] text-slate-800 font-sans">
            <Header />
            {route === 'create' ? (
                <PotluckCreate />
            ) : (
                <PotluckDashboard publicId={publicId!} adminKey={adminKey} />
            )}
            <Footer />
        </div>
    );
};

export default PotluckApp;
