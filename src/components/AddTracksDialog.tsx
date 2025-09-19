import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Cross1Icon, MagnifyingGlassIcon, PlusIcon } from '@radix-ui/react-icons'
import { SpotifyService } from '../services/spotify'
import type { SpotifyTrack, SpotifyPlaylist } from '../types/spotify'

interface AddTracksDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	playlist: SpotifyPlaylist
	accessToken: string
	onTrackAdded: (track: SpotifyTrack) => void
}

const AddTracksDialog = ({ open, onOpenChange, playlist, accessToken, onTrackAdded }: AddTracksDialogProps) => {
	const [query, setQuery] = useState('')
	const [tracks, setTracks] = useState<SpotifyTrack[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [addingTracks, setAddingTracks] = useState<Set<string>>(new Set())

	useEffect(() => {
		const searchTracks = async () => {
			if (!query.trim()) {
				setTracks([])
				return
			}

			try {
				setLoading(true)
				setError(null)
				const spotifyService = new SpotifyService(accessToken)
				const response = await spotifyService.searchTracks(query)
				setTracks(response.tracks.items)
			} catch (err) {
				console.error('Error searching tracks:', err)
				setError('Failed to search tracks')
			} finally {
				setLoading(false)
			}
		}

		const debounceTimeout = setTimeout(searchTracks, 300)
		return () => clearTimeout(debounceTimeout)
	}, [query, accessToken])

	const handleAddTrack = async (track: SpotifyTrack) => {
		setAddingTracks(prev => new Set([...prev, track.id]))

		try {
			const spotifyService = new SpotifyService(accessToken)
			await spotifyService.addTrackToPlaylist(playlist.id, track.uri)

			onTrackAdded(track)

			// Remove the track from search results after adding
			setTracks(prev => prev.filter(t => t.id !== track.id))
		} catch (err) {
			console.error('Error adding track:', err)
			setError('Failed to add track to playlist')
		} finally {
			setAddingTracks(prev => {
				const newSet = new Set(prev)
				newSet.delete(track.id)
				return newSet
			})
		}
	}

	// Reset state when dialog closes
	useEffect(() => {
		if (!open) {
			setQuery('')
			setTracks([])
			setError(null)
			setAddingTracks(new Set())
		}
	}, [open])

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
				<Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-scale-in">
					{/* Header */}
					<div className="flex items-center justify-between p-6 border-b border-gray-200">
						<div>
							<Dialog.Title className="text-lg font-semibold text-gray-900">
								Add tracks to "{playlist.name}"
							</Dialog.Title>
							<Dialog.Description className="text-sm text-gray-600 mt-1">
								Search and add tracks to your playlist
							</Dialog.Description>
						</div>
						<Dialog.Close asChild>
							<button
								type="button"
								className="p-2 hover:bg-gray-100 rounded-md transition-smooth hover-scale"
								aria-label="Close"
							>
								<Cross1Icon className="w-4 h-4" />
							</button>
						</Dialog.Close>
					</div>

					{/* Search Section */}
					<div className="p-6 border-b border-gray-200">
						<div className="relative">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
							</div>
							<input
								type="text"
								placeholder="Search for tracks..."
								value={query}
								onChange={e => setQuery(e.target.value)}
								className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-smooth"
							/>
							<div className="absolute inset-y-0 right-0 pr-3 flex items-center">
								{/* Spotify Logo */}
								<svg className='w-5 h-5 text-green-600' viewBox='0 0 24 24' fill='currentColor' aria-label="Spotify">
									<title>Search on Spotify</title>
									<path d='M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.305-1.76-8.786-.963-.335.077-.67-.133-.746-.469-.077-.336.132-.67.469-.746 3.809-.871 7.077-.496 9.713 1.115.294.18.386.563.207.856zm1.223-2.723c-.226.367-.706.482-1.073.257-2.687-1.652-6.785-2.131-9.965-1.166-.413.125-.849-.106-.973-.518-.125-.413.106-.849.518-.973 3.632-1.102 8.147-.568 11.238 1.327.366.226.481.706.255 1.073zm.105-2.835C14.692 8.50 9.375 8.775 6.297 9.71c-.493.15-1.016-.128-1.166-.622-.149-.493.129-1.016.622-1.165 3.532-1.073 9.404-.865 13.115 1.338.445.264.590.837.326 1.282-.264.444-.838.590-1.282.326z' />
								</svg>
							</div>
						</div>
					</div>

					{/* Content */}
					<div className="flex-1 overflow-y-auto p-6">
						{loading && (
							<div className='flex justify-center py-8 animate-fade-in'>
								<div className='spinner h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full' />
							</div>
						)}

						{error && (
							<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 animate-slide-down'>{error}</div>
						)}

						{/* Search Results */}
						<div className="space-y-3">
							{tracks.map((track, index) => (
								<div
									key={track.id}
									className='flex items-center gap-3 p-3 hover:bg-gray-50 rounded-md transition-smooth hover-lift group stagger-item'
									style={{
										animationDelay: `${index * 50}ms`
									}}
								>
									{track.album.images[0] && (
										<img
											src={track.album.images[0].url}
											alt={track.album.name}
											className='w-12 h-12 rounded object-cover flex-shrink-0'
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
									<button
										type="button"
										onClick={() => handleAddTrack(track)}
										disabled={addingTracks.has(track.id)}
										className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth hover-scale opacity-0 group-hover:opacity-100"
									>
										{addingTracks.has(track.id) ? (
											<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" />
										) : (
											<PlusIcon className="w-4 h-4" />
										)}
										{addingTracks.has(track.id) ? 'Adding...' : 'Add'}
									</button>
								</div>
							))}
						</div>

						{query && !loading && tracks.length === 0 && (
							<div className='text-center text-gray-500 py-8 animate-fade-in'>No tracks found for "{query}"</div>
						)}

						{!query && (
							<div className='text-center text-gray-500 py-8 animate-fade-in'>Start typing to search for tracks</div>
						)}
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}

export default AddTracksDialog