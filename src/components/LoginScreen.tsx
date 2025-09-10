import { observer } from 'mobx-react-lite'
import { useStores } from '../stores/StoreContext'

const LoginScreen = observer(() => {
	const { authStore } = useStores()

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
			<div className='max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg'>
				<div className='text-center'>
					<h2 className='text-3xl font-bold text-gray-900'>Welcome to Shelf</h2>
					<p className='mt-2 text-gray-600'>Connect your music platforms to transfer playlists</p>
				</div>

				<div className='space-y-4'>
					{/* Spotify Connect */}
					<button
						type='button'
						onClick={() => authStore.connectSpotify()}
						disabled={authStore.spotify?.isLoading}
						className='w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors relative'
					>
						<svg className='w-5 h-5 mr-3' viewBox='0 0 24 24' fill='currentColor'>
							<path d='M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.305-1.76-8.786-.963-.335.077-.67-.133-.746-.469-.077-.336.132-.67.469-.746 3.809-.871 7.077-.496 9.713 1.115.294.18.386.563.207.856zm1.223-2.723c-.226.367-.706.482-1.073.257-2.687-1.652-6.785-2.131-9.965-1.166-.413.125-.849-.106-.973-.518-.125-.413.106-.849.518-.973 3.632-1.102 8.147-.568 11.238 1.327.366.226.481.706.255 1.073zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.493.15-1.016-.128-1.166-.622-.149-.493.129-1.016.622-1.165 3.532-1.073 9.404-.865 13.115 1.338.445.264.590.837.326 1.282-.264.444-.838.590-1.282.326z' />
						</svg>
						{authStore.spotify?.isLoading ? 'Connecting...' : 'Connect Spotify'}
						{authStore.spotify && (
							<span className='absolute -top-1 -right-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded-full'>
								✓
							</span>
						)}
					</button>

					{/* Google/YouTube Music Connect */}
					<button
						type='button'
						onClick={() => authStore.connectGoogle()}
						disabled={authStore.google?.isLoading}
						className='w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors relative'
					>
						<svg className='w-5 h-5 mr-3' viewBox='0 0 24 24'>
							<path
								fill='#4285F4'
								d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
							/>
							<path
								fill='#34A853'
								d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
							/>
							<path
								fill='#FBBC05'
								d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
							/>
							<path
								fill='#EA4335'
								d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
							/>
						</svg>
						{authStore.google?.isLoading ? 'Connecting...' : 'Connect YouTube Music'}
						{authStore.google && (
							<span className='absolute -top-1 -right-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full'>
								✓
							</span>
						)}
					</button>

					{/* Apple Music Connect */}
					<button
						type='button'
						onClick={() => authStore.connectApple()}
						disabled={true}
						className='w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors relative'
					>
						<svg className='w-5 h-5 mr-3' viewBox='0 0 24 24' fill='currentColor'>
							<path d='M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z' />
						</svg>
						Connect Apple Music
						<span className='absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full'>
							Soon
						</span>
					</button>

					<p className='text-center text-sm text-gray-500'>
						Connect your platforms to start transferring playlists between services
					</p>
				</div>

				{/* Show platform-specific errors */}
				{authStore.spotify?.error && (
					<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm'>
						<p>Spotify: {authStore.spotify.error}</p>
						<button
							type='button'
							onClick={() => authStore.clearError('spotify')}
							className='text-sm underline hover:no-underline'
						>
							Dismiss
						</button>
					</div>
				)}

				{authStore.google?.error && (
					<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm'>
						<p>Google: {authStore.google.error}</p>
						<button
							type='button'
							onClick={() => authStore.clearError('google')}
							className='text-sm underline hover:no-underline'
						>
							Dismiss
						</button>
					</div>
				)}

				<div className='text-center text-xs text-gray-500'>
					By connecting, you agree to our Terms of Service and Privacy Policy.
				</div>
			</div>
		</div>
	)
})

export default LoginScreen
