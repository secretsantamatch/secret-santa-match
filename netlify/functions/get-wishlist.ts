import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    const url = new URL(req.url);
    const exchangeId = url.searchParams.get('exchangeId');
    const participantId = url.searchParams.get('participantId');

    if (!exchangeId || !participantId) {
        return new Response(JSON.stringify({ error: 'Missing exchangeId or participantId' }), { status: 400 });
    }

    try {
        // FIX: Cast `context` to `any` to resolve a TypeScript error where the `blobs`
        // property was not found on the `Context` type. This is a workaround for
        // a potential type definition mismatch with the Netlify runtime environment.
        const store = (context as any).blobs.getStore('wishlists-v2');
        const key = exchangeId;
        
        // Fetch the single blob for the entire exchange
        const allWishlists: Record<string, any> = await store.get(key, { type: 'json' });

        if (!allWishlists) {
            return new Response(JSON.stringify({ message: 'No wishlists found for this exchange' }), { status: 404 });
        }

        const participantWishlist = allWishlists[participantId];

        if (!participantWishlist) {
            // This is not an error, it just means the participant hasn't saved a wishlist yet.
            // Return a 404 so the client knows to use its default data.
            return new Response(JSON.stringify({ message: 'No wishlist found for this participant' }), { status: 404 });
        }

        return new Response(JSON.stringify(participantWishlist), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error fetching wishlist:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
