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
