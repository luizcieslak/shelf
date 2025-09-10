import { makeAutoObservable } from 'mobx'
import type PocketBase from 'pocketbase'
import { SpotifyService } from '../services/spotify'
import type { AuthResponse, User } from '../types/auth'
import type { SpotifyPlaylist } from '../types/spotify'

export class AuthStore {
	// Observable state
	user: User | null = null
	spotifyAccessToken: string | null = null
	isLoading = false
	error: string | null = null
	playlists: SpotifyPlaylist[] = []
	playlistsLoading = false

	// PocketBase instance
	private pb: PocketBase

	constructor(pb: PocketBase) {
		makeAutoObservable(this)
		this.pb = pb

		// Initialize from existing PocketBase session
		this.user = pb.authStore.model
	}

	// Computed values
	get isAuthenticated() {
		return this.user !== null
	}

	get hasSpotifyToken() {
		return this.spotifyAccessToken !== null
	}

	get canFetchPlaylists() {
		return this.isAuthenticated && this.hasSpotifyToken
	}

	// Actions
	async loginWithSpotify() {
		this.isLoading = true
		this.error = null

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

			// Update observable state
			this.user = authData.record
			this.spotifyAccessToken = authData.meta?.accessToken || null

			// Automatically fetch playlists if we have a token
			if (this.spotifyAccessToken) {
				await this.fetchPlaylists()
			}
		} catch (err) {
			console.error('OAuth login error:', err)
			this.error = 'Failed to sign in with Spotify. Please try again.'
		} finally {
			this.isLoading = false
		}
	}

	async fetchPlaylists() {
		if (!this.spotifyAccessToken) {
			this.error = 'No Spotify access token available'
			return
		}

		this.playlistsLoading = true
		this.error = null

		try {
			const spotifyService = new SpotifyService(this.spotifyAccessToken)
			const response = await spotifyService.getCurrentUserPlaylists()
			this.playlists = response.items
		} catch (err) {
			console.error('Error fetching playlists:', err)
			this.error = 'Failed to load playlists'
		} finally {
			this.playlistsLoading = false
		}
	}

	logout() {
		// Clear PocketBase auth
		this.pb.authStore.clear()

		// Clear observable state
		this.user = null
		this.spotifyAccessToken = null
		this.playlists = []
		this.error = null
		this.isLoading = false
		this.playlistsLoading = false
	}

	// Clear error message
	clearError() {
		this.error = null
	}
}
