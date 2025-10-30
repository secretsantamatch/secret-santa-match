import React from 'react';

const VideoTutorial: React.FC = () => {
    return (
        <section className="my-10 md:my-16">
            <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                <h2 className="text-3xl font-bold text-center text-slate-800 font-serif mb-8">
                    See It In Action (2-Minute Guide)
                </h2>
                <div className="aspect-w-16 aspect-h-9 max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-lg">
                    <iframe
                        src="https://www.youtube.com/embed/H6JpNsKRVKE?start=21"
                        title="How to Use Secret Santa Match Tutorial"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                    ></iframe>
                </div>
            </div>
             <style>{`
                .aspect-w-16 {
                    position: relative;
                    padding-bottom: 56.25%; /* 16:9 ratio */
                }
                .aspect-h-9 {
                    height: 0;
                }
                .aspect-w-16 > iframe {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }
            `}</style>
        </section>
    );
};

export default VideoTutorial;
