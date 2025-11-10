import React, { useState, useEffect, useMemo } from 'react';
import type { Resource } from '../types';
import ResourceCard from './ResourceCard';
import Footer from './Footer';
import BackToTopButton from './BackToTopButton';
import FeaturedResources from './FeaturedResources';

const parseDate = (dateStr?: string): Date => {
  if (!dateStr) return new Date(0); // Return a very old date for items without one
  return new Date(dateStr);
};

const BlogPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState('All Topics');
  const [sortOrder, setSortOrder] = useState('newest');
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');

  useEffect(() => {
    document.documentElement.dataset.theme = 'default';

    fetch('/resources.json')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => {
        setResources(data.resources);
        setStatus('success');
      })
      .catch(err => {
        console.error("Could not load resources:", err);
        setStatus('error');
      });
  }, []);

  const primaryCategories = ['All', 'Downloads', 'Guides', 'Articles'];
  
  const topics = useMemo(() => {
    if (resources.length === 0) return [];
    const keywordSet = new Set<string>();
    const relevantKeywords = ['Christmas', 'Halloween', 'Holiday', 'Finance', 'Games', 'Gifts', 'Budget', 'Party', 'Planning'];
    resources.forEach(r => {
        r.keywords?.forEach(k => {
            const keywordTitleCase = k.charAt(0).toUpperCase() + k.slice(1);
            if (relevantKeywords.includes(keywordTitleCase)) {
                keywordSet.add(keywordTitleCase);
            }
        });
    });
    return ['All Topics', ...Array.from(keywordSet).sort()];
  }, [resources]);


  const { featuredPost, regularPosts, hasResults } = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    
    let filtered = resources;

    // 1. Filter by primary category
    if (selectedCategory !== 'All') {
        const typesForCategory: { [key: string]: string[] } = {
            'Downloads': ['Free Download', 'Guide & Printable'],
            'Guides': ['Guide & Tips', 'Guide & Printable'],
            'Articles': ['Article'],
        };
        const selectedTypes = typesForCategory[selectedCategory];
        if (selectedTypes) {
            filtered = filtered.filter(r => selectedTypes.includes(r.type));
        }
    }
    
    // 2. Filter by topic
    if (selectedTopic !== 'All Topics') {
        const topicKeyword = selectedTopic.toLowerCase();
        filtered = filtered.filter(r => r.keywords?.some(k => k.toLowerCase() === topicKeyword));
    }

    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(lowercasedFilter) ||
        r.description.toLowerCase().includes(lowercasedFilter) ||
        (r.keywords && r.keywords.some(k => k.toLowerCase().includes(lowercasedFilter)))
      );
    }

    const sorted = [...filtered];
    if (sortOrder === 'newest') {
      sorted.sort((a, b) => parseDate(b.lastUpdated).getTime() - parseDate(a.lastUpdated).getTime());
    } else if (sortOrder === 'oldest') {
      sorted.sort((a, b) => parseDate(a.lastUpdated).getTime() - parseDate(b.lastUpdated).getTime());
    }

    return {
        featuredPost: sorted[0] || null,
        regularPosts: sorted.slice(1),
        hasResults: sorted.length > 0,
    };
  }, [resources, searchTerm, selectedCategory, selectedTopic, sortOrder]);

  const typeColors: Record<string, string> = {
    'Free Download': 'bg-emerald-100 text-emerald-800',
    'Guide & Tips': 'bg-blue-100 text-blue-800',
    'Article': 'bg-slate-100 text-slate-800',
    'Guide & Printable': 'bg-purple-100 text-purple-800',
  };

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

    if (!hasResults) {
      return (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg border">
          <h2 className="text-2xl font-bold text-slate-700">No Posts Found</h2>
          <p className="text-slate-500 mt-2">Try adjusting your search or filter.</p>
        </div>
      );
    }

    return (
        <>
            {featuredPost && (
                <section aria-labelledby="featured-post-heading" className="mb-12 animate-fade-in">
                    <h2 id="all-posts-heading" className="text-3xl font-bold text-slate-800 font-serif mb-8">
                      Latest Post
                    </h2>
                    <a 
                      href={featuredPost.linkUrl} 
                      className="group grid md:grid-cols-2 items-center bg-white rounded-2xl shadow-lg border border-gray-200 transition-shadow hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)] overflow-hidden"
                    >
                      <div className="w-full h-full overflow-hidden">
                        <img 
                          src={featuredPost.thumbnailUrl} 
                          alt={featuredPost.title} 
                          className="w-full h-full object-cover aspect-[16/9] md:aspect-auto group-hover:scale-105 transition-transform duration-300" 
                          loading="lazy"
                          width="640"
                          height="360"
                        />
                      </div>
                      <div className="p-8">
                        <div>
                          <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${typeColors[featuredPost.type] || typeColors['Article']}`}>
                            {featuredPost.type}
                          </span>
                          {featuredPost.lastUpdated && (
                            <span className="text-xs text-slate-400 font-semibold ml-4">{featuredPost.lastUpdated}</span>
                          )}
                        </div>
                        <h3 className="text-2xl lg:text-3xl font-bold text-slate-800 group-hover:text-[var(--primary-color)] transition-colors mt-3">
                          {featuredPost.title}
                        </h3>
                        <p className="text-slate-600 mt-3 text-base leading-relaxed">
                          {featuredPost.description}
                        </p>
                        <span className="mt-4 inline-block font-bold text-[var(--primary-color)] group-hover:underline">
                          Read More &rarr;
                        </span>
                      </div>
                    </a>
                </section>
            )}

            {regularPosts.length > 0 && (
              <section aria-labelledby="all-posts-heading">
                <h2 id="all-posts-heading" className="text-3xl font-bold text-slate-800 font-serif mb-8 border-t pt-8 mt-12">
                  All Posts
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {regularPosts.map((resource, index) => (
                    <React.Fragment key={resource.id}>
                      <ResourceCard resource={resource} />
                      {index === 1 && (
                        <div className="bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center flex items-center justify-center min-h-[250px] md:col-span-2">
                          <div className="text-slate-500">
                            <p className="font-semibold text-lg">Want to reach holiday planners?</p>
                            <p className="text-sm">This space is available for advertising.</p>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </section>
            )}
        </>
    )
  };


  return (
    <div className="bg-slate-50 min-h-screen">
       <div className="bg-gradient-to-r from-green-600 to-red-600 p-4 text-white text-center shadow-md sticky top-0 z-50">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-4">
          <p className="font-bold text-lg flex-grow text-center sm:text-left">
            Ready to organize your gift exchange? 
            <span className="hidden sm:inline"> Our free Secret Santa Generator is just a click away!</span>
          </p>
          <a href="/generator.html" className="flex-shrink-0 bg-white text-red-600 font-bold py-2 px-6 rounded-full shadow-md transform hover:scale-105 transition-transform duration-200 ease-in-out">
            Start Drawing Names &rarr;
          </a>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="container mx-auto p-4 sm:p-6 md:py-12 max-w-5xl text-center">
            <div className="flex justify-center items-center gap-4 mb-4">
                <img src="/logo_256.png" alt="Secret Santa Generator Logo" className="w-16 h-16 sm:w-20 sm:h-20" />
            </div>
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
            <div className="mt-6 p-4 bg-slate-100 rounded-2xl flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-4 gap-y-3">
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="text-sm font-semibold text-slate-600 mr-2">Category:</span>
                {primaryCategories.map(category => (
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
              <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-300 pt-3 sm:pt-0 sm:pl-4 mt-3 sm:mt-0 sm:ml-2">
                <label htmlFor="topic-filter" className="text-sm font-semibold text-slate-600">Topic:</label>
                <select
                  id="topic-filter"
                  value={selectedTopic}
                  onChange={e => setSelectedTopic(e.target.value)}
                  className="px-3 py-2 text-sm font-semibold rounded-full bg-white text-slate-700 border-transparent focus:ring-2 focus:ring-[var(--primary-color)]"
                >
                  {topics.map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>
            </div>
        </div>
      </div>

      <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl mt-8">
          <FeaturedResources />
          {renderContent()}
      </main>
      
      <Footer />
      <BackToTopButton />
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default BlogPage;