import React, { useState, useEffect } from 'react';
import ResourceCard from './ResourceCard';
import type { Resource } from '../types';

const FeaturedResources: React.FC = () => {
  const [featured, setFeatured] = useState<Resource[]>([]);

  useEffect(() => {
    fetch('/resources.json')
      .then(response => response.ok ? response.json() : Promise.reject('Network response was not ok'))
      .then((data: Resource[]) => {
        // Hand-pick the most valuable resources to feature
        const featuredIds = ['questionnaire', 'holiday-budget-calculator', 'how-to-organize'];
        const featuredPosts = featuredIds
          .map(id => data.find(post => post.id === id))
          .filter(Boolean) as Resource[]; // Filter out any not found
        setFeatured(featuredPosts);
      })
      .catch(err => {
        console.error("Could not load featured resources:", err);
      });
  }, []);

  if (featured.length === 0) {
    return null; // Don't render anything if the resources aren't loaded or found
  }

  return (
    <section className="my-10 md:my-16">
      <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-slate-800 font-serif mb-8">
          Featured Holiday Resources
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {featured.map(resource => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedResources;
