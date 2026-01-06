import { makeAutoObservable } from 'mobx'

export interface YouTubeTrackMapping {
	spotifyTrackId: string
	youtubePlaylistItemId: string
	youtubeVideoId: string
}

export interface PlaylistLink {
	spotifyPlaylistId: string
	youtubePlaylistId: string
	youtubePlaylistUrl: string
	createdAt: Date
	lastSyncAt: Date
	youtubeTrackMappings?: YouTubeTrackMapping[]
}

export class SyncStore {
	// Map of Spotify playlist ID to YouTube playlist info
	linkedPlaylists: Map<string, PlaylistLink> = new Map()

	constructor() {
		makeAutoObservable(this)
	}

	// Actions
	linkPlaylists(spotifyPlaylistId: string, youtubePlaylistId: string, youtubePlaylistUrl: string) {
		const link: PlaylistLink = {
			spotifyPlaylistId,
			youtubePlaylistId,
			youtubePlaylistUrl,
			createdAt: new Date(),
			lastSyncAt: new Date(),
		}

		this.linkedPlaylists.set(spotifyPlaylistId, link)
	}

	unlinkPlaylist(spotifyPlaylistId: string) {
		this.linkedPlaylists.delete(spotifyPlaylistId)
	}

	updateLastSync(spotifyPlaylistId: string) {
		const link = this.linkedPlaylists.get(spotifyPlaylistId)
		if (link) {
			link.lastSyncAt = new Date()
		}
	}

	addYouTubeTrackMapping(
		spotifyPlaylistId: string,
		spotifyTrackId: string,
		youtubePlaylistItemId: string,
		youtubeVideoId: string,
	) {
		const link = this.linkedPlaylists.get(spotifyPlaylistId)
		if (link) {
			if (!link.youtubeTrackMappings) {
				link.youtubeTrackMappings = []
			}
			link.youtubeTrackMappings.push({
				spotifyTrackId,
				youtubePlaylistItemId,
				youtubeVideoId,
			})
		}
	}

	getYouTubeTrackMapping(spotifyPlaylistId: string, spotifyTrackId: string): YouTubeTrackMapping | undefined {
		const link = this.linkedPlaylists.get(spotifyPlaylistId)
		return link?.youtubeTrackMappings?.find(mapping => mapping.spotifyTrackId === spotifyTrackId)
	}

	// Computed values
	isPlaylistLinked(spotifyPlaylistId: string): boolean {
		return this.linkedPlaylists.has(spotifyPlaylistId)
	}

	getLinkedPlaylist(spotifyPlaylistId: string): PlaylistLink | undefined {
		return this.linkedPlaylists.get(spotifyPlaylistId)
	}

	get totalLinkedPlaylists(): number {
		return this.linkedPlaylists.size
	}
}
