import React, { useState, useEffect } from 'react';
import { Link, Loader2 } from 'lucide-react';

interface LinkPreviewProps {
  url: string;
  isForPdf?: boolean;
}

interface PreviewData {
  title: string;
  description: string | null;
  image: string | null;
  url: string;
}

const LinkPreview: React.FC<LinkPreviewProps> = ({ url, isForPdf = false }) => {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || isForPdf) {
        setLoading(false);
        return;
    };

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = `/.netlify/functions/get-link-preview?url=${encodeURIComponent(url)}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error('Could not fetch link preview.');
        }
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }

        setData(result);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, isForPdf]);

  // Simple link for PDFs
  if (isForPdf) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline truncate block">
          {url}
        </a>
      );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-100 border text-sm text-slate-500">
        <Loader2 className="animate-spin h-4 w-4" />
        <span>Loading preview...</span>
      </div>
    );
  }
  
  // Error state or no data at all -> show simple link
  if (error || !data?.title) {
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 hover:bg-slate-50 transition-colors no-underline">
            <Link className="h-4 w-4 flex-shrink-0 text-slate-400" />
            <span className="truncate">{url}</span>
        </a>
    );
  }
  
  // Data with image -> show full preview
  if (data.image) {
      return (
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors no-underline group"
        >
          <div className="w-20 h-16 flex-shrink-0 bg-cover bg-center rounded" style={{ backgroundImage: `url(${data.image})` }}></div>
          <div className="overflow-hidden">
            <p className="font-bold text-sm text-slate-800 truncate m-0 group-hover:text-indigo-600">{data.title}</p>
            {data.description && <p className="text-xs text-slate-500 truncate m-0 mt-1">{data.description}</p>}
          </div>
        </a>
      );
  }

  // Data without image (e.g., Amazon) -> show text-only preview card
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors no-underline group">
        <div className="overflow-hidden">
            <p className="font-semibold text-sm truncate m-0 text-slate-800 group-hover:text-indigo-600">{data.title}</p>
            {data.description && <p className="text-xs text-slate-500 m-0 mt-1 line-clamp-2">{data.description}</p>}
        </div>
    </a>
  );
};

export default LinkPreview;