import PocketBase from 'pocketbase'
import { createContext, type ReactNode, useContext } from 'react'
import { AuthStore } from './AuthStore'

// Create PocketBase instance
const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090')

// Create store instances
const authStore = new AuthStore(pb)

// Create context
const StoreContext = createContext({
	authStore,
	pb,
})

// Provider component
interface StoreProviderProps {
	children: ReactNode
}

export const StoreProvider = ({ children }: StoreProviderProps) => {
	return <StoreContext.Provider value={{ authStore, pb }}>{children}</StoreContext.Provider>
}

// Hook to use stores
export const useStores = () => {
	const context = useContext(StoreContext)
	if (!context) {
		throw new Error('useStores must be used within StoreProvider')
	}
	return context
}
