import { makeAutoObservable } from 'mobx'
import type PocketBase from 'pocketbase'
import type { AuthResponse } from '../types/auth'
import type { Platform, PlatformAuth } from '../types/platform'

export class AuthStore {
	// Platform-specific authentication states
	spotify: PlatformAuth | null = null
	apple: PlatformAuth | null = null
	google: PlatformAuth | null = null

	// PocketBase instance
	private pb: PocketBase

	constructor(pb: PocketBase) {
		makeAutoObservable(this)
		this.pb = pb
	}

	// Computed values
	get connectedPlatforms(): Platform[] {
		const connected: Platform[] = []
		if (this.spotify) connected.push('spotify')
		if (this.apple) connected.push('apple')
		if (this.google) connected.push('google')
		return connected
	}

	get hasAnyConnection(): boolean {
		return this.connectedPlatforms.length > 0
	}

	get isAnyLoading(): boolean {
		return this.spotify?.isLoading || this.apple?.isLoading || this.google?.isLoading || false
	}

	// Actions
	async connectSpotify() {
		// Set loading state
		this.spotify = {
			user: null!,
			accessToken: '',
			isLoading: true,
			error: null,
			playlists: [],
			playlistsLoading: false,
		}

		try {
			const authData: AuthResponse = await this.pb.collection('users').authWithOAuth2({
				provider: 'spotify',
				scopes: [
					'playlist-read-private',
					'playlist-modify-private',
					'playlist-read-collaborative',
					'user-read-email',
				],
			})

			// Update Spotify auth state
			this.spotify = {
				user: authData.record,
				accessToken: authData.meta?.accessToken || '',
				refreshToken: authData.meta?.refreshToken,
				isLoading: false,
				error: null,
				playlists: [],
				playlistsLoading: false,
			}
		} catch (err) {
			console.error('Spotify OAuth error:', err)
			this.spotify = {
				user: null!,
				accessToken: '',
				isLoading: false,
				error: 'Failed to connect to Spotify. Please try again.',
				playlists: [],
				playlistsLoading: false,
			}
		}
	}

	async connectGoogle() {
		// Set loading state
		this.google = {
			user: null!,
			accessToken: '',
			isLoading: true,
			error: null,
			playlists: [],
			playlistsLoading: false,
		}

		try {
			const authData: AuthResponse = await this.pb.collection('users').authWithOAuth2({
				provider: 'google',
				scopes: [
					'https://www.googleapis.com/auth/youtube',
					'https://www.googleapis.com/auth/youtube.readonly',
				],
			})

			// Update Google auth state
			this.google = {
				user: authData.record,
				accessToken: authData.meta?.accessToken || '',
				refreshToken: authData.meta?.refreshToken,
				isLoading: false,
				error: null,
				playlists: [],
				playlistsLoading: false,
			}
		} catch (err) {
			console.error('Google OAuth error:', err)
			this.google = {
				user: null!,
				accessToken: '',
				isLoading: false,
				error: 'Failed to connect to Google. Please try again.',
				playlists: [],
				playlistsLoading: false,
			}
		}
	}

	async connectApple() {
		// Apple Music connection - to be implemented later
		console.log('Apple Music connection - coming soon!')
	}

	disconnectPlatform(platform: Platform) {
		switch (platform) {
			case 'spotify':
				this.spotify = null
				break
			case 'google':
				this.google = null
				break
			case 'apple':
				this.apple = null
				break
		}
	}

	disconnectAll() {
		this.spotify = null
		this.apple = null
		this.google = null
		// Clear PocketBase session if no platforms connected
		this.pb.authStore.clear()
	}

	// Clear error for specific platform
	clearError(platform: Platform) {
		const platformAuth = this[platform]
		if (platformAuth) {
			platformAuth.error = null
		}
	}
}
