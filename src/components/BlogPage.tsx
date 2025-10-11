import React, { useState, useEffect, useMemo } from 'react';
import type { Resource } from '../types';
import ResourceCard from './ResourceCard';
import Footer from './Footer';
import BackToTopButton from './BackToTopButton';

const parseDate = (dateStr?: string): Date => {
  if (!dateStr) return new Date(0); // Return a very old date for items without one
  return new Date(dateStr);
};

const BlogPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('default');
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');

  useEffect(() => {
    document.documentElement.dataset.theme = 'default';

    fetch('/resources.json')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => {
        setResources(data);
        setStatus('success');
      })
      .catch(err => {
        console.error("Could not load resources:", err);
        setStatus('error');
      });
  }, []);

  const categories = useMemo(() => {
    if (resources.length === 0) return [];
    const uniqueTypes = [...new Set(resources.map(r => r.type))];
    return ['All', ...uniqueTypes];
  }, [resources]);

  const filteredResources = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    
    let filtered = selectedCategory === 'All'
        ? resources
        : resources.filter(r => r.type === selectedCategory);

    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(lowercasedFilter) ||
        r.description.toLowerCase().includes(lowercasedFilter)
      );
    }

    const sorted = [...filtered];

    if (sortOrder === 'newest') {
      sorted.sort((a, b) => parseDate(b.lastUpdated).getTime() - parseDate(a.lastUpdated).getTime());
    }

    return sorted;
  }, [resources, searchTerm, selectedCategory, sortOrder]);

  const renderContent = () => {
    if (status === 'loading') {
      return (
        <div className="text-center py-16">
          <p className="text-slate-500">Loading posts...</p>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg border">
            <h2 className="text-2xl font-bold text-red-700">Error Loading Posts</h2>
            <p className="text-slate-500 mt-2">Could not load resources. Please try refreshing the page.</p>
        </div>
      );
    }

    if (filteredResources.length > 0) {
      return filteredResources.map(resource => (
        <ResourceCard key={resource.id} resource={resource} />
      ));
    }

    return (
      <div className="text-center py-16 bg-white rounded-2xl shadow-lg border">
        <h2 className="text-2xl font-bold text-slate-700">No Posts Found</h2>
        <p className="text-slate-500 mt-2">Try adjusting your search or category filter.</p>
      </div>
    );
  };


  return (
    <div className="bg-slate-50 min-h-screen">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
          <div className="flex justify-between items-center">
             <a href="/" className="flex items-center gap-3">
                <img src="/logo_256.png" alt="Secret Santa Generator Logo" className="w-16 h-16" />
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
              Your go-to resource for gift exchange ideas, party planning guides, holiday tips, free printables, and fun games for any occasion.
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
            <div className="mt-6 p-4 bg-slate-100 rounded-2xl flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4">
              <div className="flex flex-wrap justify-center gap-3">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
                      selectedCategory === category
                        ? 'bg-[var(--primary-color)] text-white shadow'
                        : 'bg-white text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="sort-order" className="text-sm font-semibold text-slate-600">Sort by:</label>
                <select
                  id="sort-order"
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value)}
                  className="px-3 py-2 text-sm font-semibold rounded-full bg-white text-slate-700 border-transparent focus:ring-2 focus:ring-[var(--primary-color)]"
                >
                  <option value="default">Default</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>
        </div>
      </div>

      <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl mt-8">
          <div className="space-y-8">
            {renderContent()}
          </div>
      </main>
      
      <Footer />
      <BackToTopButton />
    </div>
  );
};

export default BlogPage;
