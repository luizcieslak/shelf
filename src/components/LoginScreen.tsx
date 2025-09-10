import { observer } from 'mobx-react-lite'
import { useStores } from '../stores/StoreContext'

const LoginScreen = observer(() => {
	const { authStore } = useStores()

	const handleSpotifyLogin = () => {
		authStore.loginWithSpotify()
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
			<div className='max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg'>
				<div className='text-center'>
					<h2 className='text-3xl font-bold text-gray-900'>Welcome to Shelf</h2>
					<p className='mt-2 text-gray-600'>Sign in to your account</p>
				</div>

				{authStore.error && (
					<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm'>
						{authStore.error}
					</div>
				)}

				<div className='space-y-4'>
					{/* Spotify Sign In */}
					<button
						type='button'
						onClick={handleSpotifyLogin}
						disabled={authStore.isLoading}
						className='w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
					>
						<svg className='w-5 h-5 mr-3' viewBox='0 0 24 24' fill='currentColor'>
							<path d='M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.305-1.76-8.786-.963-.335.077-.67-.133-.746-.469-.077-.336.132-.67.469-.746 3.809-.871 7.077-.496 9.713 1.115.294.18.386.563.207.856zm1.223-2.723c-.226.367-.706.482-1.073.257-2.687-1.652-6.785-2.131-9.965-1.166-.413.125-.849-.106-.973-.518-.125-.413.106-.849.518-.973 3.632-1.102 8.147-.568 11.238 1.327.366.226.481.706.255 1.073zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.493.15-1.016-.128-1.166-.622-.149-.493.129-1.016.622-1.165 3.532-1.073 9.404-.865 13.115 1.338.445.264.590.837.326 1.282-.264.444-.838.590-1.282.326z' />
						</svg>
						Sign in with Spotify
					</button>

					<p className='text-center text-sm text-gray-500'>
						Sign in with Spotify to view and manage your playlists
					</p>
				</div>

				{authStore.isLoading && (
					<div className='text-center'>
						<div className='inline-flex items-center px-4 py-2 text-sm text-gray-600'>
							<svg className='animate-spin -ml-1 mr-3 h-4 w-4' viewBox='0 0 24 24'>
								<circle
									cx='12'
									cy='12'
									r='10'
									stroke='currentColor'
									strokeWidth='4'
									fill='none'
									className='opacity-25'
								/>
								<path
									fill='currentColor'
									d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
									className='opacity-75'
								/>
							</svg>
							Signing in...
						</div>
					</div>
				)}

				<div className='text-center text-xs text-gray-500'>
					By signing in, you agree to our Terms of Service and Privacy Policy.
				</div>
			</div>
		</div>
	)
})

export default LoginScreen
