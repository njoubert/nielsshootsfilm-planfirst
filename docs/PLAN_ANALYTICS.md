# Analytics Tracking (Advanced Feature)

- Fire-and-forget analytics tracking
- Album/photo view counts
- Download tracking
- Analytics data is read from SQLite database (Phase 2.2)


### 3.8 TypeScript Utilities
- [ ] JSON data fetching utilities with type safety
- [ ] Type definitions for all JSON schemas (Album, Photo, BlogPost, SiteConfig)
- [ ] Client-side routing (History API or simple hash routing)
- [ ] Session storage utilities for password verification
- [ ] URL query parameter handling
- [ ] Date formatting utilities
- [ ] Image URL helpers (thumbnails, display, original)
- [ ] Download utilities (downloadPhoto, downloadAlbum)
- [ ] **Analytics tracking utility** (fire-and-forget, graceful degradation)
- [ ] bcrypt.js for client-side password verification


#### Analytics Tracking (Public, No Auth Required)
**Public endpoints** - accessible from static site, no authentication:
- `POST /api/analytics/album-view` - Track album view
- `POST /api/analytics/photo-view` - Track photo view in lightbox
- `POST /api/analytics/photo-download` - Track photo download
- `POST /api/analytics/album-download` - Track album download
- `POST /api/analytics/page-view` - Track general page view



**Request format** (all endpoints):
```json
{
  "event": "album-view",
  "data": {
    "album_id": "uuid",
    "album_slug": "wedding-2024"
  },
  "timestamp": "ISO8601",
  "referrer": "...",
  "user_agent": "..."
}
```

**Response**: `202 Accepted` (fire and forget, no response body needed)




**Admin analytics endpoints** (auth required):
- `GET /api/admin/analytics/overview` - Dashboard overview stats
  - Total views, downloads, unique visitors (last 7/30/90 days)
- `GET /api/admin/analytics/albums` - Album-specific stats
  - Views and downloads per album, sortable
  - Query params: `?days=30&sort=views&order=desc`
- `GET /api/admin/analytics/photos` - Photo-specific stats
  - Most viewed/downloaded photos
  - Query params: `?album_id=uuid&days=30`
- `GET /api/admin/analytics/referrers` - Top referrers
- `GET /api/admin/analytics/timeline` - Time-series data for charts
  - Daily/weekly/monthly aggregates
  - Query params: `?period=daily&days=30`



## Dashboard UI Updates
    - **Analytics summary** (last 7 days):
    - Total page views
    - Total album views
    - Total downloads
    - Trending albums (most viewed)
      - View full analytics
    - [ ] Charts/visualizations
    - Views over time (sparkline/mini chart)
    - Top 5 albums by views



#### Analytics Page

**Purpose**: View detailed analytics about site usage, album performance, and photo downloads.

**Route**: `/admin/analytics`

**Layout**:
```
┌────────────────────────────────────────────┐
│ Analytics                                  │
├────────────────────────────────────────────┤
│ Time Period: [Last 7 days ▼]              │
├─────────────┬─────────────┬────────────────┤
│ Total Views │ Total       │ Unique         │
│    12,345   │ Downloads   │ Visitors       │
│             │    1,234    │    3,456       │
└─────────────┴─────────────┴────────────────┘

Album Performance
┌─────────────────────────────────────────────┐
│ Album Name      │ Views │ Downloads │ Rate  │
├─────────────────┼───────┼───────────┼───────┤
│ Portfolio       │ 8,234 │    456    │ 5.5%  │
│ Wedding 2024    │ 1,205 │    234    │ 19.4% │
│ Landscapes      │   876 │     45    │ 5.1%  │
└─────────────────┴───────┴───────────┴───────┘

Photo Performance (Top 10)
┌─────────────────────────────────────────────┐
│ [Thumbnail] Album       │ Views │ Downloads │
├────────────────────────┼───────┼───────────┤
│ [IMG] Portfolio         │ 1,234 │    123    │
│ [IMG] Wedding 2024      │   987 │     89    │
└────────────────────────┴───────┴───────────┘

Referrer Sources
┌─────────────────────────────────────────────┐
│ Source              │ Views │ Percentage    │
├─────────────────────┼───────┼───────────────┤
│ Direct              │ 5,678 │    46%        │
│ google.com          │ 3,456 │    28%        │
│ instagram.com       │ 1,234 │    10%        │
└─────────────────────┴───────┴───────────────┘

Timeline Chart
┌─────────────────────────────────────────────┐
│     │                                        │
│ 500 │     ╱╲                                │
│ 400 │    ╱  ╲      ╱╲                       │
│ 300 │   ╱    ╲    ╱  ╲                      │
│ 200 │  ╱      ╲  ╱    ╲    ╱╲               │
│ 100 │╱         ╲╱      ╲  ╱  ╲              │
│   0 └───────────────────────────────────────│
│     Mon  Tue  Wed  Thu  Fri  Sat  Sun       │
└─────────────────────────────────────────────┘

[Export CSV] [Export JSON]
```

**Features**:
- [ ] Time period selector (last 7 days, 30 days, 90 days, all time)
- [ ] Overview stats cards
  - Total views across all content
  - Total downloads
  - Unique visitors (based on IP hash)
- [ ] Album performance table
  - Sortable by views, downloads, download rate
  - Shows public vs private albums
  - Click to see individual photo stats
- [ ] Top performing photos
  - Thumbnail preview
  - Views and download counts
  - Link to edit photo
- [ ] Referrer statistics
  - Top traffic sources
  - Percentage breakdown
  - Link to view details
- [ ] Timeline visualization
  - Line chart showing views/downloads over time
  - Toggle between daily and cumulative views
  - Responsive chart using Chart.js or D3.js
- [ ] Export functionality
  - Export to CSV for spreadsheet analysis
  - Export to JSON for custom processing
- [ ] Real-time updates
  - Auto-refresh every 30 seconds (optional)
  - Manual refresh button