import { makeAutoObservable, reaction } from 'mobx'
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

	// Navigation callback (set by LoginScreen)
	onAuthSuccess?: () => void

	constructor(pb: PocketBase) {
		makeAutoObservable(this)
		this.pb = pb
		this.initialize()
		this.setupPersistence()
	}

	// Initialize auth state from localStorage
	async initialize() {
		// Check if PocketBase has a valid auth session
		if (!this.pb.authStore.isValid || !this.pb.authStore.record) {
			return
		}

		try {
			// Restore Spotify auth from localStorage
			const spotifyAuth = localStorage.getItem('shelf_spotify_auth')
			if (spotifyAuth) {
				const parsed = JSON.parse(spotifyAuth)
				this.spotify = {
					user: this.pb.authStore.record,
					accessToken: parsed.accessToken,
					refreshToken: parsed.refreshToken,
					isLoading: false,
					error: null,
					playlists: [],
					playlistsLoading: false,
				}
			}

			// Restore Google auth from localStorage
			const googleAuth = localStorage.getItem('shelf_google_auth')
			if (googleAuth) {
				const parsed = JSON.parse(googleAuth)
				this.google = {
					user: this.pb.authStore.record,
					accessToken: parsed.accessToken,
					refreshToken: parsed.refreshToken,
					isLoading: false,
					error: null,
					playlists: [],
					playlistsLoading: false,
				}
			}

			console.log('Auth restored from localStorage:', {
				hasSpotify: !!this.spotify,
				hasGoogle: !!this.google,
				connectedPlatforms: this.connectedPlatforms,
			})
		} catch (err) {
			console.error('Failed to restore auth state:', err)
			// Clear corrupted data
			localStorage.removeItem('shelf_spotify_auth')
			localStorage.removeItem('shelf_google_auth')
		}
	}

	// Setup automatic localStorage sync using MobX reactions
	private setupPersistence() {
		// Sync Spotify auth to localStorage
		reaction(
			() => this.spotify,
			spotify => {
				if (spotify?.accessToken) {
					localStorage.setItem(
						'shelf_spotify_auth',
						JSON.stringify({
							accessToken: spotify.accessToken,
							refreshToken: spotify.refreshToken,
						}),
					)
				} else {
					localStorage.removeItem('shelf_spotify_auth')
				}
			},
		)

		// Sync Google auth to localStorage
		reaction(
			() => this.google,
			google => {
				if (google?.accessToken) {
					localStorage.setItem(
						'shelf_google_auth',
						JSON.stringify({
							accessToken: google.accessToken,
							refreshToken: google.refreshToken,
						}),
					)
				} else {
					localStorage.removeItem('shelf_google_auth')
				}
			},
		)
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
					'playlist-modify-public',
					'playlist-read-collaborative',
					'user-read-email',
				],
			})

			// Update Spotify auth state (MobX reaction will auto-persist to localStorage)
			this.spotify = {
				user: authData.record,
				accessToken: authData.meta?.accessToken || '',
				refreshToken: authData.meta?.refreshToken,
				isLoading: false,
				error: null,
				playlists: [],
				playlistsLoading: false,
			}

			// Trigger navigation on successful auth
			if (this.onAuthSuccess) {
				this.onAuthSuccess()
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
		console.log('AuthStore.connectGoogle() called')

		// Set loading state
		this.google = {
			user: null!,
			accessToken: '',
			isLoading: true,
			error: null,
			playlists: [],
			playlistsLoading: false,
		}

		console.log('Google auth loading state set, connected platforms:', this.connectedPlatforms)

		try {
			console.log('Starting PocketBase OAuth2 for Google...')
			const authData: AuthResponse = await this.pb.collection('users').authWithOAuth2({
				provider: 'google',
				scopes: [
					'https://www.googleapis.com/auth/youtube',
					'https://www.googleapis.com/auth/youtube.readonly',
					'https://www.googleapis.com/auth/userinfo.profile',
					'https://www.googleapis.com/auth/userinfo.email',
				],
			})

			console.log('PocketBase OAuth2 successful, authData:', authData)

			// Update Google auth state (MobX reaction will auto-persist to localStorage)
			this.google = {
				user: authData.record,
				accessToken: authData.meta?.accessToken || '',
				refreshToken: authData.meta?.refreshToken,
				isLoading: false,
				error: null,
				playlists: [],
				playlistsLoading: false,
			}

			console.log('Google auth state updated:', {
				hasAccessToken: !!this.google.accessToken,
				connectedPlatforms: this.connectedPlatforms,
			})

			// Trigger navigation on successful auth
			if (this.onAuthSuccess) {
				this.onAuthSuccess()
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
		// Set to null - MobX reaction will auto-clear from localStorage
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
		// Set to null - MobX reactions will auto-clear from localStorage
		this.spotify = null
		this.apple = null
		this.google = null
		// Clear PocketBase session
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
