import type { RecordModel } from 'pocketbase'
import type { Platform } from './platform'

/**
 * PocketBase Playlists collection schema
 * Each playlist is stored separately per platform
 */
export interface PlaylistRecord extends RecordModel {
	user: string // relation to users collection
	platform: Platform
	platform_id: string // spotify/youtube/apple playlist ID
	name: string
	description: string
	image_url: string
	track_count: number
	external_url: string
	synced_with: string[] // array of linked playlist record IDs
	last_synced?: string // ISO datetime
	// RecordModel provides: id, created, updated
}

/**
 * Type-safe collections map
 */
export interface TypedPocketBase {
	collection(name: 'playlists'): {
		getFullList: () => Promise<PlaylistRecord[]>
		getList: (page?: number, perPage?: number, options?: any) => Promise<{ items: PlaylistRecord[] }>
		getOne: (id: string) => Promise<PlaylistRecord>
		create: (data: Partial<PlaylistRecord>) => Promise<PlaylistRecord>
		update: (id: string, data: Partial<PlaylistRecord>) => Promise<PlaylistRecord>
		delete: (id: string) => Promise<boolean>
	}
}
