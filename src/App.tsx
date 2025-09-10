import PocketBase from 'pocketbase'
import { useState } from 'react'
import LoginScreen from './components/LoginScreen'
import PlaylistGrid from './components/PlaylistGrid'
import type { AuthResponse, User } from './types/auth'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090')

function App() {
	const [user, setUser] = useState<User | null>(pb.authStore.model)
	const [authData, setAuthData] = useState<AuthResponse | null>(null)

	const handleLogin = (authResponse: AuthResponse) => {
		setUser(authResponse.record)
		setAuthData(authResponse)
	}

	const handleLogout = () => {
		pb.authStore.clear()
		setUser(null)
		setAuthData(null)
	}

	if (user) {
		const spotifyAccessToken = authData?.meta?.accessToken

		return (
			<div className='min-h-screen bg-gray-50'>
				<div className='max-w-7xl mx-auto py-8 px-4'>
					{/* Header */}
					<div className='flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-md'>
						<div>
							<h1 className='text-3xl font-bold text-gray-900'>Welcome to Shelf!</h1>
							<p className='mt-1 text-gray-600'>
								Signed in as:{' '}
								<span className='font-semibold text-blue-600'>{user.email || user.username}</span>
							</p>
						</div>
						<button
							type='button'
							onClick={handleLogout}
							className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
						>
							Sign Out
						</button>
					</div>

					{/* Content */}
					{spotifyAccessToken ? (
						<PlaylistGrid accessToken={spotifyAccessToken} />
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

	return <LoginScreen pb={pb} onLogin={handleLogin} />
}

export default App
