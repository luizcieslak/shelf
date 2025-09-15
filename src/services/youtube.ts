import type {
	YouTubePlaylistItemsResponse,
	YouTubePlaylistsResponse,
	YouTubeSearchResponse,
} from '../types/youtube'

export class YouTubeService {
	private accessToken: string

	constructor(accessToken: string) {
		this.accessToken = accessToken
	}

	async getCurrentUserPlaylists(maxResults = 50, pageToken?: string): Promise<YouTubePlaylistsResponse> {
		const response = await fetch(
			`https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=${maxResults}${
				pageToken ? `&pageToken=${pageToken}` : ''
			}`,
			{
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
					'Content-Type': 'application/json',
				},
			},
		)

		if (!response.ok) {
			throw new Error(`YouTube API error: ${response.status} ${response.statusText}`)
		}

		return response.json()
	}

	async getPlaylistItems(
		playlistId: string,
		maxResults = 50,
		pageToken?: string,
	): Promise<YouTubePlaylistItemsResponse> {
		const response = await fetch(
			`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=${maxResults}${
				pageToken ? `&pageToken=${pageToken}` : ''
			}`,
			{
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
					'Content-Type': 'application/json',
				},
			},
		)

		if (!response.ok) {
			throw new Error(`YouTube API error: ${response.status} ${response.statusText}`)
		}

		return response.json()
	}

	async searchTracks(query: string, maxResults = 20, pageToken?: string): Promise<YouTubeSearchResponse> {
		const response = await fetch(
			`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(
				query,
			)}&maxResults=${maxResults}${pageToken ? `&pageToken=${pageToken}` : ''}`,
			{
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
					'Content-Type': 'application/json',
				},
			},
		)

		if (!response.ok) {
			throw new Error(`YouTube API error: ${response.status} ${response.statusText}`)
		}

		return response.json()
	}
}
