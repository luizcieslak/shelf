import { observer } from 'mobx-react-lite'
import { Link, Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Playlists from './pages/Playlists'
import Search from './pages/Search'
import { useStores } from './stores/StoreContext'
import type { Platform } from './types/platform'

const App = observer(() => {
	const { authStore } = useStores()

	console.log('App render - connected platforms:', authStore.connectedPlatforms)

	const getPlatformIcon = (platform: Platform) => {
		switch (platform) {
			case 'spotify':
				return (
					<svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
						<title>Spotify</title>
						<path d='M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.305-1.76-8.786-.963-.335.077-.67-.133-.746-.469-.077-.336.132-.67.469-.746 3.809-.871 7.077-.496 9.713 1.115.294.18.386.563.207.856zm1.223-2.723c-.226.367-.706.482-1.073.257-2.687-1.652-6.785-2.131-9.965-1.166-.413.125-.849-.106-.973-.518-.125-.413.106-.849.518-.973 3.632-1.102 8.147-.568 11.238 1.327.366.226.481.706.255 1.073zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.493.15-1.016-.128-1.166-.622-.149-.493.129-1.016.622-1.165 3.532-1.073 9.404-.865 13.115 1.338.445.264.590.837.326 1.282-.264.444-.838.590-1.282.326z' />
					</svg>
				)
			case 'google':
				return (
					<svg className='w-5 h-5' viewBox='0 0 24 24'>
						<title>YouTube</title>
						<path
							fill='#FF0000'
							d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'
						/>
					</svg>
				)
			case 'apple':
				return (
					<svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
						<title>Apple</title>
						<path d='M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z' />
					</svg>
				)
		}
	}

	const getPlatformColor = (platform: Platform) => {
		switch (platform) {
			case 'spotify':
				return 'text-green-600 bg-green-50'
			case 'google':
				return 'text-red-600 bg-red-50'
			case 'apple':
				return 'text-gray-600 bg-gray-50'
		}
	}

	const getPlatformName = (platform: Platform) => {
		switch (platform) {
			case 'spotify':
				return 'Spotify'
			case 'google':
				return 'YouTube'
			case 'apple':
				return 'Apple Music'
		}
	}

	const Navigation = () => (
		<nav className='bg-white shadow-sm border-b'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='flex justify-between h-16'>
					<div className='flex items-center space-x-8'>
						<h1 className='text-xl font-bold text-gray-900'>Shelf</h1>
						<Link
							to='/playlists'
							className='inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600'
						>
							Playlists
						</Link>
						{/* <Link to="/search" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600">
							Search
						</Link> */}
					</div>
					<div className='flex items-center space-x-4'>
						<div className='flex gap-2'>
							{authStore.connectedPlatforms.map(platform => (
								<div
									key={platform}
									className={`flex items-center gap-1 px-2 py-1 rounded ${getPlatformColor(platform)}`}
								>
									{getPlatformIcon(platform)}
									<span className='text-xs'>{getPlatformName(platform)}</span>
								</div>
							))}
						</div>
						<button
							type='button'
							onClick={() => authStore.disconnectAll()}
							className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700'
						>
							Disconnect All
						</button>
					</div>
				</div>
			</div>
		</nav>
	)

	return (
		<Router>
			<Routes>
				<Route
					path='/login'
					element={!authStore.hasAnyConnection ? <Login /> : <Navigate to='/playlists' />}
				/>
				<Route
					path='/playlists'
					element={
						authStore.hasAnyConnection ? (
							<div>
								<Navigation />
								<Playlists />
							</div>
						) : (
							<Navigate to='/login' />
						)
					}
				/>
				<Route
					path='/search'
					element={
						authStore.hasAnyConnection ? (
							<div>
								<Navigation />
								<Search />
							</div>
						) : (
							<Navigate to='/login' />
						)
					}
				/>
				<Route path='/' element={<Navigate to={authStore.hasAnyConnection ? '/playlists' : '/login'} />} />
			</Routes>
		</Router>
	)
})

export default App
