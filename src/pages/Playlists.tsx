import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import PlaylistList from '../components/PlaylistList'
import YouTubePlaylistGrid from '../components/youtube/YouTubePlaylistGrid'
import { useStores } from '../stores/StoreContext'
import type { Platform } from '../types/platform'

const Playlists = observer(() => {
	const { authStore } = useStores()

	// Auto-select first connected platform, or default to Spotify
	const getDefaultPlatform = (): Platform => {
		if (authStore.spotify?.accessToken) return 'spotify'
		if (authStore.google?.accessToken) return 'google'
		if (authStore.apple?.accessToken) return 'apple'
		return 'spotify'
	}

	const [selectedPlatform, setSelectedPlatform] = useState<Platform>(getDefaultPlatform())

	// Available platforms (those that have access tokens)
	const availablePlatforms = authStore.connectedPlatforms.filter(platform => {
		return authStore[platform]?.accessToken
	})

	const renderPlatformSelector = () => {
		if (availablePlatforms.length === 0) {
			return null
		}

		// Platforms that are NOT connected yet
		const disconnectedPlatforms: Platform[] = []
		if (!authStore.spotify?.accessToken) disconnectedPlatforms.push('spotify')
		if (!authStore.google?.accessToken) disconnectedPlatforms.push('google')

		return (
			<div className='mb-6 flex flex-col sm:flex-row gap-2 sm:items-center'>
				<div className='flex gap-2 flex-wrap'>
					{availablePlatforms.includes('spotify') && (
						<button
							type='button'
							onClick={() => setSelectedPlatform('spotify')}
							className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
								selectedPlatform === 'spotify'
									? 'bg-green-600 text-white'
									: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
							}`}
						>
							Spotify Playlists
						</button>
					)}
					{availablePlatforms.includes('google') && (
						<button
							type='button'
							onClick={() => setSelectedPlatform('google')}
							className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
								selectedPlatform === 'google'
									? 'bg-red-600 text-white'
									: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
							}`}
						>
							YouTube Playlists
						</button>
					)}
				</div>

				{/* Add Platform Button - Only show if there are platforms to connect */}
				{disconnectedPlatforms.length > 0 && (
					<div className='sm:ml-auto'>
						<div className='relative group'>
							<button
								type='button'
								className='w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors'
							>
								+ Connect Platform
							</button>
							<div className='absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10'>
								<div className='py-1'>
									{disconnectedPlatforms.includes('spotify') && (
										<button
											type='button'
											onClick={() => authStore.connectSpotify()}
											disabled={authStore.spotify?.isLoading}
											className='w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50'
										>
											<svg className='w-5 h-5 text-green-600' viewBox='0 0 24 24' fill='currentColor'>
												<path d='M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.305-1.76-8.786-.963-.335.077-.67-.133-.746-.469-.077-.336.132-.67.469-.746 3.809-.871 7.077-.496 9.713 1.115.294.18.386.563.207.856zm1.223-2.723c-.226.367-.706.482-1.073.257-2.687-1.652-6.785-2.131-9.965-1.166-.413.125-.849-.106-.973-.518-.125-.413.106-.849.518-.973 3.632-1.102 8.147-.568 11.238 1.327.366.226.481.706.255 1.073zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.493.15-1.016-.128-1.166-.622-.149-.493.129-1.016.622-1.165 3.532-1.073 9.404-.865 13.115 1.338.445.264.590.837.326 1.282-.264.444-.838.590-1.282.326z' />
											</svg>
											<span className='text-gray-700'>
												{authStore.spotify?.isLoading ? 'Connecting...' : 'Connect Spotify'}
											</span>
										</button>
									)}
									{disconnectedPlatforms.includes('google') && (
										<button
											type='button'
											onClick={() => authStore.connectGoogle()}
											disabled={authStore.google?.isLoading}
											className='w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50'
										>
											<svg className='w-5 h-5 text-red-600' viewBox='0 0 24 24' fill='currentColor'>
												<path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' />
											</svg>
											<span className='text-gray-700'>
												{authStore.google?.isLoading ? 'Connecting...' : 'Connect YouTube'}
											</span>
										</button>
									)}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		)
	}

	const renderPlaylistView = () => {
		if (availablePlatforms.length === 0) {
			return (
				<div className='text-center py-12 bg-white rounded-lg shadow p-8'>
					<svg
						className='w-16 h-16 mx-auto mb-4 text-gray-400'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
						/>
					</svg>
					<h2 className='text-xl font-semibold text-gray-900 mb-2'>Connect a Music Platform</h2>
					<p className='text-gray-600 mb-6'>Connect Spotify or YouTube to view and manage your playlists</p>
					<div className='flex gap-3 justify-center'>
						<button
							type='button'
							onClick={() => authStore.connectSpotify()}
							disabled={authStore.spotify?.isLoading}
							className='inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50'
						>
							<svg className='w-5 h-5 mr-2' viewBox='0 0 24 24' fill='currentColor'>
								<path d='M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.305-1.76-8.786-.963-.335.077-.67-.133-.746-.469-.077-.336.132-.67.469-.746 3.809-.871 7.077-.496 9.713 1.115.294.18.386.563.207.856zm1.223-2.723c-.226.367-.706.482-1.073.257-2.687-1.652-6.785-2.131-9.965-1.166-.413.125-.849-.106-.973-.518-.125-.413.106-.849.518-.973 3.632-1.102 8.147-.568 11.238 1.327.366.226.481.706.255 1.073zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.493.15-1.016-.128-1.166-.622-.149-.493.129-1.016.622-1.165 3.532-1.073 9.404-.865 13.115 1.338.445.264.590.837.326 1.282-.264.444-.838.590-1.282.326z' />
							</svg>
							{authStore.spotify?.isLoading ? 'Connecting...' : 'Connect Spotify'}
						</button>
						<button
							type='button'
							onClick={() => authStore.connectGoogle()}
							disabled={authStore.google?.isLoading}
							className='inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50'
						>
							<svg className='w-5 h-5 mr-2' viewBox='0 0 24 24' fill='white'>
								<path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' />
							</svg>
							{authStore.google?.isLoading ? 'Connecting...' : 'Connect YouTube'}
						</button>
					</div>
				</div>
			)
		}

		// Render selected platform's playlists
		if (selectedPlatform === 'spotify' && authStore.spotify?.accessToken) {
			return <PlaylistList accessToken={authStore.spotify.accessToken} />
		}

		if (selectedPlatform === 'google' && authStore.google?.accessToken) {
			return <YouTubePlaylistGrid accessToken={authStore.google.accessToken} />
		}

		return null
	}

	return (
		<div className='min-h-screen bg-gray-50 p-4 sm:p-8'>
			<div className='max-w-7xl mx-auto'>
				{renderPlatformSelector()}
				{renderPlaylistView()}
			</div>
		</div>
	)
})

export default Playlists
