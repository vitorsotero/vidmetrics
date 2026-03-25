import { NextResponse } from 'next/server';
import { getChannelVideos } from '@/lib/youtube';
import { MOCK_VIDEOS } from '@/lib/mock-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get('handle');

  if (!handle) {
    return NextResponse.json({ error: 'Handle is required' }, { status: 400 });
  }

  try {
    const videos = await getChannelVideos(handle);
    return NextResponse.json(videos);
  } catch (error: any) {
    console.error('API Route Error:', error.message);
    if (error.message === 'MISSING_API_KEY') {
      return NextResponse.json(MOCK_VIDEOS);
    }
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message || 'Operation failed';
    return NextResponse.json({ error: message }, { status });
  }
}
