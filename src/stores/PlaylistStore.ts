import { makeAutoObservable, runInAction } from 'mobx'
import type PocketBase from 'pocketbase'
import type { Platform } from '../types/platform'
import type { PlaylistRecord } from '../types/pocketbase'
import type { SpotifyPlaylist } from '../types/spotify'
import type { YouTubePlaylist } from '../types/youtube'

export class PlaylistStore {
	playlists: PlaylistRecord[] = []
	isLoading = false
	error: string | null = null

	constructor(private pb: PocketBase) {
		makeAutoObservable(this)
	}

	// Actions

	/**
	 * Fetch all playlists for the current user
	 */
	async fetchPlaylists(platform?: Platform) {
		this.isLoading = true
		this.error = null

		try {
			const filter = platform
				? `user="${this.pb.authStore.model?.id}" && platform="${platform}"`
				: `user="${this.pb.authStore.model?.id}"`

			const records = await this.pb.collection('playlists').getFullList<PlaylistRecord>({
				filter,
				sort: '-updated',
			})

			runInAction(() => {
				this.playlists = records
				this.isLoading = false
			})

			return records
		} catch (err) {
			runInAction(() => {
				this.error = err instanceof Error ? err.message : 'Failed to fetch playlists'
				this.isLoading = false
			})
			throw err
		}
	}

	/**
	 * Save or update a Spotify playlist
	 */
	async saveSpotifyPlaylist(spotifyPlaylist: SpotifyPlaylist): Promise<PlaylistRecord> {
		try {
			// Check if playlist already exists
			const existing = await this.findByPlatformId('spotify', spotifyPlaylist.id)

			const data: Partial<PlaylistRecord> = {
				user: this.pb.authStore.model?.id,
				platform: 'spotify',
				platform_id: spotifyPlaylist.id,
				name: spotifyPlaylist.name,
				description: spotifyPlaylist.description || '',
				image_url: spotifyPlaylist.images[0]?.url || '',
				track_count: spotifyPlaylist.tracks.total,
				external_url: spotifyPlaylist.external_urls.spotify,
			}

			let record: PlaylistRecord
			if (existing) {
				record = await this.pb.collection('playlists').update<PlaylistRecord>(existing.id, data)
			} else {
				record = await this.pb.collection('playlists').create<PlaylistRecord>(data)
			}

			runInAction(() => {
				const index = this.playlists.findIndex(p => p.id === record.id)
				if (index >= 0) {
					this.playlists[index] = record
				} else {
					this.playlists.push(record)
				}
			})

			return record
		} catch (err) {
			runInAction(() => {
				this.error = err instanceof Error ? err.message : 'Failed to save playlist'
			})
			throw err
		}
	}

	/**
	 * Save or update a YouTube playlist
	 */
	async saveYouTubePlaylist(youtubePlaylist: YouTubePlaylist): Promise<PlaylistRecord> {
		try {
			// Check if playlist already exists
			const existing = await this.findByPlatformId('google', youtubePlaylist.id)

			const data: Partial<PlaylistRecord> = {
				user: this.pb.authStore.model?.id,
				platform: 'google',
				platform_id: youtubePlaylist.id,
				name: youtubePlaylist.snippet.title,
				description: youtubePlaylist.snippet.description || '',
				image_url: youtubePlaylist.snippet.thumbnails.default?.url || '',
				track_count: youtubePlaylist.contentDetails.itemCount,
				external_url: `https://www.youtube.com/playlist?list=${youtubePlaylist.id}`,
			}

			let record: PlaylistRecord
			if (existing) {
				record = await this.pb.collection('playlists').update<PlaylistRecord>(existing.id, data)
			} else {
				record = await this.pb.collection('playlists').create<PlaylistRecord>(data)
			}

			runInAction(() => {
				const index = this.playlists.findIndex(p => p.id === record.id)
				if (index >= 0) {
					this.playlists[index] = record
				} else {
					this.playlists.push(record)
				}
			})

			return record
		} catch (err) {
			runInAction(() => {
				this.error = err instanceof Error ? err.message : 'Failed to save playlist'
			})
			throw err
		}
	}

	/**
	 * Link two playlists together (e.g., Spotify + YouTube)
	 */
	async linkPlaylists(playlistId1: string, playlistId2: string) {
		try {
			const playlist1 = await this.pb.collection('playlists').getOne<PlaylistRecord>(playlistId1)
			const playlist2 = await this.pb.collection('playlists').getOne<PlaylistRecord>(playlistId2)

			// Add each to the other's synced_with array
			const synced1 = [...(playlist1.synced_with || []), playlistId2]
			const synced2 = [...(playlist2.synced_with || []), playlistId1]

			await Promise.all([
				this.pb.collection('playlists').update(playlistId1, {
					synced_with: synced1,
					last_synced: new Date().toISOString(),
				}),
				this.pb.collection('playlists').update(playlistId2, {
					synced_with: synced2,
					last_synced: new Date().toISOString(),
				}),
			])

			// Refresh playlists
			await this.fetchPlaylists()
		} catch (err) {
			runInAction(() => {
				this.error = err instanceof Error ? err.message : 'Failed to link playlists'
			})
			throw err
		}
	}

	/**
	 * Update last sync timestamp
	 */
	async updateLastSync(playlistId: string) {
		try {
			const record = await this.pb.collection('playlists').update<PlaylistRecord>(playlistId, {
				last_synced: new Date().toISOString(),
			})

			runInAction(() => {
				const index = this.playlists.findIndex(p => p.id === record.id)
				if (index >= 0) {
					this.playlists[index] = record
				}
			})

			return record
		} catch (err) {
			runInAction(() => {
				this.error = err instanceof Error ? err.message : 'Failed to update sync timestamp'
			})
			throw err
		}
	}

	/**
	 * Delete a playlist from database
	 */
	async deletePlaylist(playlistId: string) {
		try {
			await this.pb.collection('playlists').delete(playlistId)

			runInAction(() => {
				this.playlists = this.playlists.filter(p => p.id !== playlistId)
			})
		} catch (err) {
			runInAction(() => {
				this.error = err instanceof Error ? err.message : 'Failed to delete playlist'
			})
			throw err
		}
	}

	// Computed/Query methods

	/**
	 * Find playlist by platform and platform_id
	 */
	async findByPlatformId(platform: Platform, platformId: string): Promise<PlaylistRecord | null> {
		try {
			const records = await this.pb.collection('playlists').getList<PlaylistRecord>(1, 1, {
				filter: `user="${this.pb.authStore.model?.id}" && platform="${platform}" && platform_id="${platformId}"`,
			})

			return records.items[0] || null
		} catch (err) {
			return null
		}
	}

	/**
	 * Get playlists for a specific platform
	 */
	getPlaylistsByPlatform(platform: Platform): PlaylistRecord[] {
		return this.playlists.filter(p => p.platform === platform)
	}

	/**
	 * Check if a playlist is synced with another platform
	 */
	isSynced(playlistId: string): boolean {
		const playlist = this.playlists.find(p => p.id === playlistId)
		return (playlist?.synced_with?.length || 0) > 0
	}

	/**
	 * Get synced playlists for a given playlist
	 */
	getSyncedPlaylists(playlistId: string): PlaylistRecord[] {
		const playlist = this.playlists.find(p => p.id === playlistId)
		if (!playlist?.synced_with) return []

		return this.playlists.filter(p => playlist.synced_with.includes(p.id))
	}
}
