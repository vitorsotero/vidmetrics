import axios from 'axios';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  velocity?: number; 
  engagementRate?: number;
  trendScore?: number;
}

export async function getChannelVideos(handleOrUrl: string): Promise<YouTubeVideo[]> {
  console.log('getChannelVideos started for:', handleOrUrl);

  if (!YOUTUBE_API_KEY) {
    console.warn('YOUTUBE_API_KEY not found, using mock data');
    throw new Error('MISSING_API_KEY');
  }

  // 1. Resolve handle/@username or URL to Channel ID
  // For simplicity in MVP, we'll assume a direct ID or handle lookup
  // This is a simplified version for the guide
  
  try {
    let channelId = '';
    
    // Normalize query
    let query = handleOrUrl.trim();
    if (!query.startsWith('@') && !query.includes('http') && !query.includes(' ')) {
      query = '@' + query; // Assume simple text without spaces is a handle
    }
    
    if (query.startsWith('@')) {
      // Use channels endpoint for better handle support
      const channelRes = await axios.get(`${BASE_URL}/channels`, {
        params: {
          part: 'id,contentDetails',
          forHandle: query,
          key: YOUTUBE_API_KEY,
        },
      });
      channelId = channelRes.data.items?.[0]?.id;
      var uploadsPlaylistId = channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    }

    if (!channelId) {
      // Fallback search
      const searchRes = await axios.get(`${BASE_URL}/search`, {
        params: {
          part: 'snippet',
          q: handleOrUrl, // use original input for broad search
          type: 'channel',
          key: YOUTUBE_API_KEY,
          maxResults: 1,
        },
      });
      channelId = searchRes.data.items?.[0]?.id.channelId;
      // We also need the uploads playlist if we hit the fallback. Let's fetch it explicitly.
      const fallbackChannelRes = await axios.get(`${BASE_URL}/channels`, {
        params: {
          part: 'contentDetails',
          id: channelId,
          key: YOUTUBE_API_KEY,
        },
      });
      uploadsPlaylistId = fallbackChannelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    }

    if (!channelId || !uploadsPlaylistId) throw new Error('CHANNEL_NOT_FOUND');

    // 2. Get videos from channel's uploads playlist (fetch up to 5 pages / 250 videos to ensure we hit 30 days)
    let allVideoIds: string[] = [];
    let pageToken: string | undefined = undefined;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    let keepFetching = true;
    let pagesFetched = 0;

    while (keepFetching && pagesFetched < 5) {
      const pageRes: any = await axios.get(`${BASE_URL}/playlistItems`, {
        params: {
          part: 'snippet',
          playlistId: uploadsPlaylistId,
          key: YOUTUBE_API_KEY,
          maxResults: 50,
          pageToken: pageToken || undefined,
        },
      });

      const items = pageRes.data.items || [];
      if (items.length === 0) break;
      
      items.forEach((item: any) => allVideoIds.push(item.snippet.resourceId.videoId));
      
      const lastVideoDate = new Date(items[items.length - 1].snippet.publishedAt);
      if (lastVideoDate < thirtyDaysAgo) {
        keepFetching = false;
      }
      
      pageToken = pageRes.data.nextPageToken;
      if (!pageToken) keepFetching = false;
      pagesFetched++;
    }

    if (allVideoIds.length === 0) return [];

    // 3. Get detailed stats for these videos in chunks of 50
    const chunkArray = (arr: string[], size: number) =>
      Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
      );

    const idChunks = chunkArray(allVideoIds, 50);
    const allStats: any[] = [];

    for (const chunk of idChunks) {
      const statsRes = await axios.get(`${BASE_URL}/videos`, {
        params: {
          part: 'statistics,snippet',
          id: chunk.join(','),
          key: YOUTUBE_API_KEY,
        },
      });
      allStats.push(...(statsRes.data.items || []));
    }

    return allStats.map((item: any) => {
      const viewCount = parseInt(item.statistics.viewCount || '0');
      const likeCount = parseInt(item.statistics.likeCount || '0');
      const commentCount = parseInt(item.statistics.commentCount || '0');
      
      const publishedAt = item.snippet.publishedAt;
      const hoursSincePublish = Math.max((Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60), 1);
      
      const velocity = viewCount / hoursSincePublish;
      const engagementRate = viewCount > 0 ? ((likeCount + commentCount) / viewCount) * 100 : 0;
      
      // Normalized Trend Score: (views * 0.5) + (velocity * 0.3) + (engagement_rate * scale * 0.2)
      // We scale engagement rate up to make it impactful against raw view numbers.
      const trendScore = (viewCount * 0.5) + (velocity * 0.3) + (engagementRate * 1000 * 0.2);

      return {
        id: item.id,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high.url,
        publishedAt,
        viewCount,
        likeCount,
        commentCount,
        velocity,
        engagementRate,
        trendScore,
      };
    });
  } catch (error: any) {
    if (error.response) {
      console.error('YouTube API Response Error:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('YouTube API Error Detail:', error.message);
    throw error;
  }
}
