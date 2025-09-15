export interface SpotifyPlaylist {
	id: string
	name: string
	description: string | null
	images: Array<{
		url: string
		height: number | null
		width: number | null
	}>
	tracks: {
		total: number
		href: string
	}
	public: boolean
	collaborative: boolean
	owner: {
		display_name: string
		id: string
	}
	external_urls: {
		spotify: string
	}
}

export interface SpotifyPlaylistsResponse {
	items: SpotifyPlaylist[]
	total: number
	limit: number
	offset: number
	next: string | null
	previous: string | null
}

export interface SpotifyPlaylistTracksResponse {
	items: PlaylistTrackItem[]
	total: number
	limit: number
	offset: number
	href: string
}

export interface PlaylistTrackItem {
	added_at: string
	track: SpotifyTrack
}

export interface SpotifyTrack {
	id: string
	name: string
	uri: string
	duration_ms: number
	explicit: boolean
	artists: SpotifyArtist[]
	album: SpotifyAlbum
	preview_url: string | null
}

export interface SpotifyArtist {
	id: string
	name: string
	uri: string
}

export interface SpotifyAlbum {
	id: string
	name: string
	release_date: string
	images: SpotifyImage[]
}

// If you don't already have this type defined
export interface SpotifyImage {
	url: string
	height: number | null
	width: number | null
}

export interface SpotifySearchResponse {
	tracks: {
		items: SpotifyTrack[]
		total: number
		limit: number
		offset: number
	}
}
