import React, { useState, useEffect } from 'react';
import { Link, Loader2, AlertTriangle } from 'lucide-react';

interface LinkPreviewProps {
  url: string;
  isForPdf?: boolean;
}

interface MicrolinkData {
  title: string;
  description: string;
  image: {
    url: string;
  };
  url: string;
}

const LinkPreview: React.FC<LinkPreviewProps> = ({ url, isForPdf = false }) => {
  const [data, setData] = useState<MicrolinkData | null>(null);
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
        // FIX: Check for existence of import.meta.env before accessing it.
        const apiKey = import.meta.env ? import.meta.env.VITE_MICROLINK_API_KEY : undefined;
        const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}`;
        
        const response = await fetch(apiKey ? `${apiUrl}&x-api-key=${apiKey}` : apiUrl);

        if (!response.ok) {
          throw new Error('Could not fetch link preview.');
        }
        const result = await response.json();
        if (result.status === 'success') {
          setData(result.data);
        } else {
          throw new Error('API returned an error.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, isForPdf]);

  if (isForPdf) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline truncate block">
          {url}
        </a>
      );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-100 border text-sm text-slate-500">
        <Loader2 className="animate-spin h-4 w-4" />
        <span>Loading preview...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border text-sm text-red-700 hover:bg-red-100">
        <Link className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{url}</span>
      </a>
    );
  }

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors no-underline group"
    >
      {data.image && (
        <div className="w-16 h-12 flex-shrink-0 bg-cover bg-center rounded" style={{ backgroundImage: `url(${data.image.url})` }}></div>
      )}
      <div className="overflow-hidden">
        <p className="font-bold text-sm text-slate-800 truncate m-0 group-hover:text-indigo-600">{data.title}</p>
        <p className="text-xs text-slate-500 truncate m-0">{data.description}</p>
      </div>
    </a>
  );
};

export default LinkPreview;