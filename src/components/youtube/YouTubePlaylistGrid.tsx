import { useEffect, useState } from 'react'
import { YouTubeService } from '../../services/youtube'
import type { YouTubePlaylist, YouTubePlaylistItem } from '../../types/youtube'

interface YouTubePlaylistGridProps {
	accessToken: string
}

const YouTubePlaylistGrid = ({ accessToken }: YouTubePlaylistGridProps) => {
	const [playlists, setPlaylists] = useState<YouTubePlaylist[]>([])
	const [playlistItems, setPlaylistItems] = useState<Record<string, YouTubePlaylistItem[]>>({})
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchPlaylistItems = async (playlistId: string) => {
		try {
			const youtubeService = new YouTubeService(accessToken)
			const response = await youtubeService.getPlaylistItems(playlistId)
			setPlaylistItems(prev => ({
				...prev,
				[playlistId]: response.items,
			}))
		} catch (err) {
			console.error('Error fetching playlist items:', err)
		}
	}

	useEffect(() => {
		const fetchPlaylists = async () => {
			try {
				setLoading(true)
				const youtubeService = new YouTubeService(accessToken)
				const response = await youtubeService.getCurrentUserPlaylists()
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
				<div className='animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full' />
			</div>
		)
	}

	if (error) {
		return <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>{error}</div>
	}

	return (
		<div className='space-y-6'>
			<h2 className='text-2xl font-bold text-gray-900'>Your YouTube Playlists</h2>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{playlists.map(playlist => (
					<div
						key={playlist.id}
						className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow'
					>
						{playlist.snippet.thumbnails.high && (
							<img
								src={playlist.snippet.thumbnails.high.url}
								alt={playlist.snippet.title}
								className='w-full h-48 object-cover'
							/>
						)}
						<div className='p-4'>
							<h3 className='font-semibold text-lg text-gray-900 mb-2 truncate'>{playlist.snippet.title}</h3>
							<p className='text-gray-600 text-sm mb-2 line-clamp-2'>{playlist.snippet.description}</p>
							<div className='flex justify-between items-center text-sm text-gray-500'>
								<span>{playlist.contentDetails.itemCount} videos</span>
								<span>By {playlist.snippet.channelTitle}</span>
							</div>
							<details
								className='mt-4'
								onToggle={e => {
									if (e.currentTarget.open && !playlistItems[playlist.id]) {
										fetchPlaylistItems(playlist.id)
									}
								}}
							>
								<summary className='cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900'>
									View Videos
								</summary>
								<div className='mt-2 space-y-1'>
									{playlistItems[playlist.id]?.map(item => (
										<div key={item.id} className='text-sm text-gray-600 pl-2'>
											{item.snippet.title}
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

export default YouTubePlaylistGrid
