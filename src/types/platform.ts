import type { User } from './auth'
import type { SpotifyPlaylist } from './spotify'

export type Platform = 'spotify' | 'apple' | 'google'

export interface PlatformAuth {
	user: User
	accessToken: string
	refreshToken?: string
	isLoading: boolean
	error: string | null
	playlists: SpotifyPlaylist[] // Generic playlist type for now
	playlistsLoading: boolean
}

export interface PlatformConnection {
	platform: Platform
	isConnected: boolean
	isLoading: boolean
	error: string | null
}
