/**
 * YouTube API Error Response Structure
 */
interface YouTubeErrorResponse {
	error: {
		code: number
		message: string
		errors: Array<{
			message: string
			domain: string
			reason: string
		}>
	}
}

/**
 * Parsed YouTube Error Information
 */
export interface YouTubeError {
	isQuotaExceeded: boolean
	code: number
	message: string
	userFriendlyMessage: string
}

/**
 * Parse YouTube API error and extract meaningful information
 */
export async function parseYouTubeError(error: unknown): Promise<YouTubeError> {
	// Default error structure
	const defaultError: YouTubeError = {
		isQuotaExceeded: false,
		code: 500,
		message: 'Unknown error',
		userFriendlyMessage: 'An unexpected error occurred',
	}

	// Handle Response objects
	if (error instanceof Response) {
		try {
			const data: YouTubeErrorResponse = await error.json()
			return parseYouTubeErrorResponse(data, error.status)
		} catch {
			return {
				isQuotaExceeded: false,
				code: error.status,
				message: error.statusText,
				userFriendlyMessage: `Request failed with status ${error.status}`,
			}
		}
	}

	// Handle Error objects with message
	if (error instanceof Error) {
		// Check if error message contains quota info
		const isQuotaExceeded =
			error.message.includes('quotaExceeded') ||
			error.message.includes('quota') ||
			error.message.includes('403')

		return {
			isQuotaExceeded,
			code: isQuotaExceeded ? 403 : 500,
			message: error.message,
			userFriendlyMessage: isQuotaExceeded
				? '⚠️ YouTube API quota exceeded. Please try again later (quota resets daily at midnight PST).'
				: error.message,
		}
	}

	return defaultError
}

/**
 * Parse YouTube API error response JSON
 */
function parseYouTubeErrorResponse(data: YouTubeErrorResponse, statusCode: number): YouTubeError {
	const isQuotaExceeded = data.error.errors.some(err => err.reason === 'quotaExceeded')

	return {
		isQuotaExceeded,
		code: data.error.code || statusCode,
		message: data.error.message,
		userFriendlyMessage: isQuotaExceeded
			? '⚠️ YouTube API quota exceeded. Please try again later (quota resets daily at midnight PST).'
			: data.error.message || 'An error occurred with the YouTube API',
	}
}

/**
 * Create a user-friendly error message for YouTube API errors
 */
export function getYouTubeErrorMessage(error: unknown): string {
	if (typeof error === 'string') {
		return error
	}

	if (error instanceof Error) {
		const isQuotaExceeded =
			error.message.includes('quotaExceeded') ||
			error.message.includes('quota') ||
			error.message.includes('403')

		return isQuotaExceeded
			? '⚠️ YouTube API quota exceeded. Please try again later (quota resets daily at midnight PST).'
			: error.message
	}

	return 'An unexpected error occurred'
}
