import type { SpotifyPlaylistsResponse } from '../types/spotify'

export class SpotifyService {
	private accessToken: string

	constructor(accessToken: string) {
		this.accessToken = accessToken
	}

	async getCurrentUserPlaylists(limit = 20, offset = 0): Promise<SpotifyPlaylistsResponse> {
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
}
