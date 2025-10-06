import React from 'react';
import { resources } from '../data/resources';
import ResourceCard from './ResourceCard';

const ResourcesSection: React.FC = () => {
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
