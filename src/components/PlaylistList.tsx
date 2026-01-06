import {
	DndContext,
	DragOverlay,
	type DragEndEvent,
	type DragStartEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	MeasuringStrategy,
	closestCenter,
	type CollisionDetection,
} from '@dnd-kit/core'
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
	CheckCircledIcon,
	DotsVerticalIcon,
	DownloadIcon,
	DragHandleDots2Icon,
	ExclamationTriangleIcon,
	ExternalLinkIcon,
	Link2Icon,
	PlusIcon,
	UpdateIcon,
} from '@radix-ui/react-icons'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { SpotifyService } from '../services/spotify'
import { YouTubeService } from '../services/youtube'
import { useStores } from '../stores/StoreContext'
import type { SpotifyPlaylist, SpotifyTrack } from '../types/spotify'
import { downloadPlaylistAsJson } from '../utils/exportPlaylist'
import AddTracksDialog from './AddTracksDialog'

interface PlaylistListProps {
	accessToken: string
}

interface TransferProgress {
	step: 'creating' | 'adding' | 'completed'
	status: 'loading' | 'success' | 'error' | 'warning'
	message: string
	tracksAdded?: number
	totalTracks?: number
	playlistUrl?: string
}

interface SortableTrackItemProps {
	track: SpotifyTrack
	isExpanded: boolean
	index: number
	activeIndex: number | null
}

const SortableTrackItem = ({ track, isExpanded, index, activeIndex }: SortableTrackItemProps) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
		id: track.id,
	})

	const style = {
		transform: CSS.Transform.toString(transform),
		transition: transition,
		// Prevent the dragged item from moving (only other items should shift)
		...(isDragging && { transform: 'translate3d(0, 0, 0)' }),
	}

	// Determine if indicator should be above or below
	// When dragging UP (activeIndex > index), the item will be placed ABOVE the hovered item
	// When dragging DOWN (activeIndex < index), the item will be placed BELOW the hovered item
	// Exception: when dragging down, we show above the item below the target
	const showIndicatorAbove = activeIndex !== null && activeIndex > index

	return (
		<div className='relative'>
			{/* Drop indicator - shows when hovering over this item during drag */}
			{isOver && !isDragging && (
				<div
					className={`absolute left-1 right-1 h-0.5 bg-blue-500 z-10 animate-pulse ${
						showIndicatorAbove ? '-top-1' : '-bottom-1'
					}`}
				>
					<div className='absolute left-0 -top-1 w-2 h-2 bg-blue-500 rounded-full' />
					<div className='absolute right-0 -top-1 w-2 h-2 bg-blue-500 rounded-full' />
				</div>
			)}
			<div
				ref={setNodeRef}
				style={style}
				className={`flex items-center gap-3 p-2 rounded-md cursor-grab active:cursor-grabbing ${
					isDragging
						? 'bg-gray-100 border-2 border-dashed border-gray-300'
						: 'hover:bg-gray-50 transition-smooth hover-lift'
				} ${isExpanded && !isDragging ? 'stagger-item' : ''}`}
				{...attributes}
				{...listeners}
			>
				<div className={`flex items-center gap-3 flex-1 min-w-0 ${isDragging ? 'opacity-40' : ''}`}>
					{track.album.images[0] && (
						<img
							src={track.album.images[0].url}
							alt={track.album.name}
							className='w-10 h-10 rounded object-cover flex-shrink-0'
							style={{ borderRadius: '5px' }}
						/>
					)}
					<div className='flex-1 min-w-0'>
						<div className='font-semibold text-gray-900 truncate' style={{ fontSize: '14px', fontWeight: 600 }}>
							{track.name}
						</div>
						<div className='text-gray-600 truncate' style={{ fontSize: '13px', fontWeight: 500 }}>
							{track.artists.map(artist => artist.name).join(', ')}
						</div>
					</div>
					<div className='p-2'>
						<DragHandleDots2Icon className='w-4 h-4 text-gray-400' />
					</div>
				</div>
			</div>
		</div>
	)
}

// Component for the floating drag overlay
interface TrackCardProps {
	track: SpotifyTrack
}

const TrackCard = ({ track }: TrackCardProps) => {
	return (
		<div className='flex items-center gap-3 p-2 bg-white rounded-md shadow-lg border-2 border-blue-500 w-full max-w-md cursor-grabbing'>
			{track.album.images[0] && (
				<img
					src={track.album.images[0].url}
					alt={track.album.name}
					className='w-10 h-10 rounded object-cover flex-shrink-0'
					style={{ borderRadius: '5px' }}
				/>
			)}
			<div className='flex-1 min-w-0'>
				<div className='font-semibold text-gray-900 truncate' style={{ fontSize: '14px', fontWeight: 600 }}>
					{track.name}
				</div>
				<div className='text-gray-600 truncate' style={{ fontSize: '13px', fontWeight: 500 }}>
					{track.artists.map(artist => artist.name).join(', ')}
				</div>
			</div>
			<div className='p-2'>
				<DragHandleDots2Icon className='w-4 h-4 text-gray-400' />
			</div>
		</div>
	)
}

const PlaylistList = observer(({ accessToken }: PlaylistListProps) => {
	const { authStore, syncStore } = useStores()
	const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
	const [playlistTracks, setPlaylistTracks] = useState<Record<string, SpotifyTrack[]>>({})
	const [expandedPlaylist, setExpandedPlaylist] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [transferProgress, setTransferProgress] = useState<Record<string, TransferProgress[]>>({})
	const [transferringPlaylist, setTransferringPlaylist] = useState<string | null>(null)
	const [successfulTransfers, setSuccessfulTransfers] = useState<Set<string>>(new Set())
	const [addTracksDialogOpen, setAddTracksDialogOpen] = useState(false)
	const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null)
	const [activeTrack, setActiveTrack] = useState<SpotifyTrack | null>(null)
	const [activeIndex, setActiveIndex] = useState<number | null>(null)

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8, // Require 8px movement before drag starts
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	)

	const measuring = {
		droppable: {
			strategy: MeasuringStrategy.Always,
		},
	}

	// Custom collision detection optimized for vertical lists
	const customCollisionDetection: CollisionDetection = (args) => {
		const { droppableContainers, pointerCoordinates } = args

		if (!pointerCoordinates) {
			return closestCenter(args)
		}

		const { y: pointerY } = pointerCoordinates

		// Find which droppable the pointer is closest to based on Y position
		const collisions = Array.from(droppableContainers.values())
			.filter(container => container.disabled === false)
			.map(container => {
				const rect = container.rect.current

				if (!rect) {
					return { id: container.id, distance: Number.MAX_SAFE_INTEGER }
				}

				// Calculate distance from pointer Y to the center Y of this item
				const centerY = rect.top + rect.height / 2
				const distance = Math.abs(pointerY - centerY)

				return {
					id: container.id,
					distance,
				}
			})
			.sort((a, b) => a.distance - b.distance)

		// Return the closest item based on Y distance
		if (collisions.length > 0) {
			return [{ id: collisions[0].id }]
		}

		return closestCenter(args)
	}

	const fetchPlaylistTracks = async (playlistId: string): Promise<SpotifyTrack[]> => {
		if (playlistTracks[playlistId]) return playlistTracks[playlistId]

		try {
			const spotifyService = new SpotifyService(accessToken)
			const response = await spotifyService.getPlaylistTracks(playlistId)
			const tracks = response.items.map(item => item.track)
			setPlaylistTracks(prev => ({
				...prev,
				[playlistId]: tracks,
			}))
			return tracks
		} catch (err) {
			console.error('Error fetching playlist tracks:', err)
			return []
		}
	}

	const handleExpandToggle = async (playlistId: string) => {
		if (expandedPlaylist === playlistId) {
			setExpandedPlaylist(null)
		} else {
			setExpandedPlaylist(playlistId)
			await fetchPlaylistTracks(playlistId)
		}
	}

	const handleAddTracks = (playlist: SpotifyPlaylist) => {
		setSelectedPlaylist(playlist)
		setAddTracksDialogOpen(true)
	}

	const handleTrackAdded = async (track: SpotifyTrack) => {
		if (selectedPlaylist) {
			// Update the playlist tracks in the local state
			setPlaylistTracks(prev => ({
				...prev,
				[selectedPlaylist.id]: [...(prev[selectedPlaylist.id] || []), track],
			}))

			// Update the playlist's track count
			setPlaylists(prev =>
				prev.map(p =>
					p.id === selectedPlaylist.id ? { ...p, tracks: { ...p.tracks, total: p.tracks.total + 1 } } : p,
				),
			)

			// If playlist is synced, also add to YouTube
			if (syncStore.isPlaylistLinked(selectedPlaylist.id)) {
				const linkedPlaylist = syncStore.getLinkedPlaylist(selectedPlaylist.id)
				if (linkedPlaylist && authStore.google?.accessToken) {
					try {
						const youtubeService = new YouTubeService(authStore.google.accessToken)
						const searchQuery = `${track.name} ${track.artists.map(a => a.name).join(' ')}`
						const youtubeTrack = await youtubeService.addTrackToPlaylist(
							linkedPlaylist.youtubePlaylistId,
							searchQuery,
						)

						// Store the mapping for future reordering
						syncStore.addYouTubeTrackMapping(
							selectedPlaylist.id,
							track.id,
							youtubeTrack.playlistItemId,
							youtubeTrack.videoId,
						)
						syncStore.updateLastSync(selectedPlaylist.id)
					} catch (err) {
						console.error('Failed to sync track to YouTube:', err)
					}
				}
			}
		}
	}

	const handleDragStart = (event: DragStartEvent, playlistId: string) => {
		const { active } = event
		const tracks = playlistTracks[playlistId]
		if (!tracks) return

		const trackIndex = tracks.findIndex(t => t.id === active.id)
		const track = tracks[trackIndex]

		if (track && trackIndex !== -1) {
			setActiveTrack(track)
			setActiveIndex(trackIndex)
		}
	}

	const handleDragCancel = () => {
		setActiveTrack(null)
		setActiveIndex(null)
	}

	const handleDragEnd = async (event: DragEndEvent, playlistId: string) => {
		const { active, over } = event

		// Clear the active track
		setActiveTrack(null)
		setActiveIndex(null)

		if (!over || active.id === over.id) {
			return
		}

		const tracks = playlistTracks[playlistId]
		if (!tracks) return

		const oldIndex = tracks.findIndex(track => track.id === active.id)
		const newIndex = tracks.findIndex(track => track.id === over.id)

		if (oldIndex === -1 || newIndex === -1) return

		// Update local state optimistically
		const newTracks = arrayMove(tracks, oldIndex, newIndex)
		setPlaylistTracks(prev => ({
			...prev,
			[playlistId]: newTracks,
		}))

		try {
			// Update Spotify
			const spotifyService = new SpotifyService(accessToken)
			await spotifyService.reorderPlaylistTracks(
				playlistId,
				oldIndex,
				newIndex > oldIndex ? newIndex + 1 : newIndex,
			)

			// If synced, also update YouTube
			if (syncStore.isPlaylistLinked(playlistId) && authStore.google?.accessToken) {
				const linkedPlaylist = syncStore.getLinkedPlaylist(playlistId)
				const track = newTracks[newIndex]

				if (linkedPlaylist && track) {
					try {
						const mapping = syncStore.getYouTubeTrackMapping(playlistId, track.id)
						if (mapping) {
							const youtubeService = new YouTubeService(authStore.google.accessToken)
							await youtubeService.reorderPlaylistTracks(
								linkedPlaylist.youtubePlaylistId,
								mapping.youtubePlaylistItemId,
								mapping.youtubeVideoId,
								oldIndex,
								newIndex,
							)
							syncStore.updateLastSync(playlistId)
						} else {
							console.warn('No YouTube mapping found for track:', track.name)
						}
					} catch (err) {
						console.error('Failed to reorder YouTube playlist:', err)
					}
				}
			}
		} catch (err) {
			console.error('Failed to reorder tracks:', err)
			// Revert optimistic update on error
			setPlaylistTracks(prev => ({
				...prev,
				[playlistId]: tracks,
			}))
		}
	}

	const handleSyncPlaylist = async (playlist: SpotifyPlaylist) => {
		// Get the YouTube playlist info from the transfer progress
		const progress = transferProgress[playlist.id]
		if (progress) {
			const completedStep = progress.find(p => p.step === 'completed' && p.playlistUrl)
			if (completedStep?.playlistUrl) {
				// Extract YouTube playlist ID from URL
				const urlParams = new URLSearchParams(new URL(completedStep.playlistUrl).search)
				const youtubePlaylistId = urlParams.get('list')

				if (youtubePlaylistId) {
					syncStore.linkPlaylists(playlist.id, youtubePlaylistId, completedStep.playlistUrl)

					// Fetch and cache YouTube playlist items for reordering
					if (authStore.google?.accessToken) {
						try {
							const youtubeService = new YouTubeService(authStore.google.accessToken)
							const youtubeItems = await youtubeService.getPlaylistItems(youtubePlaylistId)
							const spotifyTracks = playlistTracks[playlist.id]

							if (spotifyTracks && youtubeItems.items) {
								// Match YouTube items with Spotify tracks by position
								// This assumes tracks were added in the same order
								youtubeItems.items.forEach((item, index) => {
									if (spotifyTracks[index]) {
										syncStore.addYouTubeTrackMapping(
											playlist.id,
											spotifyTracks[index].id,
											item.id,
											item.contentDetails.videoId,
										)
									}
								})
							}
						} catch (err) {
							console.error('Failed to fetch YouTube playlist items:', err)
						}
					}
				}
			}
		}
	}

	const handleExportPlaylist = async (playlist: SpotifyPlaylist) => {
		// Fetch tracks if not already loaded
		const tracks = await fetchPlaylistTracks(playlist.id)
		if (tracks.length === 0) {
			console.error('No tracks to export')
			return
		}
		downloadPlaylistAsJson(playlist, tracks)
	}

	const getStatusIcon = (status: 'loading' | 'success' | 'error' | 'warning') => {
		switch (status) {
			case 'loading':
				return <UpdateIcon className='w-4 h-4 animate-spin' />
			case 'success':
				return <CheckCircledIcon className='w-4 h-4 text-green-600' />
			case 'error':
				return <ExclamationTriangleIcon className='w-4 h-4 text-red-600' />
			case 'warning':
				return <ExclamationTriangleIcon className='w-4 h-4 text-yellow-600' />
		}
	}

	const transferToYouTube = async (playlist: SpotifyPlaylist) => {
		if (!authStore.google?.accessToken) {
			try {
				console.log('Starting YouTube authentication...')
				await authStore.connectGoogle()

				// Give a small delay to ensure the observable state has updated
				await new Promise(resolve => setTimeout(resolve, 500))

				// Check if authentication was successful
				console.log('YouTube auth completed:', {
					hasGoogle: !!authStore.google,
					hasAccessToken: !!authStore.google?.accessToken,
					connectedPlatforms: authStore.connectedPlatforms,
				})

				if (!authStore.google?.accessToken) {
					console.log('YouTube authentication failed or cancelled')
					return // User cancelled authentication
				}

				console.log('YouTube authentication successful!')
			} catch (error) {
				console.error('Failed to authenticate with YouTube:', error)
				return
			}
		}

		setTransferringPlaylist(playlist.id)
		setTransferProgress(prev => ({
			...prev,
			[playlist.id]: [
				{
					step: 'creating',
					status: 'loading',
					message: 'Creating a new playlist...',
				},
			],
		}))

		try {
			const youtubeService = new YouTubeService(authStore.google.accessToken)

			// Step 1: Create playlist
			const createdPlaylist = await youtubeService.createPlaylist(playlist.name, playlist.description || '')
			const playlistUrl = `https://www.youtube.com/playlist?list=${createdPlaylist.id}`

			setTransferProgress(prev => ({
				...prev,
				[playlist.id]: [
					{
						step: 'creating',
						status: 'success',
						message: 'Creating a new playlist...',
					},
					{
						step: 'adding',
						status: 'loading',
						message: 'Adding the tracks to the created playlist...',
					},
				],
			}))

			// Step 2: Add tracks
			const tracks = await fetchPlaylistTracks(playlist.id)

			if (tracks.length === 0) {
				setTransferProgress(prev => ({
					...prev,
					[playlist.id]: [
						{
							step: 'creating',
							status: 'success',
							message: 'Creating a new playlist...',
						},
						{
							step: 'adding',
							status: 'error',
							message: 'No tracks found in playlist',
						},
					],
				}))
				setTransferringPlaylist(null)
				return
			}

			let successCount = 0
			const totalTracks = tracks.length

			for (const track of tracks) {
				try {
					const searchQuery = `${track.name} ${track.artists.map(a => a.name).join(' ')}`
					await youtubeService.addTrackToPlaylist(createdPlaylist.id, searchQuery)
					successCount++
				} catch (err) {
					console.error(`Failed to add track: ${track.name}`, err)
				}
			}

			// Step 3: Show final result
			const finalStatus =
				successCount === totalTracks ? 'success' : successCount >= totalTracks / 2 ? 'warning' : 'error'

			setTransferProgress(prev => ({
				...prev,
				[playlist.id]: [
					{
						step: 'creating',
						status: 'success',
						message: 'Creating a new playlist...',
					},
					{
						step: 'adding',
						status: 'success',
						message: 'Adding the tracks to the created playlist...',
					},
					{
						step: 'completed',
						status: finalStatus,
						message: `${successCount}/${totalTracks} of tracks added`,
						tracksAdded: successCount,
						totalTracks: totalTracks,
						playlistUrl: playlistUrl,
					},
				],
			}))

			// Mark as successful transfer if at least some tracks were added
			if (successCount > 0) {
				setSuccessfulTransfers(prev => new Set([...prev, playlist.id]))
			}
		} catch (err) {
			console.error('Transfer failed:', err)
			setTransferProgress(prev => ({
				...prev,
				[playlist.id]: [
					...prev[playlist.id].slice(0, -1),
					{
						...prev[playlist.id][prev[playlist.id].length - 1],
						status: 'error',
					},
				],
			}))
		} finally {
			setTransferringPlaylist(null)
		}
	}

	useEffect(() => {
		const fetchPlaylists = async () => {
			try {
				setLoading(true)
				const spotifyService = new SpotifyService(accessToken)
				const response = await spotifyService.getCurrentUserPlaylists()
				setPlaylists(response.items)
			} catch (err) {
				console.error('Error fetching playlists:', err)
				setError('Failed to load playlists')
			} finally {
				setLoading(false)
			}
		}

		fetchPlaylists()
	}, [accessToken])

	if (loading) {
		return (
			<div className='flex justify-center items-center py-8 animate-fade-in'>
				<div className='spinner h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full' />
			</div>
		)
	}

	if (error) {
		return <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>{error}</div>
	}

	return (
		<div className='max-w-[600px] mx-auto space-y-4'>
			<h2 className='text-2xl font-bold text-gray-900 mb-6'>Your Playlists</h2>

			{playlists.map((playlist, index) => (
				<div
					key={playlist.id}
					className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-smooth hover-lift stagger-item'
					style={{
						animationDelay: `${index * 100}ms`,
					}}
				>
					<div className='p-4'>
						{/* Playlist Header */}
						<div className='flex items-start justify-between mb-3'>
							<div className='flex-1 min-w-0'>
								<div className='flex items-center gap-3 mb-2'>
									<h3
										className='text-base font-semibold text-gray-900 truncate'
										style={{ fontSize: '16px', fontWeight: 600 }}
									>
										{playlist.name}
									</h3>
									{/* Platform Icons */}
									<div className='flex-shrink-0 flex items-center gap-1'>
										{/* Spotify Icon */}
										<svg
											className='w-4 h-4 text-green-600'
											viewBox='0 0 24 24'
											fill='currentColor'
											aria-label='Spotify'
										>
											<title>Spotify</title>
											<path d='M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.305-1.76-8.786-.963-.335.077-.67-.133-.746-.469-.077-.336.132-.67.469-.746 3.809-.871 7.077-.496 9.713 1.115.294.18.386.563.207.856zm1.223-2.723c-.226.367-.706.482-1.073.257-2.687-1.652-6.785-2.131-9.965-1.166-.413.125-.849-.106-.973-.518-.125-.413.106-.849.518-.973 3.632-1.102 8.147-.568 11.238 1.327.366.226.481.706.255 1.073zm.105-2.835C14.692 8.50 9.375 8.775 6.297 9.71c-.493.15-1.016-.128-1.166-.622-.149-.493.129-1.016.622-1.165 3.532-1.073 9.404-.865 13.115 1.338.445.264.590.837.326 1.282-.264.444-.838.590-1.282.326z' />
										</svg>

										{/* YouTube Icon - Show only if successfully transferred */}
										{successfulTransfers.has(playlist.id) && (
											<div className='flex items-center gap-1'>
												<svg className='w-4 h-4' viewBox='0 0 24 24' aria-label='YouTube'>
													<title>YouTube</title>
													<path
														fill='#FF0000'
														d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'
													/>
												</svg>
												{/* Sync Icon - Show only if synced */}
												{syncStore.isPlaylistLinked(playlist.id) && (
													<Link2Icon className='w-3 h-3 text-blue-600' aria-label='Synced' />
												)}
											</div>
										)}
									</div>
								</div>
								<p className='text-sm text-gray-600 mb-2'>{playlist.tracks.total} tracks</p>
							</div>

							{/* Transfer Action */}
							<DropdownMenu.Root>
								<DropdownMenu.Trigger asChild>
									<button
										type='button'
										className='p-2 hover:bg-gray-100 rounded-md transition-smooth hover-scale'
										disabled={transferringPlaylist === playlist.id}
									>
										<DotsVerticalIcon className='w-4 h-4 text-gray-600' />
									</button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Portal>
									<DropdownMenu.Content className='bg-white rounded-md shadow-lg border border-gray-200 p-1 min-w-[160px] animate-scale-in'>
										<DropdownMenu.Item
											className='px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none flex items-center gap-2 transition-smooth'
											onClick={() => handleAddTracks(playlist)}
										>
											<PlusIcon className='w-4 h-4' />
											Add tracks
										</DropdownMenu.Item>

										<DropdownMenu.Item
											className='px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none flex items-center gap-2 transition-smooth'
											onClick={() => handleExportPlaylist(playlist)}
										>
											<DownloadIcon className='w-4 h-4' />
											Export as JSON
										</DropdownMenu.Item>

										{/* Show Sync option only for successfully transferred playlists that aren't already synced */}
										{successfulTransfers.has(playlist.id) && !syncStore.isPlaylistLinked(playlist.id) && (
											<DropdownMenu.Item
												className='px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none flex items-center gap-2 transition-smooth'
												onClick={() => handleSyncPlaylist(playlist)}
											>
												<Link2Icon className='w-4 h-4' />
												Sync
											</DropdownMenu.Item>
										)}

										<DropdownMenu.Item
											className='px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none flex items-center gap-2 transition-smooth'
											onClick={() => transferToYouTube(playlist)}
											disabled={transferringPlaylist === playlist.id}
										>
											<svg className='w-4 h-4' viewBox='0 0 24 24'>
												<title>YouTube logo</title>
												<path
													fill='#FF0000'
													d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'
												/>
											</svg>
											Transfer to YouTube
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Portal>
							</DropdownMenu.Root>
						</div>

						{/* Transfer Progress */}
						{transferProgress[playlist.id] && (
							<div className='mb-4 p-3 bg-gray-50 rounded-md animate-slide-down'>
								<div className='space-y-2'>
									{transferProgress[playlist.id].map((progress, index) => (
										<div
											key={`${playlist.id}-${progress.step}-${index}`}
											className='flex items-center gap-2 text-sm stagger-item'
											style={{
												animationDelay: `${index * 100}ms`,
											}}
										>
											<div
												className={`transition-smooth ${progress.status === 'loading' ? 'animate-pulse' : ''}`}
											>
												{getStatusIcon(progress.status)}
											</div>
											<span className='text-gray-700'>{progress.message}</span>
											{progress.playlistUrl && progress.step === 'completed' && (
												<a
													href={progress.playlistUrl}
													target='_blank'
													rel='noopener noreferrer'
													className='flex items-center gap-1 text-blue-600 hover:text-blue-800 ml-2 transition-smooth hover-scale'
												>
													<span className='text-xs'>View playlist</span>
													<ExternalLinkIcon className='w-3 h-3' />
												</a>
											)}
										</div>
									))}
								</div>
							</div>
						)}

						{/* Expand Button */}
						<button
							type='button'
							onClick={() => handleExpandToggle(playlist.id)}
							className='text-sm text-blue-600 hover:text-blue-800 font-medium transition-smooth hover-scale flex items-center gap-1'
						>
							<span>{expandedPlaylist === playlist.id ? 'Hide tracks' : 'Show tracks'}</span>
							<svg
								className={`w-4 h-4 transition-smooth ${expandedPlaylist === playlist.id ? 'rotate-180' : 'rotate-0'}`}
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
							>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
							</svg>
						</button>

						{/* Expandable Tracks */}
						<div
							className={`collapsible-content ${
								expandedPlaylist === playlist.id ? 'max-h-96 mt-4' : 'max-h-0'
							}`}
							data-state={expandedPlaylist === playlist.id ? 'open' : 'closed'}
						>
							<DndContext
								sensors={sensors}
								collisionDetection={customCollisionDetection}
								onDragStart={event => handleDragStart(event, playlist.id)}
								onDragEnd={event => handleDragEnd(event, playlist.id)}
								onDragCancel={handleDragCancel}
								measuring={measuring}
							>
								<SortableContext
									items={playlistTracks[playlist.id]?.map(track => track.id) || []}
									strategy={verticalListSortingStrategy}
								>
									<div
										className={`space-y-3 overflow-x-hidden ${
											playlistTracks[playlist.id] && playlistTracks[playlist.id].length > 8
												? 'max-h-80 overflow-y-auto'
												: ''
										}`}
									>
										{playlistTracks[playlist.id]?.map((track, index) => (
											<SortableTrackItem
												key={track.id}
												track={track}
												isExpanded={expandedPlaylist === playlist.id}
												index={index}
												activeIndex={activeIndex}
											/>
										))}
									</div>
								</SortableContext>
								<DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
									{activeTrack ? <TrackCard track={activeTrack} /> : null}
								</DragOverlay>
							</DndContext>
						</div>
					</div>
				</div>
			))}

			{/* Add Tracks Dialog */}
			{selectedPlaylist && (
				<AddTracksDialog
					open={addTracksDialogOpen}
					onOpenChange={setAddTracksDialogOpen}
					playlist={selectedPlaylist}
					accessToken={accessToken}
					onTrackAdded={handleTrackAdded}
				/>
			)}
		</div>
	)
})

export default PlaylistList
