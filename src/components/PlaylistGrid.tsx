import { useEffect, useState } from 'react'
import { SpotifyService } from '../services/spotify'
import type { SpotifyPlaylist, SpotifyTrack } from '../types/spotify'

interface PlaylistGridProps {
	accessToken: string
}

const PlaylistGrid = ({ accessToken }: PlaylistGridProps) => {
	const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
	const [playlistTracks, setPlaylistTracks] = useState<Record<string, SpotifyTrack[]>>({})
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchPlaylistTracks = async (playlistId: string) => {
		try {
			const spotifyService = new SpotifyService(accessToken)
			const response = await spotifyService.getPlaylistTracks(playlistId)
			console.log('tracks respoonse:', response)
			setPlaylistTracks(prev => ({
				...prev,
				[playlistId]: response.items.map(item => item.track),
			}))
		} catch (err) {
			console.error('Error fetching playlist tracks:', err)
		}
	}

	useEffect(() => {
		const fetchPlaylists = async () => {
			try {
				setLoading(true)
				const spotifyService = new SpotifyService(accessToken)
				const response = await spotifyService.getCurrentUserPlaylists()
				setPlaylists(response.items)
				console.log('playlists:', response.items)
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
		<div className='space-y-6'>
			<h2 className='text-2xl font-bold text-gray-900'>Your Spotify Playlists</h2>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{playlists.map(playlist => (
					<div
						key={playlist.id}
						className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow'
					>
						{playlist.images[0] && (
							<img src={playlist.images[0].url} alt={playlist.name} className='w-full h-48 object-cover' />
						)}
						<div className='p-4'>
							<h3 className='font-semibold text-lg text-gray-900 mb-2 truncate'>{playlist.name}</h3>
							{playlist.description && (
								<p className='text-gray-600 text-sm mb-2 line-clamp-2'>{playlist.description}</p>
							)}
							<div className='flex justify-between items-center text-sm text-gray-500'>
								<span>{playlist.tracks.total} tracks</span>
								<span>By {playlist.owner.display_name}</span>
							</div>
							<div className='mt-3 flex gap-2'>
								{playlist.public && (
									<span className='inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full'>
										Public
									</span>
								)}
								{playlist.collaborative && (
									<span className='inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full'>
										Collaborative
									</span>
								)}
							</div>
							<details
								className='mt-4'
								onToggle={e => {
									if (e.currentTarget.open && !playlistTracks[playlist.id]) {
										fetchPlaylistTracks(playlist.id)
									}
								}}
							>
								<summary className='cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900'>
									View Tracks
								</summary>
								<div className='mt-4 space-y-3'>
									{playlistTracks[playlist.id]?.map(track => (
										<div
											key={track.id}
											className='bg-gray-50 rounded-lg p-3 flex items-center gap-3 hover:bg-gray-100 transition-colors'
										>
											{track.album.images[0] && (
												<img
													src={track.album.images[0].url}
													alt={track.album.name}
													className='w-12 h-12 rounded-md flex-shrink-0 object-cover'
												/>
											)}
											<div className='min-w-0 flex-1'>
												<div className='font-medium text-gray-900 truncate'>{track.name}</div>
												<div className='text-sm text-gray-500 truncate'>
													{track.artists.map(artist => artist.name).join(', ')}
												</div>
												<div className='text-xs text-gray-400 truncate'>{track.album.name}</div>
											</div>
											<div className='text-xs text-gray-400 flex-shrink-0'>
												{Math.floor(track.duration_ms / 60000)}:
												{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
											</div>
										</div>
									))}
								</div>
							</details>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

export default PlaylistGrid
