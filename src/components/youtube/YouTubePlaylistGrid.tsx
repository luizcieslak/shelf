import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
	CheckCircledIcon,
	DotsVerticalIcon,
	ExclamationTriangleIcon,
	Link2Icon,
	UpdateIcon,
} from '@radix-ui/react-icons'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { SpotifyService } from '../../services/spotify'
import { YouTubeService } from '../../services/youtube'
import { useStores } from '../../stores/StoreContext'
import type { YouTubePlaylist, YouTubePlaylistItem } from '../../types/youtube'
import { TokenExpiredError } from '../../utils/apiErrors'
import { getYouTubeErrorMessage } from '../../utils/youtubeErrors'

interface YouTubePlaylistGridProps {
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

const YouTubePlaylistGrid = observer(({ accessToken }: YouTubePlaylistGridProps) => {
	const { authStore, playlistStore } = useStores()
	const [playlists, setPlaylists] = useState<YouTubePlaylist[]>([])
	const [playlistItems, setPlaylistItems] = useState<Record<string, YouTubePlaylistItem[]>>({})
	const [expandedPlaylists, setExpandedPlaylists] = useState<Set<string>>(new Set())
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [transferProgress, setTransferProgress] = useState<Record<string, TransferProgress[]>>({})
	const [transferringPlaylist, setTransferringPlaylist] = useState<string | null>(null)
	const [successfulTransfers, setSuccessfulTransfers] = useState<Set<string>>(new Set())

	const togglePlaylistExpanded = async (playlistId: string) => {
		setExpandedPlaylists(prev => {
			const newSet = new Set(prev)
			if (newSet.has(playlistId)) {
				newSet.delete(playlistId)
			} else {
				newSet.add(playlistId)
				// Fetch tracks if not already loaded
				if (!playlistItems[playlistId]) {
					fetchPlaylistItems(playlistId)
				}
			}
			return newSet
		})
	}

	const fetchPlaylistItems = async (playlistId: string) => {
		if (playlistItems[playlistId]) return playlistItems[playlistId]

		try {
			const youtubeService = new YouTubeService(accessToken)
			const response = await youtubeService.getAllPlaylistItems(playlistId)
			setPlaylistItems(prev => ({
				...prev,
				[playlistId]: response.items,
			}))
			return response.items
		} catch (err) {
			console.error('Error fetching playlist items:', err)

			// Handle token expiry
			if (err instanceof TokenExpiredError) {
				authStore.handleTokenExpiry(err.platform, err.message)
			}

			return []
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

	const transferToSpotify = async (playlist: YouTubePlaylist) => {
		if (!authStore.spotify?.accessToken) {
			console.error('No Spotify access token available')
			return
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
			const spotifyService = new SpotifyService(authStore.spotify.accessToken)

			// Step 1: Create playlist
			const createdPlaylist = await spotifyService.createPlaylist(
				playlist.snippet.title,
				playlist.snippet.description,
			)
			const playlistUrl = createdPlaylist.external_urls.spotify

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

			// Step 2: Fetch all YouTube playlist items
			const items = await fetchPlaylistItems(playlist.id)

			if (items.length === 0) {
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

			// Step 3: Search for each track on Spotify and collect URIs
			let successCount = 0
			const totalTracks = items.length
			const trackUris: string[] = []

			for (let i = 0; i < items.length; i++) {
				const item = items[i]
				try {
					const searchQuery = item.snippet.title
					const searchResult = await spotifyService.searchTracks(searchQuery, 1)

					if (searchResult.tracks.items.length > 0) {
						trackUris.push(searchResult.tracks.items[0].uri)
						successCount++
					}

					// Update progress after each track search
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
								message: `Searching tracks: ${i + 1}/${totalTracks} (${successCount} found)`,
								tracksAdded: successCount,
								totalTracks: totalTracks,
							},
						],
					}))
				} catch (err) {
					console.error(`Failed to find track: ${item.snippet.title}`, err)

					// Handle token expiry
					if (err instanceof TokenExpiredError) {
						authStore.handleTokenExpiry(err.platform, err.message)
						setTransferringPlaylist(null)
						return
					}
				}
			}

			// Step 4: Add all found tracks to Spotify playlist
			if (trackUris.length > 0) {
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
							message: `Adding ${trackUris.length} tracks to Spotify...`,
							tracksAdded: successCount,
							totalTracks: totalTracks,
						},
					],
				}))

				await spotifyService.addTracksToPlaylist(createdPlaylist.id, trackUris)
			}

			// Step 5: Show final result
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
						message: `Added tracks: ${successCount}/${totalTracks}`,
					},
					{
						step: 'completed',
						status: finalStatus,
						message: `Transfer complete: ${successCount}/${totalTracks} tracks`,
						tracksAdded: successCount,
						totalTracks: totalTracks,
						playlistUrl: playlistUrl,
					},
				],
			}))

			if (successCount > 0) {
				setSuccessfulTransfers(prev => new Set([...prev, playlist.id]))
			}
		} catch (err) {
			console.error('Transfer failed:', err)

			// Handle token expiry
			if (err instanceof TokenExpiredError) {
				authStore.handleTokenExpiry(err.platform, err.message)
				setTransferringPlaylist(null)
				return
			}

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

	// Helper to check if a playlist is synced (from database)
	const isPlaylistSyncedInDB = (youtubePlaylistId: string): boolean => {
		const dbRecord = playlistStore.playlists.find(
			p => p.platform === 'google' && p.platform_id === youtubePlaylistId,
		)
		return dbRecord ? (dbRecord.synced_with?.length || 0) > 0 : false
	}

	useEffect(() => {
		const fetchPlaylists = async () => {
			try {
				setLoading(true)
				const youtubeService = new YouTubeService(accessToken)
				const response = await youtubeService.getCurrentUserPlaylists()
				setPlaylists(response.items)

				// Fetch synced playlists from database
				await playlistStore.fetchPlaylists('google')
			} catch (err) {
				console.error('Error fetching playlists:', err)

				// Handle token expiry
				if (err instanceof TokenExpiredError) {
					authStore.handleTokenExpiry(err.platform, err.message)
					return // Don't set error, just let the auth system handle it
				}

				setError(getYouTubeErrorMessage(err))
			} finally {
				setLoading(false)
			}
		}

		fetchPlaylists()
	}, [accessToken, playlistStore])

	if (loading) {
		return (
			<div className='flex justify-center items-center py-8'>
				<div className='animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full' />
			</div>
		)
	}

	if (error) {
		const isQuotaError = error.includes('quota')
		return (
			<div
				className={`${
					isQuotaError
						? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
						: 'bg-red-50 border border-red-200 text-red-700'
				} px-4 py-3 rounded-md`}
			>
				{error}
			</div>
		)
	}

	return (
		<div className='max-w-[600px] mx-auto space-y-4'>
			<h2 className='text-2xl font-bold text-gray-900 mb-6'>Your YouTube Playlists</h2>
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
										{playlist.snippet.title}
									</h3>
									{/* Platform Icons */}
									<div className='flex-shrink-0 flex items-center gap-1'>
										{/* YouTube Icon */}
										<svg className='w-4 h-4' viewBox='0 0 24 24' aria-label='YouTube'>
											<title>YouTube</title>
											<path
												fill='#FF0000'
												d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'
											/>
										</svg>

										{/* Sync Link Icon - Show if synced in DB */}
										{isPlaylistSyncedInDB(playlist.id) && (
											<span title='Synced with another platform'>
												<Link2Icon className='w-3 h-3 text-blue-600' aria-hidden='true' />
												<span className='sr-only'>Synced</span>
											</span>
										)}

										{/* Spotify Icon - Show if successfully transferred OR synced in DB */}
										{(successfulTransfers.has(playlist.id) || isPlaylistSyncedInDB(playlist.id)) && (
											<svg
												className='w-4 h-4 text-green-600'
												viewBox='0 0 24 24'
												fill='currentColor'
												aria-label='Spotify'
											>
												<title>Spotify</title>
												<path d='M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.305-1.76-8.786-.963-.335.077-.67-.133-.746-.469-.077-.336.132-.67.469-.746 3.809-.871 7.077-.496 9.713 1.115.294.18.386.563.207.856zm1.223-2.723c-.226.367-.706.482-1.073.257-2.687-1.652-6.785-2.131-9.965-1.166-.413.125-.849-.106-.973-.518-.125-.413.106-.849.518-.973 3.632-1.102 8.147-.568 11.238 1.327.366.226.481.706.255 1.073zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.493.15-1.016-.128-1.166-.622-.149-.493.129-1.016.622-1.165 3.532-1.073 9.404-.865 13.115 1.338.445.264.590.837.326 1.282-.264.444-.838.590-1.282.326z' />
											</svg>
										)}
									</div>
								</div>
								<p className='text-sm text-gray-600 mb-2'>{playlist.contentDetails?.itemCount ?? 0} tracks</p>
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
											onClick={() => transferToSpotify(playlist)}
											disabled={transferringPlaylist === playlist.id}
										>
											<svg className='w-4 h-4 text-green-600' viewBox='0 0 24 24' fill='currentColor'>
												<title>Spotify logo</title>
												<path d='M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.305-1.76-8.786-.963-.335.077-.67-.133-.746-.469-.077-.336.132-.67.469-.746 3.809-.871 7.077-.496 9.713 1.115.294.18.386.563.207.856zm1.223-2.723c-.226.367-.706.482-1.073.257-2.687-1.652-6.785-2.131-9.965-1.166-.413.125-.849-.106-.973-.518-.125-.413.106-.849.518-.973 3.632-1.102 8.147-.568 11.238 1.327.366.226.481.706.255 1.073zm.105-2.835C14.692 8.50 9.375 8.775 6.297 9.71c-.493.15-1.016-.128-1.166-.622-.149-.493.129-1.016.622-1.165 3.532-1.073 9.404-.865 13.115 1.338.445.264.590.837.326 1.282-.264.444-.838.590-1.282.326z' />
											</svg>
											Transfer to Spotify
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
												</a>
											)}
										</div>
									))}
								</div>
							</div>
						)}

						{/* Show/Hide tracks button */}
						<button
							type='button'
							onClick={() => togglePlaylistExpanded(playlist.id)}
							className='text-sm text-blue-600 hover:text-blue-800 font-medium transition-smooth hover-scale flex items-center gap-1'
						>
							<span>{expandedPlaylists.has(playlist.id) ? 'Hide tracks' : 'Show tracks'}</span>
							<svg
								className={`w-4 h-4 transition-transform ${expandedPlaylists.has(playlist.id) ? 'rotate-180' : ''}`}
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
							>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
							</svg>
						</button>

						{/* Track List */}
						{expandedPlaylists.has(playlist.id) && (
							<div className='mt-3 space-y-2 max-h-80 overflow-y-auto overflow-x-hidden'>
								{playlistItems[playlist.id]?.map((item, index) => (
									<div
										key={item.id}
										className='flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-smooth hover-lift stagger-item'
										style={{ animationDelay: `${index * 50}ms` }}
									>
										{item.snippet.thumbnails?.default && (
											<img
												src={item.snippet.thumbnails.default.url}
												alt={item.snippet.title}
												className='w-10 h-10 rounded object-cover flex-shrink-0'
												style={{ borderRadius: '5px' }}
											/>
										)}
										<div className='flex-1 min-w-0'>
											<div
												className='font-semibold text-gray-900 truncate'
												style={{ fontSize: '14px', fontWeight: 600 }}
											>
												{item.snippet.title}
											</div>
											<div className='text-gray-600 truncate' style={{ fontSize: '13px', fontWeight: 500 }}>
												{item.snippet.videoOwnerChannelTitle || 'Unknown artist'}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			))}
		</div>
	)
})

export default YouTubePlaylistGrid
