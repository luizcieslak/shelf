import { observer } from 'mobx-react-lite'
import SpotifyPlaylistGrid from '../components/spotify/PlaylistGrid'
import YouTubePlaylistGrid from '../components/youtube/YouTubePlaylistGrid'
import LoginScreen from '../components/LoginScreen'
import { useStores } from '../stores/StoreContext'

const Playlists = observer(() => {
	const { authStore } = useStores()

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-900 mb-8">Playlists</h1>

				{authStore.connectedPlatforms.length === 1 ? (
					<div className="mb-8 text-center py-8 bg-white rounded-lg shadow-md">
						<p className="text-gray-600 mb-4">Connect another platform to start transferring playlists</p>
						<LoginScreen />
					</div>
				) : authStore.connectedPlatforms.length > 1 ? (
					<div className="mb-8 text-center py-8 bg-white rounded-lg shadow-md">
						<p className="text-gray-600 mb-4">Playlist transfer functionality coming soon!</p>
						<p className="text-sm text-gray-500">
							You have {authStore.connectedPlatforms.length} platforms connected
						</p>
					</div>
				) : null}

				{authStore.spotify?.accessToken && (
					<div className="mb-8">
						<SpotifyPlaylistGrid accessToken={authStore.spotify.accessToken} />
					</div>
				)}

				{authStore.google?.accessToken && (
					<div className="mb-8">
						<YouTubePlaylistGrid accessToken={authStore.google.accessToken} />
					</div>
				)}

				{!authStore.spotify?.accessToken && !authStore.google?.accessToken && (
					<div className="text-center py-8 bg-white rounded-lg shadow-md">
						<p className="text-gray-600 mb-4">No playlists to show. Connect a platform to view your playlists.</p>
						<LoginScreen />
					</div>
				)}
			</div>
		</div>
	)
})

export default Playlists