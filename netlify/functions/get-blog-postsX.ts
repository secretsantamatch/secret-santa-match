
// A real project would use `import type { Handler } from '@netlify/functions';`

interface BlogPost {
  title: string;
  link: string;
  description: string;
}

// Simple regex-based XML parser. Not robust for all feeds, but dependency-free and works for this specific WordPress feed structure.
const parseRssFeed = (xmlString: string): BlogPost[] => {
    const posts: BlogPost[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    // Handle titles with or without CDATA wrappers for more robust parsing.
    const titleRegex = /<title>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/;
    const linkRegex = /<link>([\s\S]*?)<\/link>/;
    // Handle descriptions with or without CDATA wrappers.
    const descriptionRegex = /<description>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/description>/;
    const pTagRegex = /<p>([\s\S]*?)<\/p>/; 

    let match;
    while ((match = itemRegex.exec(xmlString)) !== null && posts.length < 3) {
        const itemContent = match[1];
        const titleMatch = itemContent.match(titleRegex);
        const linkMatch = itemContent.match(linkRegex);
        const descriptionMatch = itemContent.match(descriptionRegex);

        if (titleMatch && linkMatch && descriptionMatch) {
            // Use the first or second capturing group for the title, whichever matched.
            const rawTitle = (titleMatch[1] || titleMatch[2] || '').trim();
            
            // Use the first or second capturing group for the description.
            const descHtml = (descriptionMatch[1] || descriptionMatch[2] || '').trim();
            
            // Try to grab the first paragraph for a concise summary.
            const pMatch = descHtml.match(pTagRegex);
            let cleanDescription = pMatch ? pMatch[1] : descHtml;
            
            // Cleanup: remove any remaining HTML tags and extra whitespace.
            cleanDescription = cleanDescription.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
            
            // Truncate the description for a consistent card size.
            if (cleanDescription.length > 150) {
                const lastSpace = cleanDescription.lastIndexOf(' ', 147);
                cleanDescription = cleanDescription.substring(0, lastSpace > 0 ? lastSpace : 147) + '...';
            }

            posts.push({
                title: rawTitle,
                link: linkMatch[1].trim(),
                description: cleanDescription,
            });
        }
    }
    return posts;
};

// The async handler for the Netlify function
export async function handler(event: any, context: any) {
    const FEED_URL = 'https://blog.secretsantamatch.com/feed/';
    
    try {
        const response = await fetch(FEED_URL, { headers: { 'User-Agent': 'SecretSantaMatch-BlogFetcher/1.0' } });
        if (!response.ok) {
            throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
        }
        const xmlString = await response.text();
        const posts = parseRssFeed(xmlString);

        if (posts.length === 0) {
            throw new Error("Could not parse any posts from the RSS feed.");
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Allow requests from any origin
            },
            body: JSON.stringify(posts),
        };

    } catch (error) {
        console.error('Error fetching or parsing RSS feed:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch blog posts.' }),
        };
    }
}
