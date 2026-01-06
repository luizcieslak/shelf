/**
 * TypeScript interfaces for exported playlist format
 * Used for exporting playlists to JSON files for offline music matching
 */

export interface ExportedPlaylist {
	playlist: PlaylistMetadata
	tracks: ExportedTrack[]
}

export interface PlaylistMetadata {
	/** Original playlist name */
	name: string
	/** Playlist description if available */
	description?: string
	/** Source platform (spotify, youtube, etc.) */
	platform: 'spotify' | 'youtube' | 'apple'
	/** ISO 8601 timestamp of when the export was created */
	exportedAt: string
	/** Total number of tracks in the playlist */
	trackCount: number
	/** Original playlist ID on the source platform */
	playlistId: string
	/** External URL to the playlist on the source platform */
	externalUrl?: string
}

export interface ExportedTrack {
	/** Track title */
	name: string
	/** Array of artist names */
	artists: string[]
	/** Album name */
	album: string
	/** Track duration in milliseconds */
	duration_ms: number
	/** International Standard Recording Code - key for matching local files */
	isrc?: string
	/** Spotify track ID */
	spotify_id?: string
	/** YouTube video ID */
	youtube_id?: string
	/** External URLs to the track on various platforms */
	external_urls?: {
		spotify?: string
		youtube?: string
	}
	/** Album release date */
	release_date?: string
	/** Track number on the album */
	track_number?: number
	/** Disc number (for multi-disc albums) */
	disc_number?: number
}
