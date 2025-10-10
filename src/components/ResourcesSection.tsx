import React, { useState, useEffect } from 'react';
// FIX: Removed unused import of 'resources' which does not exist in the target file, causing a compilation error.
import ResourceCard from './ResourceCard';
import type { Resource } from '../data/resources';

const ResourcesSection: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    fetch('/resources.json')
      .then(res => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then(data => setResources(data))
      .catch(err => {
        // FIX: The original code mentioned a static fallback that didn't exist.
        // This now correctly logs that the fetch failed and the component will not render.
        console.error("Failed to load resources from /resources.json; component will not render.", err);
      });
  }, []);

  if (resources.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
        <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
          <h2 className="text-3xl font-bold text-center text-slate-800 font-serif mb-8">
            Holiday Resources & Fun Extras
          </h2>
          <div className="space-y-6 max-w-4xl mx-auto">
            {resources.map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResourcesSection;
