import { observer } from 'mobx-react-lite'
import PlaylistList from '../components/PlaylistList'
import LoginScreen from '../components/LoginScreen'
import { useStores } from '../stores/StoreContext'

const Playlists = observer(() => {
	const { authStore } = useStores()

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-7xl mx-auto">
				{authStore.spotify?.accessToken ? (
					<PlaylistList accessToken={authStore.spotify.accessToken} />
				) : (
					<div className="text-center py-8 bg-white rounded-lg shadow-md max-w-[600px] mx-auto">
						<h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Shelf</h1>
						<p className="text-gray-600 mb-6">Connect your Spotify account to start transferring playlists to YouTube</p>
						<LoginScreen />
					</div>
				)}
			</div>
		</div>
	)
})

export default Playlists