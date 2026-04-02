import { observer } from 'mobx-react-lite'
import React, { useEffect, useState } from 'react'
import { useStores } from '../stores/StoreContext'
import { TokenExpiredError } from '../utils/apiErrors'

interface TokenErrorBoundaryProps {
	children: React.ReactNode
	onError?: (error: Error) => void
}

/**
 * Component wrapper that catches TokenExpiredError and triggers platform disconnection
 * This provides a clean way to handle token expiry across the app
 */
export const TokenErrorBoundary: React.FC<TokenErrorBoundaryProps> = observer(({ children, onError }) => {
	const { authStore } = useStores()
	const [error, setError] = useState<Error | null>(null)

	useEffect(() => {
		// Clear error when user reconnects
		if (error && authStore.hasAnyConnection) {
			setError(null)
		}
	}, [authStore.hasAnyConnection, error])

	// Wrapper function to catch async errors
	const handleError = (err: Error) => {
		if (err instanceof TokenExpiredError) {
			authStore.handleTokenExpiry(err.platform, err.message)
			setError(err)
		} else {
			setError(err)
		}

		onError?.(err)
	}

	// Provide error handler to children via context
	return (
		<TokenErrorContext.Provider value={{ handleError }}>
			{error instanceof TokenExpiredError ? (
				<div className='bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4'>
					<div className='flex'>
						<div className='flex-shrink-0'>
							<svg
								className='h-5 w-5 text-yellow-400'
								viewBox='0 0 20 20'
								fill='currentColor'
								aria-hidden='true'
							>
								<path
									fillRule='evenodd'
									d='M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z'
									clipRule='evenodd'
								/>
							</svg>
						</div>
						<div className='ml-3 flex-1'>
							<p className='text-sm text-yellow-700'>
								<strong>Session Expired:</strong> {error.message}
							</p>
							<p className='mt-2 text-sm text-yellow-700'>
								Please reconnect to {error.platform === 'spotify' ? 'Spotify' : 'YouTube'} to continue.
							</p>
							<div className='mt-4'>
								<button
									type='button'
									onClick={() => {
										if (error.platform === 'spotify') {
											authStore.connectSpotify()
										} else {
											authStore.connectGoogle()
										}
									}}
									className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500'
								>
									Reconnect {error.platform === 'spotify' ? 'Spotify' : 'YouTube'}
								</button>
							</div>
						</div>
					</div>
				</div>
			) : error ? (
				<div className='bg-red-50 border-l-4 border-red-400 p-4 mb-4'>
					<div className='flex'>
						<div className='flex-shrink-0'>
							<svg
								className='h-5 w-5 text-red-400'
								viewBox='0 0 20 20'
								fill='currentColor'
								aria-hidden='true'
							>
								<path
									fillRule='evenodd'
									d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z'
									clipRule='evenodd'
								/>
							</svg>
						</div>
						<div className='ml-3'>
							<p className='text-sm text-red-700'>
								<strong>Error:</strong> {error.message}
							</p>
						</div>
					</div>
				</div>
			) : (
				children
			)}
		</TokenErrorContext.Provider>
	)
})

// Context for child components to report errors
interface TokenErrorContextType {
	handleError: (error: Error) => void
}

const TokenErrorContext = React.createContext<TokenErrorContextType>({
	handleError: () => {},
})

export const useTokenErrorHandler = () => {
	return React.useContext(TokenErrorContext)
}
