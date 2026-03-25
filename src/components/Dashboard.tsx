"use client";

import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, BarChart3, Flame, ExternalLink, Download, ArrowUpRight, Play, Filter, Info, ChevronDown, ThumbsUp, MessageSquare } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { YouTubeVideo } from '@/lib/youtube';

interface DashboardProps {
  initialVideos?: YouTubeVideo[];
}

export default function Dashboard({ initialVideos = [] }: DashboardProps) {
  const [handle, setHandle] = useState('');
  const [videos, setVideos] = useState<YouTubeVideo[]>(initialVideos);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [timeFilter, setTimeFilter] = useState('30D');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('Overview');
  const [activeChart, setActiveChart] = useState<'views' | 'likes' | 'comments' | 'engagementRate' | 'velocity'>('views');
  const [sortOption, setSortOption] = useState('Top Performing');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const sortOptions = ['Top Performing', 'Newest'];

  useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter, videos]);

  const exportPDF = async () => {
    try {
      setIsExporting(true);
      const { toJpeg } = await import('html-to-image');
      
      const jsPDFModule = await import('jspdf');
      const jsPDF = (jsPDFModule.default ? jsPDFModule.default : jsPDFModule.jsPDF) as any;

      const element = document.getElementById('dashboard-content');
      if (!element) return;
      
      const originalBg = element.style.backgroundColor;
      element.style.backgroundColor = '#0f0f0f';
      
      const imgData = await toJpeg(element, { 
        cacheBust: true, 
        backgroundColor: '#0f0f0f',
        pixelRatio: 1.2,
        quality: 0.9,
      });
      
      element.style.backgroundColor = originalBg;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => { img.onload = resolve; });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (img.height * pdfWidth) / img.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      // Force Blob download to prevent Chrome extension-less GUID naming bugs on large payloads
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vidmetrics_report_${handle || 'competitor'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("Failed to export PDF! See console for details.");
    } finally {
      setIsExporting(false);
    }
  };


  const fetchVideos = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!handle) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/videos?handle=${encodeURIComponent(handle)}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setVideos(data);
        setHasSearched(true);
      } else {
        setError(data.error || 'API returned non-array data');
        setVideos([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  console.log('Dashboard videos:', videos);
  const safeVideos = Array.isArray(videos) ? videos : [];

  // 1. Filter videos by time bound
  const filteredVideos = safeVideos.filter(v => {
    const daysSincePublish = (Date.now() - new Date(v.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (timeFilter === '7D') return daysSincePublish <= 7;
    if (timeFilter === '30D') return daysSincePublish <= 30;
    if (timeFilter === '90D') return daysSincePublish <= 90;
    return true;
  });

  const totalViews = filteredVideos.reduce((acc, v) => acc + v.viewCount, 0);
  const totalLikes = filteredVideos.reduce((acc, v) => acc + (v.likeCount || 0), 0);
  const totalComments = filteredVideos.reduce((acc, v) => acc + (v.commentCount || 0), 0);
  const avgEngagement = filteredVideos.length > 0 ? (filteredVideos.reduce((acc, v) => acc + (v.engagementRate || 0), 0) / filteredVideos.length).toFixed(2) : '0';
  const avgVelocity = filteredVideos.length > 0 ? (filteredVideos.reduce((acc, v) => acc + (v.velocity || 0), 0) / filteredVideos.length).toFixed(1) : '0';
  const avgTrendScore = filteredVideos.length > 0 ? (filteredVideos.reduce((acc, v) => acc + (v.trendScore || 0), 0) / filteredVideos.length) : 0;

  // Group by day to prevent duplicate X-axis labels and aggregate metrics
  const dailyData = new Map<string, { views: number, likes: number, comments: number, engagementRate: number, velocity: number, count: number }>();
  
  // Pre-fill the map with empty days based on timeFilter so the chart always spans the full period
  const daysToShow = timeFilter === '7D' ? 7 : timeFilter === '30D' ? 30 : 90;
  for (let i = daysToShow - 1; i >= 0; i--) {
     const d = new Date();
     d.setDate(d.getDate() - i);
     const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
     dailyData.set(dateStr, { views: 0, likes: 0, comments: 0, engagementRate: 0, velocity: 0, count: 0 });
  }

  [...filteredVideos].reverse().forEach(v => {
    const dateStr = new Date(v.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!dailyData.has(dateStr)) return; // Only aggregate if within the padded range
    const existing = dailyData.get(dateStr)!;
    dailyData.set(dateStr, {
      views: existing.views + v.viewCount,
      likes: existing.likes + (v.likeCount || 0),
      comments: existing.comments + (v.commentCount || 0),
      engagementRate: existing.engagementRate + (v.engagementRate || 0),
      velocity: existing.velocity + (v.velocity || 0),
      count: existing.count + 1
    });
  });

  const chartData = Array.from(dailyData.entries()).map(([name, data]) => ({
    name,
    views: data.views,
    likes: data.likes,
    comments: data.comments,
    engagementRate: data.count > 0 ? data.engagementRate / data.count : 0,
    velocity: data.count > 0 ? data.velocity / data.count : 0,
  }));

  // Insights Calculations based on real data
  let bestDayStr = "N/A";
  let avgViewsStr = "0";
  let peakViewsStr = "0";
  
  if (filteredVideos.length > 0) {
    const avgV = totalViews / filteredVideos.length;
    avgViewsStr = (avgV > 1000000) ? (avgV / 1000000).toFixed(1) + 'M' : (avgV > 1000) ? (avgV / 1000).toFixed(1) + 'K' : avgV.toFixed(0);
    
    const peakV = Math.max(...filteredVideos.map(v => v.viewCount));
    peakViewsStr = (peakV > 1000000) ? (peakV / 1000000).toFixed(1) + 'M' : (peakV > 1000) ? (peakV / 1000).toFixed(1) + 'K' : peakV.toString();
    
    // Find the best performing day of the week
    const dayPerformance: Record<number, { views: number, count: number }> = {};
    filteredVideos.forEach(v => {
      const d = new Date(v.publishedAt).getDay();
      if(!dayPerformance[d]) dayPerformance[d] = { views: 0, count: 0 };
      dayPerformance[d].views += v.viewCount;
      dayPerformance[d].count += 1;
    });
    
    let topDay = 0;
    let maxAvgViews = -1;
    Object.entries(dayPerformance).forEach(([dayStr, data]) => {
      const avg = data.views / data.count;
      if (avg > maxAvgViews) {
        maxAvgViews = avg;
        topDay = parseInt(dayStr);
      }
    });
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    bestDayStr = daysOfWeek[topDay] || "N/A";
  }

  // Sorting for Video List
  let sortedVideos = [...filteredVideos];
  if (sortOption === 'Top Performing') {
     sortedVideos.sort((a, b) => b.viewCount - a.viewCount);
  } else if (sortOption === 'Newest') {
     sortedVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }

  // Pagination for Video List
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(sortedVideos.length / ITEMS_PER_PAGE);
  const paginatedVideos = sortedVideos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      {/* Sidebar - Optional for Desktop */}
      
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              VidMetrics <span className="text-primary font-black">AI</span>
            </h1>
            <p className="text-white/40 mt-1">Enterprise Competitor Intelligence</p>
          </div>

          <div className="flex flex-col md:flex-row items-center flex-1 md:ml-12 gap-4 justify-end">
            <form onSubmit={fetchVideos} className="relative group w-full max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Paste channel URL or @handle..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
              />
              {loading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-primary"></div>
                </div>
              )}
            </form>

            <div className="flex items-center gap-3">
              <button onClick={fetchVideos} className="btn-primary whitespace-nowrap">
                Run Analysis
              </button>
              <button 
                onClick={exportPDF}
                disabled={isExporting || videos.length === 0}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all whitespace-nowrap min-w-[140px] justify-center ${
                  isExporting || videos.length === 0 
                  ? 'bg-transparent border-white/5 text-white/30 cursor-not-allowed' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-white cursor-pointer'
                }`}
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-white/60">Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-white/60" />
                    <span className="text-white/60">Export PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 animate-in fade-in slide-in-from-top-4">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Content States */}
        {!hasSearched && !loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in slide-in-from-bottom-8">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-50"></div>
               <BarChart3 className="w-10 h-10 text-white/40" />
            </div>
            <h2 className="text-2xl font-display font-medium mb-3">Please make your search first</h2>
            <p className="text-white/40 max-w-sm">
              Enter a competitor URL or @handle to instantly unlock performance data, velocity metrics, and viral trends.
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center text-primary animate-in fade-in">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-6 shadow-[0_0_15px_rgba(255,0,0,0.5)]"></div>
            <h2 className="text-xl font-display font-medium animate-pulse">Running Analysis...</h2>
            <p className="text-primary/50 mt-2 text-sm">Fetching real-time stats from YouTube</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500" id="dashboard-content">
            {/* Header / Filter Row */}
            <div className="flex flex-col mb-6">
              <h2 className="text-2xl font-display font-semibold mb-3">Dashboard Overview</h2>
              <div className="flex gap-2">
                {['7D', '30D'].map(p => (
                  <button 
                    key={p} 
                    onClick={() => setTimeFilter(p)}
                    className={cn("px-6 py-2.5 rounded-xl text-base font-semibold transition-all w-fit", p === timeFilter ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10")}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
              <StatCard 
                label="Total Views" 
                value={(totalViews > 1000000) ? (totalViews / 1000000).toFixed(1) + 'M' : (totalViews > 1000) ? (totalViews / 1000).toFixed(1) + 'K' : totalViews.toString()} 
                icon={BarChart3} 
                tooltip="Accumulated views across all videos published in this time period."
              />
              <StatCard 
                label="Total Likes" 
                value={(totalLikes > 1000000) ? (totalLikes / 1000000).toFixed(1) + 'M' : (totalLikes > 1000) ? (totalLikes / 1000).toFixed(1) + 'K' : totalLikes.toString()} 
                icon={ThumbsUp} 
                tooltip="Sum of all likes on videos published within this timeframe."
              />
              <StatCard 
                label="Total Comments" 
                value={(totalComments > 1000000) ? (totalComments / 1000000).toFixed(1) + 'M' : (totalComments > 1000) ? (totalComments / 1000).toFixed(1) + 'K' : totalComments.toString()} 
                icon={MessageSquare} 
                tooltip="Sum of all comments on videos published within this timeframe."
              />
              <StatCard 
                label="Engagement Rate" 
                value={avgEngagement + '%'} 
                icon={TrendingUp} 
                tooltip="Average percentage of viewers who actively liked or commented."
              />
              <StatCard 
                label="Avg. Velocity" 
                value={avgVelocity + '/hr'} 
                icon={Flame} 
                primary 
                tooltip="Average views generated per hour since publication. Higher velocity indicates viral potential."
              />
            </div>

        {/* Main Content Area */}
        <div className="space-y-8">
          {/* Chart Area */}
          <div className="glass-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-display font-semibold">Performance Trends</h3>
                <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
                  {['views', 'likes', 'comments', 'engagementRate', 'velocity'].map(metric => (
                    <button 
                      key={metric}
                      onClick={() => setActiveChart(metric as any)}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize", 
                        activeChart === metric ? "bg-white/10 text-white shadow-md shadow-black/20" : "text-white/40 hover:text-white"
                      )}
                    >
                      {metric === 'views' ? 'Views' : metric === 'engagementRate' ? 'Engagement' : metric === 'likes' ? 'Likes' : metric === 'comments' ? 'Comments' : 'Velocity'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff0000" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ff0000" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1C1B1B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}
                      formatter={(value: any) => {
                        const numericValue = Number(value) || 0;
                        if (activeChart === 'engagementRate') return [`${numericValue.toFixed(2)}%`, 'Engagement Rate'];
                        if (activeChart === 'velocity') return [`${numericValue.toFixed(1)}/hr`, 'Velocity'];
                        if (activeChart === 'likes') return [numericValue.toLocaleString(), 'Likes'];
                        if (activeChart === 'comments') return [numericValue.toLocaleString(), 'Comments'];
                        return [numericValue.toLocaleString(), 'Views'];
                      }}
                    />
                    <Area 
                      key={activeChart}
                      type="monotone" 
                      dataKey={activeChart} 
                      stroke="#ff0000" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorMetric)" 
                      animationDuration={500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Video List */}
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-display font-semibold">Performance List</h3>
                <div className="flex items-center gap-4">
                  <div className="relative z-40">
                    <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                      className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors bg-white/5 py-1.5 px-3 rounded-lg border border-white/10"
                    >
                      {sortOption} <ChevronDown className="w-4 h-4" />
                    </button>
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-40 bg-[#1C1B1B] border border-white/10 rounded-xl shadow-xl overflow-hidden py-1">
                        {sortOptions.map(opt => (
                           <button 
                             key={opt} 
                             onClick={() => { setSortOption(opt); setIsDropdownOpen(false); setCurrentPage(1); }} 
                             className={cn("w-full text-left px-4 py-2 text-sm transition-colors", sortOption === opt ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white")}
                           >
                             {opt}
                           </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {paginatedVideos.map((video) => (
                  <VideoRow key={video.id} video={video} avgTrendScore={avgTrendScore} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm text-white/40 bg-white/[0.02]">
                  <span>Page {currentPage} of {totalPages}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-md hover:bg-white/5 disabled:opacity-20 transition-colors"
                    >
                      Previous
                    </button>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-md hover:bg-white/5 disabled:opacity-20 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, primary = false, tooltip }: any) {
  return (
    <div className={cn("glass-card relative group flex flex-col justify-between overflow-visible min-h-[140px]", primary && "border-primary/20 bg-primary/5")}>
      <div className="p-6 relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-2">
          <div className={cn("p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/5", primary ? "text-primary" : "text-white/60")}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="relative group/tooltip flex items-center">
            <Info className="w-5 h-5 text-white/20 cursor-help hover:text-white transition-colors" />
            <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-[#1C1B1B] border border-white/10 text-sm leading-relaxed text-white/80 rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50">
              {tooltip}
            </div>
          </div>
        </div>
        <div className="relative z-20">
          <p className="text-white/40 text-sm font-medium mb-0.5">{label}</p>
          <h4 className="text-3xl font-display font-bold tabular-nums drop-shadow-md">{value}</h4>
        </div>
      </div>
    </div>
  );
}

function VideoRow({ video, avgTrendScore }: { video: YouTubeVideo, avgTrendScore: number }) {
  // Identify outliers: trend score significantly higher than the average
  const isOutlier = (video.trendScore || 0) > avgTrendScore * 1.5 && (video.trendScore || 0) > 0;
  
  return (
    <div className="p-4 hover:bg-white/5 transition-all flex items-center gap-4 group">
      <div className="relative w-32 aspect-video rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-6 h-6 fill-current" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate group-hover:text-primary transition-colors">{video.title}</h4>
        <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
          <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right hidden md:block">
          <div className="flex items-center justify-end gap-1 text-white/20">
            <BarChart3 className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Views</span>
          </div>
          <p className="font-mono text-sm">{video.viewCount.toLocaleString()}</p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="flex items-center justify-end gap-1 text-white/20">
            <TrendingUp className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Engagement</span>
          </div>
          <p className="font-mono text-sm">{(video.engagementRate || 0).toFixed(2)}%</p>
        </div>
        <div className={cn("flex flex-col items-center justify-center w-12 h-12 rounded-full border-2 transition-all relative", isOutlier ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_15px_rgba(255,0,0,0.3)]" : "border-white/5 text-white/20")}>
          <Flame className={cn("w-4 h-4", isOutlier ? "fill-current" : "")} />
          <span className="text-[10px] font-bold">{(video.velocity || 0).toFixed(1)}</span>
          {isOutlier && <div className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span></div>}
        </div>
        <a href={`https://youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/10 rounded-lg text-white/20 hover:text-white transition-all">
          <ArrowUpRight className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}

function InsightItem({ title, value }: any) {
  return (
    <div className="flex justify-between items-baseline text-sm border-b border-white/5 pb-1 last:border-0 last:pb-0">
      <span className="text-white/50">{title}</span>
      <span className="font-bold text-white tabular-nums drop-shadow-md">{value}</span>
    </div>
  );
}
