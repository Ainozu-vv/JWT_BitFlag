const dotenv = require('dotenv');

dotenv.config();

const env = {
	port: Number.parseInt(process.env.PORT ?? '3000', 10),
	jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
	jwtIssuer: process.env.JWT_ISSUER || 'jwt-demo',
	jwtAudience: process.env.JWT_AUDIENCE || 'jwt-demo',
	jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
};

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
	throw new Error('JWT_SECRET must be set in production');
}

module.exports = { env };
