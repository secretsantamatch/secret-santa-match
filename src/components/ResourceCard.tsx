import React from 'react';
import type { Resource } from '../data/resources';

interface ResourceCardProps {
  resource: Resource;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const typeColors: Record<string, string> = {
    'Free Download': 'bg-emerald-100 text-emerald-800',
    'Guide & Tips': 'bg-blue-100 text-blue-800',
    'Article': 'bg-slate-100 text-slate-800',
  };

  return (
    <a 
      href={resource.linkUrl} 
      className="group flex flex-col sm:flex-row items-center bg-white rounded-2xl shadow-lg border border-gray-200 p-4 gap-6 transition-all transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)]"
    >
      <div className="w-full sm:w-1/3 flex-shrink-0">
        <img 
          src={resource.thumbnailUrl} 
          alt={resource.title} 
          className="rounded-lg shadow-md w-full object-cover aspect-[4/3]" 
        />
      </div>
      <div className="flex-grow text-center sm:text-left">
        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-2 ${typeColors[resource.type] || typeColors['Article']}`}>
          {resource.type}
        </span>
        <h3 className="text-xl font-bold text-slate-800 group-hover:text-[var(--primary-color)] transition-colors">
          {resource.title}
        </h3>
        <p className="text-slate-600 mt-2 text-sm leading-relaxed">
          {resource.description}
        </p>
      </div>
    </a>
  );
};

export default ResourceCard;
