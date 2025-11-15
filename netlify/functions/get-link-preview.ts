import type { Context } from '@netlify/functions';

// Simple regex to find Open Graph meta tags. This avoids pulling in heavy parsing libraries.
const getOgTag = (html: string, property: string): string | null => {
    const regex = new RegExp(`<meta property="og:${property}" content="(.*?)"`);
    const match = html.match(regex);
    return match ? match[1] : null;
};

export default async (req: Request, context: Context) => {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
        return new Response(JSON.stringify({ error: 'URL parameter is required.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }

    try {
        const response = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch URL with status: ${response.status}`);
        }

        const html = await response.text();

        const title = getOgTag(html, 'title');
        const description = getOgTag(html, 'description');
        const image = getOgTag(html, 'image');

        if (!title && !image) {
             throw new Error('Could not find Open Graph tags.');
        }

        return new Response(JSON.stringify({
            title: title || 'No Title',
            description: description || 'No Description',
            image: image || null,
            url: targetUrl,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });

    } catch (error) {
        console.error('Error fetching link preview:', error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }
};
