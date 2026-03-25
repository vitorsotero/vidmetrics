# VidMetrics AI

Enterprise-grade YouTube Competitor Intelligence dashboard. Track, analyze, and export channel performance with a focus on historical tracking, engagement ratios, and viral velocity detection.

![VidMetrics Dashboard](vidmetrics-dashboard.png)

## Features

- **Cinematic Analytics**: Polished Next.js frontend with dark mode glassmorphism UI.
- **Deep Historical Fetch**: Uses YouTube's Upload Playlist endpoints to track up to 250 recent videos spanning previous months.
- **Granular Engagement Metrics**: Calculates View Velocity (views/hr), Engagement Rate, and algorithm Trend Scores.
- **Native PDF Export**: Client-side document generation matching the exact pixel layout of the browser using `html-to-image` and `jsPDF`.
- **Zero Client-Side Leaks**: Secure API architecture routes all YouTube Data API v3 calls securely through Next.js server actions.

## Local Setup

### 1. Requirements
- Node.js 18+
- A YouTube Data API v3 Key (from Google Cloud Console)

### 2. Environment Variables
Create a `.env.local` file in the root of the project:

```env
# Required: Your YouTube Data API v3 Key
YOUTUBE_API_KEY=your_api_key_here
```
*(Note: Because the key is NOT prefixed with `NEXT_PUBLIC_`, Next.js completely scrubs it from the client-side bundle, maximizing privacy and security.)*

### 3. Installation

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 4. Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack
- Next.js 15 (App Router)
- React 19
- Tailwind CSS 4
- Recharts
- Axios
- jsPDF & html-to-image
