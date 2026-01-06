import type {
	YouTubePlaylist,
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

	async createPlaylist(title: string, description?: string): Promise<YouTubePlaylist> {
		const response = await fetch('https://www.googleapis.com/youtube/v3/playlists?part=snippet', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				snippet: {
					title,
					description: description || '',
					defaultLanguage: 'en',
				},
			}),
		})

		if (!response.ok) {
			throw new Error(`YouTube API error: ${response.status} ${response.statusText}`)
		}

		const result = await response.json()
		return result
	}

	async addTrackToPlaylist(
		playlistId: string,
		searchQuery: string,
	): Promise<{ playlistItemId: string; videoId: string }> {
		// First, search for the track
		const searchResult = await this.searchTracks(searchQuery, 1)

		if (!searchResult.items?.length) {
			throw new Error(`No results found for: ${searchQuery}`)
		}

		const videoId = searchResult.items[0].id.videoId

		// Add the video to the playlist
		const response = await fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				snippet: {
					playlistId,
					resourceId: {
						kind: 'youtube#video',
						videoId,
					},
				},
			}),
		})

		if (!response.ok) {
			throw new Error(`Failed to add track to playlist: ${response.status} ${response.statusText}`)
		}

		const result = await response.json()
		return {
			playlistItemId: result.id,
			videoId,
		}
	}

	async reorderPlaylistTracks(
		playlistId: string,
		playlistItemId: string,
		videoId: string,
		_fromPosition: number,
		toPosition: number,
	): Promise<void> {
		// YouTube doesn't have a native reorder API
		// We need to: 1) Delete the item, 2) Re-insert at new position

		// Step 1: Delete the item at the old position
		const deleteResponse = await fetch(
			`https://www.googleapis.com/youtube/v3/playlistItems?id=${playlistItemId}`,
			{
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
					'Content-Type': 'application/json',
				},
			},
		)

		if (!deleteResponse.ok) {
			throw new Error(`Failed to delete playlist item: ${deleteResponse.status} ${deleteResponse.statusText}`)
		}

		// Step 2: Re-insert at new position
		const insertResponse = await fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				snippet: {
					playlistId,
					position: toPosition,
					resourceId: {
						kind: 'youtube#video',
						videoId,
					},
				},
			}),
		})

		if (!insertResponse.ok) {
			throw new Error(`Failed to insert playlist item: ${insertResponse.status} ${insertResponse.statusText}`)
		}
	}
}
