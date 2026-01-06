import type { ExportedPlaylist } from '../types/export'
import type { SpotifyPlaylist, SpotifyTrack } from '../types/spotify'

/**
 * Converts a Spotify playlist and its tracks to the ExportedPlaylist format
 */
export function convertToExportFormat(playlist: SpotifyPlaylist, tracks: SpotifyTrack[]): ExportedPlaylist {
	return {
		playlist: {
			name: playlist.name,
			description: playlist.description || undefined,
			platform: 'spotify',
			exportedAt: new Date().toISOString(),
			trackCount: tracks.length,
			playlistId: playlist.id,
			externalUrl: playlist.external_urls.spotify,
		},
		tracks: tracks.map(track => ({
			name: track.name,
			artists: track.artists.map(artist => artist.name),
			album: track.album.name,
			duration_ms: track.duration_ms,
			isrc: undefined, // Spotify API doesn't provide ISRC in basic track objects
			spotify_id: track.id,
			external_urls: {
				spotify: `https://open.spotify.com/track/${track.id}`,
			},
			release_date: track.album.release_date,
			track_number: undefined, // Not available in current track object
			disc_number: undefined, // Not available in current track object
		})),
	}
}

/**
 * Downloads a JSON file with the playlist data
 */
export function downloadPlaylistAsJson(playlist: SpotifyPlaylist, tracks: SpotifyTrack[]) {
	const exportData = convertToExportFormat(playlist, tracks)
	const jsonString = JSON.stringify(exportData, null, 2)
	const blob = new Blob([jsonString], { type: 'application/json' })
	const url = URL.createObjectURL(blob)

	// Create filename: playlist-name-YYYY-MM-DD.json
	const date = new Date().toISOString().split('T')[0]
	const safeName = playlist.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
	const filename = `${safeName}-${date}.json`

	// Create download link and trigger
	const link = document.createElement('a')
	link.href = url
	link.download = filename
	document.body.appendChild(link)
	link.click()

	// Cleanup
	document.body.removeChild(link)
	URL.revokeObjectURL(url)
}
