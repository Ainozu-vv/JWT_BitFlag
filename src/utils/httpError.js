class HttpError extends Error {

	constructor(status, message, details) {
		super(message);
		this.name = 'HttpError';
		this.status = status;
		this.details = details;
	}
}

function httpError(status, message, details) {
	return new HttpError(status, message, details);
}

function errorHandler(err, req, res, next) {
	if (res.headersSent) return next(err);

	const status = typeof err?.status === 'number' ? err.status : 500;
	const message = status === 500 ? 'Internal Server Error' : String(err?.message ?? 'Error');

	res.status(status).json({
		error: {
			status,
			message,
			...(err?.details !== undefined ? { details: err.details } : {}),
		},
	});
}

module.exports = { HttpError, httpError, errorHandler };
