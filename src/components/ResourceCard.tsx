
import React from 'react';
import type { Resource } from '../types';

interface ResourceCardProps {
  resource: Resource;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const typeColors: Record<string, string> = {
    'Free Download': 'bg-emerald-100 text-emerald-800',
    'Guide & Tips': 'bg-blue-100 text-blue-800',
    'Article': 'bg-slate-100 text-slate-800',
    'Guide & Printable': 'bg-purple-100 text-purple-800',
  };

  return (
    <a 
      href={resource.linkUrl} 
      className="group flex flex-col bg-white rounded-2xl shadow-lg border border-gray-200 h-full transition-all transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)] overflow-hidden"
    >
      <div className="w-full overflow-hidden">
        <img 
          src={resource.thumbnailUrl} 
          alt={resource.title} 
          className="w-full object-cover aspect-[16/9] group-hover:scale-105 transition-transform duration-300" 
        />
      </div>
      <div className="flex-grow p-6 flex flex-col">
        <div className="flex items-center gap-4 mb-3">
            <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${typeColors[resource.type] || typeColors['Article']}`}>
              {resource.type}
            </span>
            {resource.lastUpdated && (
                <span className="text-xs text-slate-400 font-semibold">{resource.lastUpdated}</span>
            )}
        </div>
        <h3 className="text-xl font-bold text-slate-800 group-hover:text-[var(--primary-color)] transition-colors">
          {resource.title}
        </h3>
        <p className="text-slate-600 mt-2 text-sm leading-relaxed flex-grow">
          {resource.description}
        </p>
        <div className="mt-4 font-bold text-slate-500 group-hover:text-[var(--primary-color)] transition-colors self-start">
            Read More &rarr;
        </div>
      </div>
    </a>
  );
};

export default ResourceCard;
