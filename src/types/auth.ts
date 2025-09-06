export interface User {
	id: string
	email?: string
	username?: string
	name?: string
	avatar?: string
}

export interface AuthResponse {
	record: User
	token: string
}
