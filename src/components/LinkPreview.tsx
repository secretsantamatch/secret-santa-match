import React, { useState, useEffect } from 'react';
import { Link, Loader2, ShoppingCart } from 'lucide-react';

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

const RETAILERS: { domain: string; name: string; color: string }[] = [
    { domain: 'amazon.', name: 'Amazon', color: 'bg-amber-400' },
    { domain: 'walmart.com', name: 'Walmart', color: 'bg-blue-600' },
    { domain: 'target.com', name: 'Target', color: 'bg-red-600' },
    { domain: 'etsy.com', name: 'Etsy', color: 'bg-orange-500' },
    { domain: 'ebay.com', name: 'eBay', color: 'bg-red-500' },
    { domain: 'bestbuy.com', name: 'Best Buy', color: 'bg-yellow-400' },
    { domain: 'homedepot.com', name: 'Home Depot', color: 'bg-orange-600' },
    { domain: 'lowes.com', name: 'Lowe\'s', color: 'bg-blue-700' },
    { domain: 'macys.com', name: 'Macy\'s', color: 'bg-red-700' },
    { domain: 'kohls.com', name: 'Kohl\'s', color: 'bg-blue-800' },
    { domain: 'nordstrom.com', name: 'Nordstrom', color: 'bg-slate-800' },
    { domain: 'sephora.com', name: 'Sephora', color: 'bg-black' },
    { domain: 'ulta.com', name: 'Ulta', color: 'bg-pink-500' },
    { domain: 'wayfair.com', name: 'Wayfair', color: 'bg-purple-600' },
    { domain: 'crateandbarrel.com', name: 'Crate & Barrel', color: 'bg-gray-700' },
    { domain: 'williams-sonoma.com', name: 'Williams Sonoma', color: 'bg-green-800' },
    { domain: 'potterybarn.com', name: 'Pottery Barn', color: 'bg-stone-700' },
    { domain: 'uncommongoods.com', name: 'Uncommon Goods', color: 'bg-teal-500' },
    { domain: 'lego.com', name: 'LEGO', color: 'bg-yellow-400' },
    { domain: 'barnesandnoble.com', name: 'Barnes & Noble', color: 'bg-green-700' },
    { domain: 'rei.com', name: 'REI', color: 'bg-green-900' },
    { domain: 'dicksportinggoods.com', name: 'Dick\'s Sporting Goods', color: 'bg-green-600' },
];


const LinkPreview: React.FC<LinkPreviewProps> = ({ url, isForPdf = false }) => {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const detectedRetailer = RETAILERS.find(r => url.toLowerCase().includes(r.domain));

  useEffect(() => {
    // Don't fetch if it's a PDF, there's no URL, or it's a special-cased retailer link.
    if (!url || isForPdf || detectedRetailer) {
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
  }, [url, isForPdf, detectedRetailer]);

  // Simple link for PDFs
  if (isForPdf) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline truncate block">
          {url}
        </a>
      );
  }

  // Custom "Retailer-aware" card
  if (detectedRetailer) {
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors no-underline group"
        >
          <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center ${detectedRetailer.color} rounded-md text-white`}>
            <ShoppingCart size={20} />
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="font-bold text-sm text-slate-800 m-0 group-hover:text-indigo-600">View on {detectedRetailer.name}</p>
            <p className="text-xs text-slate-500 truncate m-0 mt-1">{url}</p>
          </div>
        </a>
      );
  }

  // Loading state (for non-retailer links)
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-100 border text-sm text-slate-500">
        <Loader2 className="animate-spin h-4 w-4" />
        <span>Loading preview...</span>
      </div>
    );
  }
  
  // Error state or no data -> show simple link
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
          <div className="overflow-hidden min-w-0">
            <p className="font-bold text-sm text-slate-800 truncate m-0 group-hover:text-indigo-600">{data.title}</p>
            {data.description && <p className="text-xs text-slate-500 truncate m-0 mt-1">{data.description}</p>}
          </div>
        </a>
      );
  }

  // Data without image -> show text-only preview card
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors no-underline group">
        <div className="overflow-hidden min-w-0">
            <p className="font-semibold text-sm truncate m-0 text-slate-800 group-hover:text-indigo-600">{data.title}</p>
            {data.description && <p className="text-xs text-slate-500 m-0 mt-1 line-clamp-2">{data.description}</p>}
        </div>
    </a>
  );
};

export default LinkPreview;
