import { useEffect, useState } from 'react'
import { YouTubeService } from '../../services/youtube'
import type { YouTubeSearchItem } from '../../types/youtube'

interface YouTubeSearchProps {
	accessToken: string
}

const YouTubeSearch = ({ accessToken }: YouTubeSearchProps) => {
	const [query, setQuery] = useState('')
	const [videos, setVideos] = useState<YouTubeSearchItem[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const searchVideos = async () => {
			if (!query.trim()) {
				setVideos([])
				return
			}

			try {
				setLoading(true)
				setError(null)
				const youtubeService = new YouTubeService(accessToken)
				const response = await youtubeService.searchTracks(query)
				setVideos(response.items)
			} catch (err) {
				console.error('Error searching videos:', err)
				setError('Failed to search videos')
			} finally {
				setLoading(false)
			}
		}

		const debounceTimeout = setTimeout(searchVideos, 300)
		return () => clearTimeout(debounceTimeout)
	}, [query, accessToken])

	return (
		<div className='space-y-6'>
			<div className='max-w-2xl'>
				<input
					type='text'
					placeholder='Search for music videos...'
					value={query}
					onChange={e => setQuery(e.target.value)}
					className='w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent'
				/>
			</div>

			{loading && (
				<div className='flex justify-center'>
					<div className='animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full' />
				</div>
			)}

			{error && (
				<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>{error}</div>
			)}

			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{videos.map(video => (
					<div
						key={video.id.videoId}
						className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow'
					>
						{video.snippet.thumbnails.high && (
							<img
								src={video.snippet.thumbnails.high.url}
								alt={video.snippet.title}
								className='w-full h-48 object-cover'
							/>
						)}
						<div className='p-4'>
							<h3 className='font-semibold text-lg text-gray-900 mb-2 truncate'>{video.snippet.title}</h3>
							<p className='text-gray-600 text-sm mb-2 line-clamp-2'>{video.snippet.description}</p>
							<div className='text-sm text-gray-500'>Channel: {video.snippet.channelTitle}</div>
							<a
								href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
								target='_blank'
								rel='noopener noreferrer'
								className='mt-3 inline-block text-red-600 hover:text-red-800 text-sm'
							>
								Watch on YouTube →
							</a>
						</div>
					</div>
				))}
			</div>

			{query && !loading && videos.length === 0 && (
				<div className='text-center text-gray-500'>No videos found for "{query}"</div>
			)}
		</div>
	)
}

export default YouTubeSearch
