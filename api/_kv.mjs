// Vercel build has no persistent store configured: caching relies on the CDN. (Netlify build uses Netlify Blobs.)
export const getStore = () => ({ get: async () => null, setJSON: async () => {}, delete: async () => {} });
