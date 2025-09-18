import { observer } from 'mobx-react-lite'
import LoginScreen from '../components/LoginScreen'
import PlaylistList from '../components/PlaylistList'
import { useStores } from '../stores/StoreContext'

const Playlists = observer(() => {
	const { authStore } = useStores()

	return (
		<div className='min-h-screen bg-gray-50 p-8'>
			<div className='max-w-7xl mx-auto'>
				{authStore.spotify?.accessToken ? (
					<PlaylistList accessToken={authStore.spotify.accessToken} />
				) : (
					<LoginScreen />
				)}
			</div>
		</div>
	)
})

export default Playlists
