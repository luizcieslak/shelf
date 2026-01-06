import { observer } from 'mobx-react-lite'
import LoginScreen from '../components/LoginScreen'
import SpotifySearch from '../components/spotify/Search'
import YouTubeSearch from '../components/youtube/YoutubeSearch'
import { useStores } from '../stores/StoreContext'

const Search = observer(() => {
	const { authStore } = useStores()

	return (
		<div className='min-h-screen bg-gray-50 p-8'>
			<div className='max-w-7xl mx-auto'>
				<h1 className='text-3xl font-bold text-gray-900 mb-8'>Search</h1>

				{authStore.spotify?.accessToken && (
					<div className='mb-8'>
						<SpotifySearch accessToken={authStore.spotify.accessToken} />
					</div>
				)}

				{authStore.google?.accessToken && (
					<div className='mb-8'>
						<YouTubeSearch accessToken={authStore.google.accessToken} />
					</div>
				)}

				{!authStore.spotify?.accessToken && !authStore.google?.accessToken && (
					<div className='text-center py-8 bg-white rounded-lg shadow-md'>
						<p className='text-gray-600 mb-4'>No search available. Connect a platform to search for music.</p>
						<LoginScreen />
					</div>
				)}
			</div>
		</div>
	)
})

export default Search
