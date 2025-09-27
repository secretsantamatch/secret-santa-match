
import React, { useState, useEffect } from 'react';

interface BlogPost {
  title: string;
  description: string;
  link: string;
}

// Static data is kept as a fallback in case the live fetch fails.
const fallbackPosts: BlogPost[] = [
  {
    title: '15 Unique Secret Santa Gift Ideas Under $25',
    description: 'Stuck on what to get? We\'ve compiled a list of creative and thoughtful gifts that won\'t break the bank.',
    link: 'https://blog.secretsantamatch.com/secret-santa-gift-ideas-under-25/',
  },
  {
    title: 'How to Host the Perfect Virtual Gift Exchange',
    description: 'Tips and tricks for making your remote Secret Santa party fun, engaging, and memorable for everyone involved.',
    link: 'https://blog.secretsantamatch.com/virtual-secret-santa/',
  },
  {
    title: 'The Ultimate Guide to Office Gift Exchange Etiquette',
    description: 'Navigate the do\'s and don\'ts of workplace gifting to ensure your holiday celebration is a success.',
    link: 'https://blog.secretsantamatch.com/office-gift-exchange-etiquette/',
  },
];

const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);

// A reusable component for displaying a single post card.
const PostCard: React.FC<{ post: BlogPost }> = ({ post }) => (
    <a 
        href={post.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-slate-50 hover:bg-white border border-slate-200 hover:border-[var(--primary-color)] p-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group"
    >
        <h3 className="font-bold text-lg text-slate-800 mb-2 min-h-[3.5rem]">{post.title}</h3>
        <p className="text-sm text-gray-600 mb-4 h-24">{post.description}</p>
        <span className="font-semibold text-[var(--primary-text)] text-sm flex items-center">
            Read More <ArrowRightIcon />
        </span>
    </a>
);

// A skeleton loader component to show while data is being fetched.
const SkeletonCard: React.FC = () => (
  <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl">
    <div className="bg-slate-200 h-5 rounded w-3/4 mb-4 animate-pulse"></div>
    <div className="bg-slate-200 h-5 rounded w-1/2 mb-4 animate-pulse" style={{ animationDelay: '50ms' }}></div>
    <div className="bg-slate-200 h-4 rounded w-full mb-2 animate-pulse" style={{ animationDelay: '100ms' }}></div>
    <div className="bg-slate-200 h-4 rounded w-full mb-2 animate-pulse" style={{ animationDelay: '150ms' }}></div>
    <div className="bg-slate-200 h-4 rounded w-5/6 mb-8 animate-pulse" style={{ animationDelay: '200ms' }}></div>
    <div className="bg-slate-200 h-5 rounded w-1/3 animate-pulse" style={{ animationDelay: '250ms' }}></div>
  </div>
);

const BlogPromo: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                // The endpoint for the Netlify function, which proxies the request to the RSS feed.
                const response = await fetch('/.netlify/functions/get-blog-posts');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data: BlogPost[] = await response.json();
                setPosts(data.slice(0, 3)); // Ensure we only ever show 3 posts
            } catch (error) {
                console.error("Failed to fetch blog posts, using fallback data.", error);
                setPosts(fallbackPosts); // Use static data as a fallback on any error
            } finally {
                setIsLoading(false);
            }
        };
        fetchPosts();
    }, []);

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl mt-12">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
                <h2 className="text-3xl font-bold text-slate-800 text-center mb-2">From the Blog</h2>
                <p className="text-center text-gray-600 mb-8">Get gift ideas, party tips, and more to make your gift exchange a hit!</p>
                <div className="grid md:grid-cols-3 gap-6">
                    {isLoading ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : (
                        posts.map((post, index) => (
                           <PostCard key={index} post={post} />
                        ))
                    )}
                </div>
                 <div className="text-center mt-8">
                    <a href="https://blog.secretsantamatch.com/" target="_blank" rel="noopener noreferrer" className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-3 px-6 rounded-full shadow-md transform hover:scale-105 transition-transform">
                        Visit Our Blog
                    </a>
                </div>
            </div>
        </div>
    );
};

export default BlogPromo;
