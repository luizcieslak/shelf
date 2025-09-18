import { useEffect, useState } from 'react'
import { SpotifyService } from '../../services/spotify'
import type { SpotifyTrack } from '../../types/spotify'

interface SearchProps {
	accessToken: string
}

const Search = ({ accessToken }: SearchProps) => {
	const [query, setQuery] = useState('')
	const [tracks, setTracks] = useState<SpotifyTrack[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

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

	return (
		<div className='space-y-6'>
			<div className='max-w-2xl'>
				<input
					type='text'
					placeholder='Search for tracks...'
					value={query}
					onChange={e => setQuery(e.target.value)}
					className='w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent'
				/>
			</div>

			{loading && (
				<div className='flex justify-center'>
					<div className='animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full' />
				</div>
			)}

			{error && (
				<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>{error}</div>
			)}

			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{tracks.map(track => (
					<div
						key={track.id}
						className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow'
					>
						<div className='relative'>
							{track.album.images[0] && (
								<img
									src={track.album.images[0].url}
									alt={track.album.name}
									className='w-full h-48 object-cover'
								/>
							)}
							<div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4'>
								<div className='text-white font-semibold truncate'>{track.name}</div>
								<div className='text-gray-200 text-sm truncate'>
									{track.artists.map(artist => artist.name).join(', ')}
								</div>
							</div>
						</div>
						<div className='p-4'>
							<div className='text-sm text-gray-600 truncate'>Album: {track.album.name}</div>
							<div className='text-sm text-gray-500'>
								Duration: {Math.floor(track.duration_ms / 60000)}:
								{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
							</div>
						</div>
					</div>
				))}
			</div>

			{query && !loading && tracks.length === 0 && (
				<div className='text-center text-gray-500'>No tracks found for "{query}"</div>
			)}
		</div>
	)
}

export default Search
