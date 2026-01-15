import type {
	SpotifyPlaylist,
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

	async getAllPlaylistTracks(playlistId: string): Promise<SpotifyPlaylistTracksResponse> {
		const limit = 100 // Max allowed by Spotify API
		let offset = 0
		let allItems: SpotifyPlaylistTracksResponse['items'] = []
		let total = 0

		// Fetch first page to get total count
		const firstPage = await this.getPlaylistTracks(playlistId, limit, offset)
		allItems = firstPage.items
		total = firstPage.total
		offset += limit

		// Fetch remaining pages
		while (offset < total) {
			const nextPage = await this.getPlaylistTracks(playlistId, limit, offset)
			allItems = [...allItems, ...nextPage.items]
			offset += limit
		}

		return {
			items: allItems,
			total: total,
			limit: limit,
			offset: 0,
			href: firstPage.href,
		}
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

	async reorderPlaylistTracks(
		playlistId: string,
		rangeStart: number,
		insertBefore: number,
		rangeLength = 1,
	): Promise<void> {
		const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				range_start: rangeStart,
				insert_before: insertBefore,
				range_length: rangeLength,
			}),
		})

		if (!response.ok) {
			throw new Error(`Spotify API error: ${response.status} ${response.statusText}`)
		}
	}

	async createPlaylist(name: string, description?: string, isPublic = true): Promise<SpotifyPlaylist> {
		// First get the current user's ID
		const userResponse = await fetch('https://api.spotify.com/v1/me', {
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				'Content-Type': 'application/json',
			},
		})

		if (!userResponse.ok) {
			throw new Error(`Failed to get user info: ${userResponse.status} ${userResponse.statusText}`)
		}

		const user = await userResponse.json()

		// Create the playlist
		const response = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				name,
				description: description || '',
				public: isPublic,
			}),
		})

		if (!response.ok) {
			throw new Error(`Failed to create playlist: ${response.status} ${response.statusText}`)
		}

		return response.json()
	}

	async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<void> {
		// Spotify allows max 100 tracks per request
		const batchSize = 100

		for (let i = 0; i < trackUris.length; i += batchSize) {
			const batch = trackUris.slice(i, i + batchSize)

			const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					uris: batch,
				}),
			})

			if (!response.ok) {
				throw new Error(`Failed to add tracks: ${response.status} ${response.statusText}`)
			}
		}
	}
}
