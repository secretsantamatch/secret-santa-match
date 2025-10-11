import React, { useState, useEffect, useMemo } from 'react';
import type { Resource } from '../data/resources';
import ResourceCard from './ResourceCard';
import Footer from './Footer';
import BackToTopButton from './BackToTopButton';

const BlogPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Always set the default theme for the blog page for a consistent look
    document.documentElement.dataset.theme = 'default';

    fetch('/resources.json')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => setResources(data))
      .catch(err => {
        console.error("Could not load resources:", err);
        setError("Could not load resources. Please try refreshing the page.");
      });
  }, []);

  const filteredResources = useMemo(() => {
    if (!searchTerm) return resources;
    const lowercasedFilter = searchTerm.toLowerCase();
    return resources.filter(r => 
      r.title.toLowerCase().includes(lowercasedFilter) ||
      r.description.toLowerCase().includes(lowercasedFilter) ||
      r.type.toLowerCase().includes(lowercasedFilter)
    );
  }, [resources, searchTerm]);

  return (
    <div className="bg-slate-50 min-h-screen">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
          <div className="flex justify-between items-center">
             <a href="/" className="flex items-center gap-3">
                <img src="/logo_256.png" alt="Secret Santa Generator Logo" className="w-12 h-12" />
                <span className="hidden sm:inline text-xl font-bold text-slate-700">SecretSantaMatch.com</span>
              </a>
              <a href="/" className="bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white font-bold py-2 px-5 text-md rounded-full shadow-md transform hover:scale-105 transition-all">
                &larr; Back to Generator
              </a>
          </div>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="container mx-auto p-4 sm:p-6 md:py-12 max-w-5xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-orange-500 font-serif">The Secret Santa Blog</h1>
            <p className="text-lg text-gray-600 mt-4 max-w-3xl mx-auto">
              Your go-to resource for gift exchange ideas, holiday tips, free printables, and party games.
            </p>
            <div className="mt-8 max-w-xl mx-auto">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search for posts (e.g., 'games', 'gifts')..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full p-4 pl-12 border-2 border-slate-200 rounded-full focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition"
                  aria-label="Search blog posts"
                />
                <svg className="h-6 w-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
        </div>
      </div>


      <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl mt-8">
        {error && <p className="text-center text-red-500 bg-red-100 p-4 rounded-lg">{error}</p>}
        {!error && (
          <div className="space-y-8">
            {filteredResources.length > 0 ? (
              filteredResources.map(resource => (
                <ResourceCard key={resource.id} resource={resource} />
              ))
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border">
                <h2 className="text-2xl font-bold text-slate-700">No Posts Found</h2>
                <p className="text-slate-500 mt-2">Try adjusting your search term or clearing the search box.</p>
              </div>
            )}
          </div>
        )}
      </main>
      
      <Footer />
      <BackToTopButton />
    </div>
  );
};

export default BlogPage;
