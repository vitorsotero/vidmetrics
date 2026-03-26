import { YouTubeVideo } from './youtube';

const mockBase = [
  {
    id: '1',
    title: 'How I Built a SaaS in 4 Days (Full Blueprint)',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80',
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    viewCount: 125430,
    likeCount: 8400,
    commentCount: 450,
    velocity: 1.8,
  },
  {
    id: '2',
    title: 'Stop Using Traditional Databases for MVPs',
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&w=800&q=80',
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    viewCount: 89000,
    likeCount: 5200,
    commentCount: 210,
    velocity: 0.9,
  },
  {
    id: '3',
    title: 'The "Vibe Coder" Revolution: AI is Eating Software',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    viewCount: 245000,
    likeCount: 15600,
    commentCount: 1200,
    velocity: 2.4,
  },
  {
    id: '4',
    title: 'VidMetrics: The Future of Media Competitor Analysis',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    viewCount: 45600,
    likeCount: 2100,
    commentCount: 150,
    velocity: 0.5,
  },
  {
    id: '5',
    title: 'Enterprise YouTube Performance at Scale',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bbbda536339a?auto=format&fit=crop&w=800&q=80',
    publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    viewCount: 15000,
    likeCount: 800,
    commentCount: 45,
    velocity: 0.1,
  }
];

export const MOCK_VIDEOS: YouTubeVideo[] = mockBase.map(v => {
  const engagementRate = v.viewCount > 0 ? ((v.likeCount + v.commentCount) / v.viewCount) * 100 : 0;
  const trendScore = (v.viewCount * 0.5) + (v.velocity * 0.3) + (engagementRate * 1000 * 0.2);
  return { ...v, engagementRate, trendScore };
});
