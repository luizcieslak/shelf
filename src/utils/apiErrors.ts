/**
 * Custom error class for expired access tokens
 * Thrown by platform services when a 401 Unauthorized is detected
 */
export class TokenExpiredError extends Error {
	constructor(
		public platform: 'spotify' | 'google',
		message = 'Access token has expired',
	) {
		super(message)
		this.name = 'TokenExpiredError'
	}
}
