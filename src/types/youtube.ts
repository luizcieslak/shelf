export interface YouTubePlaylistsResponse {
	kind: string
	etag: string
	nextPageToken?: string
	prevPageToken?: string
	pageInfo: {
		totalResults: number
		resultsPerPage: number
	}
	items: YouTubePlaylist[]
}

export interface YouTubePlaylist {
	kind: string
	etag: string
	id: string
	snippet: {
		publishedAt: string
		channelId: string
		title: string
		description: string
		thumbnails: {
			default: YouTubeThumbnail
			medium: YouTubeThumbnail
			high: YouTubeThumbnail
			standard?: YouTubeThumbnail
			maxres?: YouTubeThumbnail
		}
		channelTitle: string
		localized: {
			title: string
			description: string
		}
	}
	contentDetails: {
		itemCount: number
	}
}

export interface YouTubePlaylistItemsResponse {
	kind: string
	etag: string
	nextPageToken?: string
	prevPageToken?: string
	pageInfo: {
		totalResults: number
		resultsPerPage: number
	}
	items: YouTubePlaylistItem[]
}

export interface YouTubePlaylistItem {
	kind: string
	etag: string
	id: string
	snippet: {
		publishedAt: string
		channelId: string
		title: string
		description: string
		thumbnails: {
			default: YouTubeThumbnail
			medium: YouTubeThumbnail
			high: YouTubeThumbnail
			standard?: YouTubeThumbnail
			maxres?: YouTubeThumbnail
		}
		channelTitle: string
		videoOwnerChannelTitle: string
		videoOwnerChannelId: string
	}
	contentDetails: {
		videoId: string
		videoPublishedAt: string
	}
}

export interface YouTubeSearchResponse {
	kind: string
	etag: string
	nextPageToken?: string
	prevPageToken?: string
	pageInfo: {
		totalResults: number
		resultsPerPage: number
	}
	items: YouTubeSearchItem[]
}

export interface YouTubeSearchItem {
	kind: string
	etag: string
	id: {
		kind: string
		videoId: string
	}
	snippet: {
		publishedAt: string
		channelId: string
		title: string
		description: string
		thumbnails: {
			default: YouTubeThumbnail
			medium: YouTubeThumbnail
			high: YouTubeThumbnail
		}
		channelTitle: string
		liveBroadcastContent: string
	}
}

interface YouTubeThumbnail {
	url: string
	width: number
	height: number
}
