import { observer } from 'mobx-react-lite'
import LoginScreen from './components/LoginScreen'
import PlaylistGrid from './components/PlaylistGrid'
import { useStores } from './stores/StoreContext'

const App = observer(() => {
	const { authStore } = useStores()

	if (authStore.isAuthenticated) {
		return (
			<div className='min-h-screen bg-gray-50'>
				<div className='max-w-7xl mx-auto py-8 px-4'>
					{/* Header */}
					<div className='flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-md'>
						<div>
							<h1 className='text-3xl font-bold text-gray-900'>Welcome to Shelf!</h1>
							<p className='mt-1 text-gray-600'>
								Signed in as:{' '}
								<span className='font-semibold text-blue-600'>
									{authStore.user?.email || authStore.user?.username}
								</span>
							</p>
						</div>
						<button
							type='button'
							onClick={() => authStore.logout()}
							className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
						>
							Sign Out
						</button>
					</div>

					{/* Error display */}
					{authStore.error && (
						<div className='mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>
							<p>{authStore.error}</p>
							<button
								type='button'
								onClick={() => authStore.clearError()}
								className='text-sm underline hover:no-underline'
							>
								Dismiss
							</button>
						</div>
					)}

					{/* Content */}
					{authStore.hasSpotifyToken ? (
						<PlaylistGrid />
					) : (
						<div className='bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md'>
							<p>
								<strong>Note:</strong> To view your Spotify playlists, please sign in with Spotify.
							</p>
						</div>
					)}
				</div>
			</div>
		)
	}

	return <LoginScreen />
})

export default App
