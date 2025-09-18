import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
	CheckCircledIcon,
	DotsVerticalIcon,
	ExclamationTriangleIcon,
	UpdateIcon,
	ExternalLinkIcon,
	PlusIcon,
	Link2Icon,
} from '@radix-ui/react-icons'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { SpotifyService } from '../services/spotify'
import { YouTubeService } from '../services/youtube'
import { useStores } from '../stores/StoreContext'
import AddTracksDialog from './AddTracksDialog'
import type { SpotifyPlaylist, SpotifyTrack } from '../types/spotify'

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
			setPlaylists(prev => prev.map(p =>
				p.id === selectedPlaylist.id
					? { ...p, tracks: { ...p.tracks, total: p.tracks.total + 1 } }
					: p
			))

			// If playlist is synced, also add to YouTube
			if (syncStore.isPlaylistLinked(selectedPlaylist.id)) {
				const linkedPlaylist = syncStore.getLinkedPlaylist(selectedPlaylist.id)
				if (linkedPlaylist && authStore.google?.accessToken) {
					try {
						const youtubeService = new YouTubeService(authStore.google.accessToken)
						const searchQuery = `${track.name} ${track.artists.map(a => a.name).join(' ')}`
						await youtubeService.addTrackToPlaylist(linkedPlaylist.youtubePlaylistId, searchQuery)
						syncStore.updateLastSync(selectedPlaylist.id)
					} catch (err) {
						console.error('Failed to sync track to YouTube:', err)
					}
				}
			}
		}
	}

	const handleSyncPlaylist = (playlist: SpotifyPlaylist) => {
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
				}
			}
		}
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
					connectedPlatforms: authStore.connectedPlatforms
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
			<div className='flex justify-center items-center py-8'>
				<div className='animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full' />
			</div>
		)
	}

	if (error) {
		return <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>{error}</div>
	}

	return (
		<div className='max-w-[600px] mx-auto space-y-4'>
			<h2 className='text-2xl font-bold text-gray-900 mb-6'>Your Playlists</h2>

			{playlists.map(playlist => (
				<div
					key={playlist.id}
					className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'
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
											<div className="flex items-center gap-1">
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
										className='p-2 hover:bg-gray-100 rounded-md transition-colors'
										disabled={transferringPlaylist === playlist.id}
									>
										<DotsVerticalIcon className='w-4 h-4 text-gray-600' />
									</button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Portal>
									<DropdownMenu.Content className='bg-white rounded-md shadow-lg border border-gray-200 p-1 min-w-[160px]'>
										<DropdownMenu.Item
											className='px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none flex items-center gap-2'
											onClick={() => handleAddTracks(playlist)}
										>
											<PlusIcon className='w-4 h-4' />
											Add tracks
										</DropdownMenu.Item>

										{/* Show Sync option only for successfully transferred playlists that aren't already synced */}
										{successfulTransfers.has(playlist.id) && !syncStore.isPlaylistLinked(playlist.id) && (
											<DropdownMenu.Item
												className='px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none flex items-center gap-2'
												onClick={() => handleSyncPlaylist(playlist)}
											>
												<Link2Icon className='w-4 h-4' />
												Sync
											</DropdownMenu.Item>
										)}

										<DropdownMenu.Item
											className='px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none flex items-center gap-2'
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
							<div className='mb-4 p-3 bg-gray-50 rounded-md'>
								<div className='space-y-2'>
									{transferProgress[playlist.id].map((progress, index) => (
										<div
											key={`${playlist.id}-${progress.step}-${index}`}
											className='flex items-center gap-2 text-sm'
										>
											{getStatusIcon(progress.status)}
											<span className='text-gray-700'>{progress.message}</span>
											{progress.playlistUrl && progress.step === 'completed' && (
												<a
													href={progress.playlistUrl}
													target='_blank'
													rel='noopener noreferrer'
													className='flex items-center gap-1 text-blue-600 hover:text-blue-800 ml-2'
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
							className='text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors'
						>
							{expandedPlaylist === playlist.id ? 'Hide tracks' : 'Show tracks'}
						</button>

						{/* Expandable Tracks */}
						<div
							className={`overflow-hidden transition-all duration-300 ease-in-out ${
								expandedPlaylist === playlist.id ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
							}`}
						>
							<div className='space-y-3 max-h-80 overflow-y-auto'>
								{playlistTracks[playlist.id]?.map(track => (
									<div
										key={track.id}
										className='flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors'
									>
										{track.album.images[0] && (
											<img
												src={track.album.images[0].url}
												alt={track.album.name}
												className='w-10 h-10 rounded object-cover flex-shrink-0'
												style={{ borderRadius: '5px' }}
											/>
										)}
										<div className='flex-1 min-w-0'>
											<div
												className='font-semibold text-gray-900 truncate'
												style={{ fontSize: '14px', fontWeight: 600 }}
											>
												{track.name}
											</div>
											<div className='text-gray-600 truncate' style={{ fontSize: '13px', fontWeight: 500 }}>
												{track.artists.map(artist => artist.name).join(', ')}
											</div>
										</div>
									</div>
								))}
							</div>
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
