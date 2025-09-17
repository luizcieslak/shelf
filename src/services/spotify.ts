import type {
	SpotifyPlaylistsResponse,
	SpotifyPlaylistTracksResponse,
	SpotifySearchResponse,
} from '../types/spotify'

export class SpotifyService {
	private accessToken: string

	constructor(accessToken: string) {
		this.accessToken = accessToken
	}

	async getCurrentUserPlaylists(limit = 50, offset = 0): Promise<SpotifyPlaylistsResponse> {
		const response = await fetch(`https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`, {
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				'Content-Type': 'application/json',
			},
		})

		if (!response.ok) {
			throw new Error(`Spotify API error: ${response.status} ${response.statusText}`)
		}

		return response.json()
	}

	async getPlaylistTracks(
		playlistId: string,
		limit = 50,
		offset = 0,
	): Promise<SpotifyPlaylistTracksResponse> {
		const response = await fetch(
			`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`,
			{
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
					'Content-Type': 'application/json',
				},
			},
		)

		if (!response.ok) {
			throw new Error(`Spotify API error: ${response.status} ${response.statusText}`)
		}

		return response.json()
	}

	async searchTracks(query: string, limit = 20): Promise<SpotifySearchResponse> {
		const response = await fetch(
			`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
			{
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
					'Content-Type': 'application/json',
				},
			},
		)

		if (!response.ok) {
			throw new Error(`Spotify API error: ${response.status} ${response.statusText}`)
		}

		return response.json()
	}

	async addTrackToPlaylist(playlistId: string, trackUri: string): Promise<void> {
		const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				uris: [trackUri],
			}),
		})

		if (!response.ok) {
			throw new Error(`Spotify API error: ${response.status} ${response.statusText}`)
		}
	}
}
