import React, { useEffect } from 'react';

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

interface AdBannerProps {
    'data-ad-client': string;
    'data-ad-slot': string;
    'data-ad-format'?: string;
    'data-full-width-responsive'?: string;
}

const AdBanner: React.FC<AdBannerProps> = (props) => {
    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error('AdSense error:', e);
        }
    }, []);

    return (
        <div className="my-6 text-center">
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                {...props}
            ></ins>
        </div>
    );
};

export default AdBanner;