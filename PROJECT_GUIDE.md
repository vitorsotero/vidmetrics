# 🚀 VidMetrics: Competitor Analysis MVP

## 1. Executive Summary
This project is a high-fidelity MVP built for VidMetrics to help enterprise media companies analyze competitor YouTube performance instantly. Moving from a "napkin sketch" to a demo-ready product, this tool allows users to paste a channel URL and immediately identify which videos are "crushing it".

## 2. Build Breakdown
Focusing on an AI-assisted workflow for rapid development.

### Tools & Frameworks
- **Frontend**: Next.js (React) + Tailwind CSS for a modern, responsive "SaaS" feel.
- **AI/Scripting**: Antigravity (Primary tool for rapid component scaffolding and complex API data transformation scripts).
- **Backend/Data**: YouTube Data API v3.
- **Deployment**: Vercel (Public URL).
- **Version Control**: GitHub.

### Selected MCP Servers & Skills
- **MCP: StitchMCP**: Used for automated scaffolding of the dashboard structure and Tailwind layouts (reducing design time by 80%).
- **MCP: supabase-mcp-server**: While bypassed for the MVP to keep it lean, it will be integrated in V2.0 for historical tracking.
- **Skill: Remotion Video Architect**: Used to generate programmatic walkthrough videos for the final demo.

### The "Vibe Coder" Workflow
- **Automated Scaffolding**: Utilizing Antigravity + StitchMCP for rapid component generation.
- **Accelerated Logic**: Leveraging AI to script efficient data parsers for YouTube's nested JSON responses.
- **Simplified Backend**: Utilizing Vercel Serverless Functions for immediate, lean data retrieval.

## 3. Core Feature Set
- **Channel Input**: Clean search bar accepting full YouTube URLs or @handles.
- **Performance List**: Dynamic list of videos with key metrics (Views, Likes, Comments).
- **Sorting & Filtering**: Instant filtering by "Top Performing This Month" to find viral content.
- **Responsive Design**: Fully mobile-optimized layout using Tailwind.

### Bonus Features ("Beyond the Brief")
- **Visual Charts**: Integrated Recharts to visualize view-count trends over the last 30 days.
- **Trending Indicator**: A "🔥 Velocity" score for videos exceeding the channel's average engagement rate.
- **CSV Export**: Quick export of competitor data for agency reporting.

## 4. Product Thinking & Version 2.0
### What’s Missing?
The current version excels at data retrieval. However, a true enterprise tool needs historical tracking. Currently, we only see a snapshot; we don't see the "climb" of a video over time unless we search repeatedly.

### Version 2.0 Opportunities
- **AI-Generated Summaries**: Use an LLM to analyze titles/descriptions of top videos for content strategy insights.
- **Competitor Benchmarking**: Side-by-side comparison of user channel metrics vs. competitors.
- **Automatic Alerts**: Slack/Webhook-based system for performance spikes (e.g., 10k views in 1 hour).
