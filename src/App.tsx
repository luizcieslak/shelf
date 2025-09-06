import PocketBase from 'pocketbase'
import { useState } from 'react'
import LoginScreen from './components/LoginScreen'
import type { User } from './types/auth'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090')

function App() {
	const [user, setUser] = useState<User | null>(pb.authStore.model)

	const handleLogin = (userData: User) => {
		setUser(userData)
	}

	const handleLogout = () => {
		pb.authStore.clear()
		setUser(null)
	}

	if (user) {
		return (
			<div className='min-h-screen bg-gray-50 flex items-center justify-center'>
				<div className='max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md'>
					<div className='text-center'>
						<h2 className='text-2xl font-bold text-gray-900'>Welcome!</h2>
						<p className='mt-2 text-gray-600'>You are logged in as:</p>
						<p className='font-semibold text-blue-600'>{user.email || user.username}</p>
					</div>
					<button
						type='button'
						onClick={handleLogout}
						className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
					>
						Sign Out
					</button>
				</div>
			</div>
		)
	}

	return <LoginScreen pb={pb} onLogin={handleLogin} />
}

export default App
