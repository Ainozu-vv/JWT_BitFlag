const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
	res.json({
		openapi: '3.0.3',
		info: {
			title: 'JWT BitFlag Demo API',
			version: '1.0.0',
		},
		servers: [{ url: 'http://localhost:3000' }],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
				},
			},
		},
		paths: {
			'/health': {
				get: {
					summary: 'Health check',
					responses: {
						'200': { description: 'OK' },
					},
				},
			},
			'/auth/register': {
				post: {
					summary: 'Register user',
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: {
									type: 'object',
									required: ['username', 'password'],
									properties: {
										username: { type: 'string' },
										password: { type: 'string' },
									},
								},
							},
						},
					},
					responses: {
						'201': { description: 'Created' },
						'400': { description: 'Validation error' },
						'409': { description: 'Username exists' },
					},
				},
			},
			'/auth/login': {
				post: {
					summary: 'Login',
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: {
									type: 'object',
									required: ['username', 'password'],
									properties: {
										username: { type: 'string' },
										password: { type: 'string' },
									},
								},
							},
						},
					},
					responses: {
						'200': { description: 'OK' },
						'401': { description: 'Invalid credentials' },
					},
				},
			},
			'/auth/me': {
				get: {
					summary: 'Current user',
					security: [{ bearerAuth: [] }],
					responses: {
						'200': { description: 'OK' },
						'401': { description: 'Unauthorized' },
					},
				},
			},
			'/auth/refresh': {
				post: {
					summary: 'Refresh tokens (rotation)',
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: {
									type: 'object',
									required: ['refreshToken'],
									properties: { refreshToken: { type: 'string' } },
								},
							},
						},
					},
					responses: {
						'200': { description: 'OK' },
						'401': { description: 'Invalid refresh token' },
					},
				},
			},
			'/auth/logout': {
				post: {
					summary: 'Logout (revoke access + refresh tokens)',
					security: [{ bearerAuth: [] }],
					responses: {
						'200': { description: 'OK' },
						'401': { description: 'Unauthorized' },
					},
				},
			},
			'/demo/public': {
				get: { summary: 'Public demo endpoint', responses: { '200': { description: 'OK' } } },
			},
			'/demo/protected': {
				get: {
					summary: 'Protected demo endpoint',
					security: [{ bearerAuth: [] }],
					responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } },
				},
			},
			'/demo/admin': {
				get: {
					summary: 'Admin-only demo endpoint',
					security: [{ bearerAuth: [] }],
					responses: { '200': { description: 'OK' }, '403': { description: 'Forbidden' } },
				},
			},
			'/demo/write': {
				get: {
					summary: 'USER_WRITE demo endpoint',
					security: [{ bearerAuth: [] }],
					responses: { '200': { description: 'OK' }, '403': { description: 'Forbidden' } },
				},
			},
			'/users': {
				get: {
					summary: 'List users (admin only)',
					security: [{ bearerAuth: [] }],
					responses: { '200': { description: 'OK' }, '403': { description: 'Forbidden' } },
				},
			},
			'/users/{id}': {
				get: {
					summary: 'Get user (admin only)',
					security: [{ bearerAuth: [] }],
					parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
					responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } },
				},
				delete: {
					summary: 'Delete user (admin only)',
					security: [{ bearerAuth: [] }],
					parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
					responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } },
				},
			},
			'/users/{id}/permissions': {
				patch: {
					summary: 'Change permissions (admin only)',
					security: [{ bearerAuth: [] }],
					parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
					responses: { '200': { description: 'OK' }, '400': { description: 'Bad request' } },
				},
			},
			'/users/{id}/password': {
				patch: {
					summary: 'Change password (admin or self)',
					security: [{ bearerAuth: [] }],
					parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
					responses: { '200': { description: 'OK' }, '403': { description: 'Forbidden' } },
				},
			},
		},
	});
});

module.exports = router;
