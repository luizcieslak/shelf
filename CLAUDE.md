# 🎵 Shelf - Music Playlist Transfer Platform

## Project Overview

**Shelf** is a web application that enables seamless playlist transfers between music streaming platforms. Currently supporting **Spotify → YouTube** transfers, it allows users to maintain their music collections across different services with ease.

## 🎯 Core Features

### MVP Implementation
- **Spotify Authentication**: OAuth2 integration via PocketBase
- **YouTube Authentication**: Google OAuth2 for YouTube API access
- **Playlist Management**: View, browse, and interact with Spotify playlists
- **Cross-Platform Transfer**: One-click playlist transfer from Spotify to YouTube
- **Real-time Progress**: Live transfer status with detailed progress indicators
- **Track Addition**: Search and add individual tracks to existing playlists
- **Sync Management**: Link playlists across platforms for ongoing synchronization
- **Playlist Export**: Export playlists as JSON files with comprehensive metadata for offline use
- **Drag-and-Drop Reordering**: Intuitive track reordering with visual feedback and cross-platform sync

### User Experience
- **Responsive Design**: Mobile-first approach with max-width constraints
- **Clean UI**: Modern interface using Tailwind CSS
- **Intuitive Navigation**: Clear platform indicators and connection status
- **Progressive Enhancement**: Works seamlessly across devices

## 🏗️ Architecture & Technology Stack

### Frontend Framework
- **React 19** with TypeScript
- **Vite** for build tooling and development server
- **React Router** for client-side routing

### State Management - MobX
```typescript
// Observable stores with reactive UI updates
const { authStore, syncStore } = useStores()

// Computed values automatically update UI
get connectedPlatforms(): Platform[] {
  const connected: Platform[] = []
  if (this.spotify) connected.push('spotify')
  if (this.google) connected.push('google')
  return connected
}
```

**Why MobX?**
- **Reactive**: UI automatically updates when observable data changes
- **Simple**: Less boilerplate compared to Redux
- **Performant**: Fine-grained reactivity prevents unnecessary re-renders
- **TypeScript-friendly**: Excellent type inference and safety

### Backend - PocketBase
```typescript
// OAuth2 authentication
const authData = await pb.collection('users').authWithOAuth2({
  provider: 'spotify',
  scopes: ['playlist-read-private', 'playlist-modify-private']
})
```

**PocketBase Benefits:**
- **Zero-config authentication**: Built-in OAuth2 providers
- **Real-time subscriptions**: Live data updates
- **Built-in admin UI**: Easy data management
- **File storage**: Handles uploads and assets
- **REST + Realtime**: Both HTTP API and WebSocket support

### UI Components - Radix UI
- **Dropdown Menus**: Context actions for playlists
- **Dialog Modals**: Track search and addition interface
- **Accessible**: WCAG compliant components
- **Unstyled**: Full control over appearance with Tailwind

### API Integrations
- **Spotify Web API**: Playlist and track management
- **YouTube Data API v3**: Playlist creation and video management
- **OAuth2 Flow**: Secure token-based authentication

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── PlaylistList.tsx    # Main playlist display with transfer
│   ├── AddTracksDialog.tsx # Search and add tracks modal
│   └── LoginScreen.tsx     # Platform authentication
├── stores/              # MobX state management
│   ├── AuthStore.ts        # Authentication state
│   ├── SyncStore.ts        # In-memory playlist sync (for reordering)
│   ├── PlaylistStore.ts    # Database persistence layer
│   └── StoreContext.tsx    # React context provider
├── services/            # External API clients
│   ├── spotify.ts          # Spotify Web API client
│   └── youtube.ts          # YouTube Data API client
├── types/               # TypeScript definitions
│   ├── spotify.ts          # Spotify API types
│   ├── youtube.ts          # YouTube API types
│   ├── platform.ts         # Platform enums
│   ├── pocketbase.ts       # PocketBase collection types
│   └── export.ts           # Playlist export format types
├── utils/               # Utility functions
│   └── exportPlaylist.ts   # JSON export utilities
└── pages/               # Route components
    ├── Login.tsx
    ├── Playlists.tsx
    └── Search.tsx

pocketbase/              # Backend database
├── pb_migrations/          # Auto-generated schema migrations
│   ├── 1773957982_created_playlists.js
│   ├── 1773958091_updated_playlists.js
│   └── 1773958138_updated_playlists.js
├── pb_data/                # Runtime data (gitignored)
│   ├── data.db             # SQLite database
│   └── storage/            # File uploads
├── pocketbase              # Binary executable (gitignored)
└── README.md               # Setup instructions
```

## 🔐 Authentication Flow

### Multi-Platform OAuth2
1. **Initial Login**: User connects to Spotify via PocketBase OAuth2
2. **Transfer Trigger**: When transferring, prompts for YouTube authentication
3. **Token Management**: PocketBase handles token refresh and storage
4. **Scope Management**: Platform-specific permissions

```typescript
// Dynamic authentication based on user action
const transferToYouTube = async (playlist) => {
  if (!authStore.google?.accessToken) {
    await authStore.connectGoogle() // Triggers OAuth2 flow
  }
  // Proceed with transfer...
}
```

### Token Expiry Handling

**Problem**: OAuth2 access tokens expire after ~1 hour, causing API calls to fail with 401 errors. Without proper handling, users would see cryptic errors and wouldn't know to re-authenticate.

**Solution**: Automatic token expiry detection and platform disconnection with user notification.

#### Architecture

**1. Custom Error Class** ([src/utils/apiErrors.ts](src/utils/apiErrors.ts)):
```typescript
export class TokenExpiredError extends Error {
  constructor(
    public platform: 'spotify' | 'google',
    message = 'Access token has expired',
  ) {
    super(message)
    this.name = 'TokenExpiredError'
  }
}
```

**2. Service-Level Detection** (in each platform service):
- **SpotifyService**: All API methods check for 401 status codes
- **YouTubeService**: Enhanced error handler checks 401 before quota detection
- Throws `TokenExpiredError` when token is expired

```typescript
// Example from SpotifyService
async function handleSpotifyError(response: Response): Promise<never> {
  if (response.status === 401) {
    const errorData = await response.json().catch(() => ({}))
    const message = errorData.error?.message || 'The access token expired'
    throw new TokenExpiredError('spotify', message)
  }
  throw new Error(`Spotify API error: ${response.status}`)
}
```

**3. AuthStore Handler** ([src/stores/AuthStore.ts](src/stores/AuthStore.ts)):
```typescript
handleTokenExpiry(platform: Platform, message: string) {
  console.log(`Token expired for ${platform}:`, message)

  // Disconnect the platform (triggers localStorage cleanup via MobX reaction)
  this.disconnectPlatform(platform)

  // UI automatically updates since we're using MobX observers
  // Components check authStore.connectedPlatforms to show re-auth prompt
}
```

**4. Component-Level Handling**:
All components that make API calls catch `TokenExpiredError`:

```typescript
try {
  const spotifyService = new SpotifyService(accessToken)
  const response = await spotifyService.getCurrentUserPlaylists()
  setPlaylists(response.items)
} catch (err) {
  // Handle token expiry
  if (err instanceof TokenExpiredError) {
    authStore.handleTokenExpiry(err.platform, err.message)
    return // Don't set error, auth system handles it
  }

  setError('Failed to load playlists')
}
```

#### User Experience Flow

1. **Token Expires**: User has been using the app for >1 hour
2. **API Call Fails**: Next Spotify/YouTube API call returns 401
3. **Service Detects**: Service throws `TokenExpiredError`
4. **Component Catches**: Component catches error and calls `authStore.handleTokenExpiry()`
5. **Platform Disconnected**: AuthStore sets platform to `null`, triggering localStorage cleanup
6. **UI Updates**: MobX observer re-renders, showing connection buttons again
7. **User Re-authenticates**: User clicks "Connect Spotify/YouTube" to re-authenticate
8. **Session Restored**: User continues where they left off

#### Benefits

- ✅ **No manual token refresh logic** - simpler than implementing refresh token flow
- ✅ **Consistent across platforms** - works for Spotify, YouTube, and future platforms
- ✅ **Clear user feedback** - users see connection status and re-auth buttons
- ✅ **Graceful degradation** - app doesn't crash, just requires re-connection
- ✅ **Automatic cleanup** - localStorage and MobX state cleared automatically
- ✅ **No stale tokens** - expired tokens never used for API calls

#### Implementation Notes

- **Service-scoped**: Each platform service handles its own error format
- **Type-safe**: TypeScript ensures `TokenExpiredError.platform` matches the service
- **Observable**: MobX ensures UI updates immediately when platform disconnects
- **Persistent**: Disconnection triggers localStorage cleanup via MobX reactions
- **Scalable**: Easy to add new platforms - just throw `TokenExpiredError` on 401

## 🎵 Playlist Transfer Process

### Step-by-Step Transfer
1. **Playlist Creation**: Create new YouTube playlist with same name/description
2. **Track Resolution**: Search YouTube for each Spotify track
3. **Batch Addition**: Add found tracks to YouTube playlist
4. **Progress Tracking**: Real-time status updates with success/failure counts
5. **Result Summary**: Final report showing successful transfers vs failures

### Smart Track Matching
```typescript
// Search YouTube for Spotify track
const searchQuery = `${track.name} ${track.artists.map(a => a.name).join(' ')}`
const youtubeResults = await youtubeService.searchTracks(searchQuery, 1)
```

### Error Handling
- **Graceful Degradation**: Continue transfer even if some tracks fail
- **Status Indicators**: Clear visual feedback (success/warning/error)
- **Detailed Reporting**: Show exact success/failure counts

## 🔄 Synchronization & Persistence

### Sync Persistence Strategy (Hybrid Approach)

Shelf uses a **minimal database approach** - only synced playlists are saved to the database:

**On Page Load:**
- Fetch playlists from Spotify API (fresh data)
- Fetch synced playlists from database (to show sync status)
- Match and display sync icons (🔗) for linked playlists

**When Transferring to YouTube:**
- Create YouTube playlist
- Transfer all tracks
- **Automatically save both playlists to database**
- **Link them together** (`synced_with` bidirectional array)
- Update `last_synced` timestamp
- Show sync icon immediately

**Benefits:**
- ✅ Sync relationships persist across sessions
- ✅ No duplicate YouTube playlists created
- ✅ Minimal database usage (only synced playlists)
- ✅ Fast page loads (1 DB query vs 10+)
- ✅ Clear UI feedback with persistent sync icons

### Database Schema

```typescript
interface PlaylistRecord {
  platform: 'spotify' | 'google' | 'apple'
  platform_id: string        // Original playlist ID from platform
  name: string
  description: string
  image_url: string
  track_count: number
  external_url: string
  synced_with: string[]      // Array of linked PocketBase record IDs
  last_synced?: string       // ISO datetime
  user: string               // Relation to users collection
}
```

**Example after syncing:**
```json
// Spotify record
{
  "id": "pb_rec_123",
  "platform": "spotify",
  "platform_id": "37i9dQZF1DX...",
  "synced_with": ["pb_rec_456"],
  "last_synced": "2026-03-19T20:00:00Z"
}

// YouTube record (linked)
{
  "id": "pb_rec_456",
  "platform": "google",
  "platform_id": "PLrAXtmErZ...",
  "synced_with": ["pb_rec_123"],
  "last_synced": "2026-03-19T20:00:00Z"
}
```

### Sync Management Stores

**PlaylistStore** (Database persistence):
```typescript
class PlaylistStore {
  saveSpotifyPlaylists(playlists: SpotifyPlaylist[]): Promise<void>
  saveYouTubePlaylist(playlist: YouTubePlaylist): Promise<PlaylistRecord>
  linkPlaylists(id1: string, id2: string): Promise<void>
  fetchPlaylists(platform?: Platform): Promise<PlaylistRecord[]>
  isSynced(playlistId: string): boolean
  getSyncedPlaylists(playlistId: string): PlaylistRecord[]
}
```

**SyncStore** (In-memory for track reordering):
```typescript
class SyncStore {
  linkPlaylists(spotifyId: string, youtubeId: string, youtubeUrl: string)
  addYouTubeTrackMapping(spotifyPlaylistId, spotifyTrackId, youtubePlaylistItemId, youtubeVideoId)
  getYouTubeTrackMapping(spotifyPlaylistId, spotifyTrackId): YouTubeTrackMapping
}
```

### User Flow Example

1. **First Visit**: User transfers "Today's Top Hits" to YouTube
   - YouTube playlist created
   - Both playlists saved to DB with bidirectional link
   - Sync icon (🔗) appears

2. **Next Visit** (reload page):
   - Playlists loaded from Spotify API
   - Synced playlists loaded from DB
   - Sync icon persists (shows "Today's Top Hits" is linked)
   - If user clicks "Transfer to YouTube" again, creates NEW YouTube playlist
   - Original sync link remains intact

## 📦 Playlist Export System

### Export Format
Playlists can be exported as JSON files with comprehensive metadata for offline music matching and archival purposes.

```typescript
interface ExportedPlaylist {
  playlist: {
    name: string
    description?: string
    platform: 'spotify' | 'youtube' | 'apple'
    exportedAt: string  // ISO 8601 timestamp
    trackCount: number
    playlistId: string
    externalUrl?: string
  }
  tracks: Array<{
    name: string
    artists: string[]
    album: string
    duration_ms: number
    isrc?: string  // International Standard Recording Code
    spotify_id?: string
    youtube_id?: string
    external_urls?: { spotify?: string; youtube?: string }
    release_date?: string
    track_number?: number
    disc_number?: number
  }>
}
```

### Export Features
- **JSON Format**: Structured, parseable format for programmatic use
- **Rich Metadata**: Track names, artists, albums, durations, platform IDs
- **ISRC Support**: Ready for International Standard Recording Code matching
- **Offline Matching**: Export format designed for linking to local music files
- **Timestamped Downloads**: Files named `{playlist-name}-{date}.json`

### Usage
```typescript
import { downloadPlaylistAsJson } from './utils/exportPlaylist'
import type { ExportedPlaylist } from './types/export'

// Export a playlist
downloadPlaylistAsJson(playlist, tracks)

// Parse exported JSON for offline matching
const data: ExportedPlaylist = JSON.parse(jsonString)
data.tracks.forEach(track => {
  // Match with local files using ISRC, artist+title, etc.
})
```

## 🎨 Design System

### Visual Hierarchy
- **Platform Colors**: Spotify (Green), YouTube (Red), Apple (Black)
- **Status Colors**: Success (Green), Warning (Yellow), Error (Red)
- **Consistent Spacing**: Tailwind spacing scale for uniformity

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Max-Width Constraints**: Content containers limited to 600px for readability
- **Flexible Layouts**: Adapts to different screen sizes

### Component Patterns
- **Loading States**: Spinners and skeleton screens
- **Empty States**: Helpful messages when no data
- **Error States**: Clear error messages with recovery options

## 🚀 Development Workflow

### Commands
```bash
# Development
pnpm dev                 # Start development server
pnpm build              # Production build
pnpm lint               # Code linting
pnpm format             # Code formatting
pnpm check              # Full code quality check
```

### Code Quality
- **TypeScript**: Full type safety across the application
- **Biome**: Modern linting and formatting
- **MobX Strict Mode**: Prevents state mutations outside actions

## 🔧 Configuration

### Environment Variables
```env
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

### OAuth2 Scopes
**Spotify:**
- `playlist-read-private`: Read user playlists
- `playlist-modify-private`: Modify private playlists
- `playlist-modify-public`: Modify public playlists
- `user-read-email`: User profile access

**Google/YouTube:**
- `https://www.googleapis.com/auth/youtube`: Full YouTube access
- `https://www.googleapis.com/auth/youtube.readonly`: Read-only access
- Profile and email scopes for user identification

## 🎯 Future Roadmap

### Platform Expansion
- **Apple Music**: Integration with Apple's MusicKit
- **Amazon Music**: Amazon Music API support
- **Tidal**: High-quality music platform support

### Advanced Features
- **Batch Transfers**: Multiple playlist transfers
- **Scheduled Sync**: Automatic periodic synchronization
- **Playlist Merging**: Combine playlists from different platforms
- **Music Discovery**: Cross-platform recommendation engine
- **Offline Music Matching**: Parse exported playlists and link to local music files

### Performance Optimizations
- **Track Caching**: Reduce API calls for repeated searches
- **Parallel Processing**: Concurrent track additions
- **Progressive Loading**: Load playlists on demand

## 📊 Technical Decisions

### Why These Technologies?

**React + TypeScript**: Industry standard with excellent tooling and type safety

**MobX over Redux**: Simpler state management for this use case, less boilerplate

**PocketBase over Firebase**: Self-hosted option, built-in OAuth2, simpler pricing

**Radix UI over Headless UI**: Better accessibility, more components

**Vite over Create React App**: Faster builds, modern tooling

**Tailwind over Styled Components**: Utility-first approach, smaller bundle

## 🐛 Common Issues & Solutions

### Authentication Problems
- **Token Expiry**: PocketBase handles refresh tokens automatically
- **Scope Issues**: Ensure all required scopes are requested
- **Popup Blockers**: OAuth2 popups may be blocked by browsers

### Transfer Failures
- **Track Not Found**: Different track availability across platforms
- **Rate Limiting**: APIs have request limits, implement backoff
- **Network Issues**: Handle connection failures gracefully

### Performance Considerations
- **Large Playlists**: Progress indicators for long-running operations
- **Memory Usage**: Efficient data structures for playlist data
- **Bundle Size**: Code splitting for large dependencies

## 🎯 Drag-and-Drop Track Reordering

### Overview
Implemented a professional-grade drag-and-drop system for reordering tracks within playlists, with full cross-platform synchronization support.

### Implementation Details

**Library**: [@dnd-kit](https://dndkit.com/)
- Modern, accessible drag-and-drop toolkit
- Touch-friendly and keyboard accessible
- Lightweight and performant

**Dependencies**:
```json
{
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^10.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "@dnd-kit/modifiers": "^9.0.0"
}
```

### Key Features

#### 1. Visual Feedback System
- **Floating Drag Overlay**: Card follows cursor using `snapCenterToCursor` modifier
- **Visual Placeholder**: Dashed border box with faded content stays at original position
- **Drop Indicators**: Blue pulsing line with dots shows exact insertion point
- **Cursor States**: Changes from `grab` to `grabbing` during drag

#### 2. Smart Collision Detection
Custom Y-coordinate based algorithm for vertical lists:

```typescript
const customCollisionDetection: CollisionDetection = (args) => {
  const { droppableContainers, pointerCoordinates } = args

  // Calculate distance from cursor Y to each track's center Y
  const collisions = Array.from(droppableContainers.values())
    .map(container => {
      const centerY = rect.top + rect.height / 2
      const distance = Math.abs(pointerY - centerY)
      return { id: container.id, distance }
    })
    .sort((a, b) => a.distance - b.distance)

  return [{ id: collisions[0].id }]
}
```

**Why Custom Collision Detection?**
- Generic algorithms (closestCenter, closestCorners) gave inconsistent results
- Y-coordinate based detection ensures drop indicator matches cursor position
- No jumping or unexpected placements

#### 3. Platform-Agnostic Architecture

**Spotify Reordering** (Native API):
```typescript
// SpotifyService.ts
async reorderPlaylistTracks(
  playlistId: string,
  rangeStart: number,
  insertBefore: number,
  rangeLength = 1
): Promise<void>
```
- Uses `PUT /playlists/{id}/tracks` endpoint
- Single API call per reorder
- Immediate and efficient

**YouTube Reordering** (Delete + Re-insert):
```typescript
// YouTubeService.ts
async reorderPlaylistTracks(
  playlistId: string,
  playlistItemId: string,
  videoId: string,
  fromPosition: number,
  toPosition: number
): Promise<void>
```
- YouTube API lacks native reorder endpoint
- Workaround: Delete item, then re-insert at new position
- Requires 2 API calls (100 quota units per reorder)
- Track mappings cached in SyncStore for synced playlists

#### 4. Cross-Platform Sync

**Track Mapping System**:
```typescript
interface YouTubeTrackMapping {
  spotifyTrackId: string
  youtubePlaylistItemId: string
  youtubeVideoId: string
}
```

- When playlists are synced, YouTube item IDs are cached
- Reordering on Spotify triggers YouTube reorder for synced playlists
- Mappings stored in SyncStore for persistent reference

**Sync Flow**:
1. User drags track in Spotify playlist
2. Spotify API reorder executes immediately
3. If playlist is synced, lookup YouTube mapping
4. Execute YouTube reorder (delete + re-insert)
5. Update lastSync timestamp

#### 5. UX Details

**Drop Indicator Positioning**:
- Dragging **UP** (activeIndex > targetIndex): Indicator shows **above** target
- Dragging **DOWN** (activeIndex < targetIndex): Indicator shows **below** target
- Edge cases handled: top padding ensures indicator visible at first position

**Activation Constraint**:
```typescript
useSensor(PointerSensor, {
  activationConstraint: {
    distance: 8, // Require 8px movement before drag starts
  },
})
```
- Prevents accidental drags from clicks
- Makes scrolling vs dragging intention clear

**Optimistic Updates**:
- UI updates immediately using `arrayMove`
- API calls happen in background
- On error, UI reverts to original state

### Technical Challenges Solved

#### Challenge 1: Floating Overlay Offset
**Problem**: Drag overlay appeared 3 tracks below cursor position
**Solution**:
- Added `snapCenterToCursor` modifier from @dnd-kit/modifiers
- Centers overlay card on cursor position
- Removed manual transform calculations

#### Challenge 2: Placeholder Jumping
**Problem**: Placeholder item would "jump" to target position immediately
**Solution**:
```typescript
const style = {
  transform: CSS.Transform.toString(transform),
  transition: transition,
  ...(isDragging && { transform: 'translate3d(0, 0, 0)' }),
}
```
- Override transform to `translate3d(0, 0, 0)` for dragged item
- Only other items shift to make room
- Placeholder stays in original position

#### Challenge 3: Drop Indicator Mismatch
**Problem**: Indicator showed above track but item dropped below
**Solution**: Calculate indicator position based on drag direction:
```typescript
const showIndicatorAbove = activeIndex !== null && activeIndex > index
```

#### Challenge 4: Horizontal Scroll
**Problem**: Drop indicator circles extended beyond container
**Solution**:
- Changed positioning from `-left-1/-right-1` to `left-1/right-1`
- Added `overflow-x-hidden` to tracks container
- Maintained visual appeal while preventing overflow

### API Quota Considerations

**Spotify**: No practical limits for reordering
**YouTube**:
- Daily quota: 10,000 units
- Each reorder costs 100 units (50 delete + 50 insert)
- Max ~100 reorders per day for synced playlists
- Consider caching and batch operations for heavy users

### Future Enhancements

- **Batch Reordering**: Drag multiple tracks at once
- **Undo/Redo**: Track reorder history
- **Keyboard Shortcuts**: Alt+↑/↓ to reorder without mouse
- **YouTube Optimization**: Explore playlist rebuild strategy for multiple reorders
- **Visual Transitions**: Smooth animations when other tracks shift

---

*This documentation serves as a comprehensive guide for developers working on Shelf. The project demonstrates modern web development practices with a focus on user experience and cross-platform integration.*