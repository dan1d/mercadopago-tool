import { describe, it, expect } from 'vitest';
import { MercadoPagoApi } from '../credentials/MercadoPagoApi.credentials';

describe('MercadoPagoApi Credentials', () => {
	const creds = new MercadoPagoApi();

	it('should have correct name and display name', () => {
		expect(creds.name).toBe('mercadoPagoApi');
		expect(creds.displayName).toBe('Mercado Pago API');
	});

	it('should have an accessToken property marked as password', () => {
		const tokenProp = creds.properties.find((p) => p.name === 'accessToken');
		expect(tokenProp).toBeDefined();
		expect(tokenProp!.type).toBe('string');
		expect(tokenProp!.typeOptions).toEqual({ password: true });
		expect(tokenProp!.required).toBe(true);
	});

	it('should authenticate with Bearer token in Authorization header', () => {
		expect(creds.authenticate).toEqual({
			type: 'generic',
			properties: {
				headers: {
					Authorization: '=Bearer {{$credentials.accessToken}}',
				},
			},
		});
	});

	it('should test credentials by calling GET /users/me', () => {
		expect(creds.test).toEqual({
			request: {
				baseURL: 'https://api.mercadopago.com',
				url: '/users/me',
				method: 'GET',
			},
		});
	});

	it('should have documentation URL', () => {
		expect(creds.documentationUrl).toBeTruthy();
		expect(creds.documentationUrl).toContain('mercadopago');
	});
});
