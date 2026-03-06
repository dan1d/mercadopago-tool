import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MercadoPago } from '../nodes/MercadoPago/MercadoPago.node';
import type { IDataObject } from 'n8n-workflow';

// Mock n8n-workflow NodeApiError
vi.mock('n8n-workflow', async () => {
	const actual = await vi.importActual('n8n-workflow');
	return {
		...actual,
		NodeApiError: class NodeApiError extends Error {
			constructor(node: unknown, data: unknown, opts?: unknown) {
				super((data as { message?: string })?.message ?? 'API Error');
				this.name = 'NodeApiError';
			}
		},
	};
});

function createMockExecuteFunctions(params: Record<string, unknown>) {
	const mockHttpRequest = vi.fn().mockResolvedValue({ success: true });

	const context = {
		getInputData: () => [{ json: {} }],
		getNodeParameter: (name: string, index: number, fallback?: unknown) => {
			if (name in params) return params[name];
			return fallback;
		},
		getCredentials: vi.fn().mockResolvedValue({ accessToken: 'TEST-TOKEN-123' }),
		getNode: () => ({ name: 'Mercado Pago', type: 'mercadoPago' }),
		continueOnFail: () => false,
		helpers: {
			returnJsonArray: (data: IDataObject[]) => data.map((d) => ({ json: d })),
			httpRequestWithAuthentication: mockHttpRequest,
		},
	};

	return { context, mockHttpRequest };
}

describe('MercadoPago Node', () => {
	describe('description', () => {
		it('should have correct basic properties', () => {
			const node = new MercadoPago();
			expect(node.description.displayName).toBe('Mercado Pago');
			expect(node.description.name).toBe('mercadoPago');
			expect(node.description.version).toBe(1);
			expect(node.description.icon).toBe('file:mercadopago.svg');
		});

		it('should require mercadoPagoApi credentials', () => {
			const node = new MercadoPago();
			expect(node.description.credentials).toEqual([
				{ name: 'mercadoPagoApi', required: true },
			]);
		});

		it('should define all 4 resources', () => {
			const node = new MercadoPago();
			const resourceProp = node.description.properties.find((p) => p.name === 'resource');
			expect(resourceProp).toBeDefined();
			const values = (resourceProp!.options as { value: string }[]).map((o) => o.value);
			expect(values).toContain('paymentPreference');
			expect(values).toContain('payment');
			expect(values).toContain('refund');
			expect(values).toContain('merchant');
		});

		it('should define all 5 operations across resources', () => {
			const node = new MercadoPago();
			const operationProps = node.description.properties.filter((p) => p.name === 'operation');
			// One operation block per resource
			expect(operationProps).toHaveLength(4);

			// Collect all operation values
			const allOps: string[] = [];
			for (const op of operationProps) {
				for (const opt of op.options as { value: string }[]) {
					allOps.push(opt.value);
				}
			}
			expect(allOps).toContain('create'); // paymentPreference create
			expect(allOps).toContain('get'); // payment get
			expect(allOps).toContain('search'); // payment search
			// refund create is same value as paymentPreference create, but in different resource context
			expect(allOps).toContain('getInfo'); // merchant getInfo
			// Total: create (pref), get, search, create (refund), getInfo = 5
			expect(allOps).toHaveLength(5);
		});
	});

	describe('execute - Payment Preference Create', () => {
		it('should call POST /checkout/preferences with items', async () => {
			const { context, mockHttpRequest } = createMockExecuteFunctions({
				resource: 'paymentPreference',
				operation: 'create',
				'items.itemValues': [
					{ title: 'Test Product', quantity: 2, unit_price: 100, currency_id: 'ARS' },
				],
				additionalFields: {},
			});

			mockHttpRequest.mockResolvedValue({
				id: 'pref_123',
				init_point: 'https://mercadopago.com/checkout/v1/redirect?pref_id=pref_123',
			});

			const node = new MercadoPago();
			const result = await node.execute.call(context as any);

			expect(mockHttpRequest).toHaveBeenCalledOnce();
			const callArgs = mockHttpRequest.mock.calls[0];
			expect(callArgs[0]).toBe('mercadoPagoApi');
			expect(callArgs[1]).toMatchObject({
				method: 'POST',
				url: 'https://api.mercadopago.com/checkout/preferences',
				body: {
					items: [
						{ title: 'Test Product', quantity: 2, unit_price: 100, currency_id: 'ARS' },
					],
				},
			});

			expect(result[0][0]).toMatchObject({ json: { id: 'pref_123' } });
		});

		it('should include back_urls and additional fields when provided', async () => {
			const { context, mockHttpRequest } = createMockExecuteFunctions({
				resource: 'paymentPreference',
				operation: 'create',
				'items.itemValues': [
					{ title: 'Item', quantity: 1, unit_price: 50, currency_id: 'BRL' },
				],
				additionalFields: {
					backUrlSuccess: 'https://example.com/success',
					backUrlFailure: 'https://example.com/failure',
					backUrlPending: 'https://example.com/pending',
					notificationUrl: 'https://example.com/webhook',
					externalReference: 'order-123',
					autoReturn: 'approved',
				},
			});

			mockHttpRequest.mockResolvedValue({ id: 'pref_456' });

			const node = new MercadoPago();
			await node.execute.call(context as any);

			const body = mockHttpRequest.mock.calls[0][1].body;
			expect(body.back_urls).toEqual({
				success: 'https://example.com/success',
				failure: 'https://example.com/failure',
				pending: 'https://example.com/pending',
			});
			expect(body.notification_url).toBe('https://example.com/webhook');
			expect(body.external_reference).toBe('order-123');
			expect(body.auto_return).toBe('approved');
		});

		it('should include expiration fields when expires is true', async () => {
			const { context, mockHttpRequest } = createMockExecuteFunctions({
				resource: 'paymentPreference',
				operation: 'create',
				'items.itemValues': [
					{ title: 'Item', quantity: 1, unit_price: 10, currency_id: 'ARS' },
				],
				additionalFields: {
					expires: true,
					expirationDateFrom: '2026-01-01T00:00:00Z',
					expirationDateTo: '2026-12-31T23:59:59Z',
				},
			});

			mockHttpRequest.mockResolvedValue({ id: 'pref_789' });

			const node = new MercadoPago();
			await node.execute.call(context as any);

			const body = mockHttpRequest.mock.calls[0][1].body;
			expect(body.expires).toBe(true);
			expect(body.expiration_date_from).toBe('2026-01-01T00:00:00Z');
			expect(body.expiration_date_to).toBe('2026-12-31T23:59:59Z');
		});
	});

	describe('execute - Payment Get', () => {
		it('should call GET /v1/payments/:id', async () => {
			const { context, mockHttpRequest } = createMockExecuteFunctions({
				resource: 'payment',
				operation: 'get',
				paymentId: '12345',
			});

			mockHttpRequest.mockResolvedValue({
				id: 12345,
				status: 'approved',
				transaction_amount: 100,
			});

			const node = new MercadoPago();
			const result = await node.execute.call(context as any);

			expect(mockHttpRequest).toHaveBeenCalledWith(
				'mercadoPagoApi',
				expect.objectContaining({
					method: 'GET',
					url: 'https://api.mercadopago.com/v1/payments/12345',
				}),
			);

			expect(result[0][0]).toMatchObject({ json: { id: 12345, status: 'approved' } });
		});
	});

	describe('execute - Payment Search', () => {
		it('should call GET /v1/payments/search with query parameters', async () => {
			const { context, mockHttpRequest } = createMockExecuteFunctions({
				resource: 'payment',
				operation: 'search',
				searchOptions: {
					status: 'approved',
					sort: 'date_created',
					criteria: 'desc',
					limit: 10,
					offset: 0,
				},
			});

			mockHttpRequest.mockResolvedValue({
				results: [{ id: 1 }, { id: 2 }],
				paging: { total: 2 },
			});

			const node = new MercadoPago();
			const result = await node.execute.call(context as any);

			expect(mockHttpRequest).toHaveBeenCalledWith(
				'mercadoPagoApi',
				expect.objectContaining({
					method: 'GET',
					url: 'https://api.mercadopago.com/v1/payments/search',
					qs: {
						status: 'approved',
						sort: 'date_created',
						criteria: 'desc',
						limit: 10,
						offset: 0,
					},
				}),
			);

			expect(result[0][0].json).toHaveProperty('results');
		});

		it('should handle empty search options', async () => {
			const { context, mockHttpRequest } = createMockExecuteFunctions({
				resource: 'payment',
				operation: 'search',
				searchOptions: {},
			});

			mockHttpRequest.mockResolvedValue({ results: [], paging: { total: 0 } });

			const node = new MercadoPago();
			await node.execute.call(context as any);

			const callArgs = mockHttpRequest.mock.calls[0][1];
			expect(callArgs.url).toBe('https://api.mercadopago.com/v1/payments/search');
			// No qs when empty
			expect(callArgs.qs).toBeUndefined();
		});

		it('should include external_reference in search', async () => {
			const { context, mockHttpRequest } = createMockExecuteFunctions({
				resource: 'payment',
				operation: 'search',
				searchOptions: {
					external_reference: 'order-abc',
				},
			});

			mockHttpRequest.mockResolvedValue({ results: [] });

			const node = new MercadoPago();
			await node.execute.call(context as any);

			expect(mockHttpRequest.mock.calls[0][1].qs).toMatchObject({
				external_reference: 'order-abc',
			});
		});
	});

	describe('execute - Refund Create', () => {
		it('should call POST /v1/payments/:id/refunds for full refund', async () => {
			const { context, mockHttpRequest } = createMockExecuteFunctions({
				resource: 'refund',
				operation: 'create',
				paymentId: '99999',
				fullRefund: true,
			});

			mockHttpRequest.mockResolvedValue({ id: 'ref_1', status: 'approved' });

			const node = new MercadoPago();
			const result = await node.execute.call(context as any);

			expect(mockHttpRequest).toHaveBeenCalledWith(
				'mercadoPagoApi',
				expect.objectContaining({
					method: 'POST',
					url: 'https://api.mercadopago.com/v1/payments/99999/refunds',
				}),
			);

			// Full refund should not have body
			const callArgs = mockHttpRequest.mock.calls[0][1];
			expect(callArgs.body).toBeUndefined();
		});

		it('should include amount for partial refund', async () => {
			const { context, mockHttpRequest } = createMockExecuteFunctions({
				resource: 'refund',
				operation: 'create',
				paymentId: '99999',
				fullRefund: false,
				refundAmount: 50.25,
			});

			mockHttpRequest.mockResolvedValue({ id: 'ref_2', amount: 50.25 });

			const node = new MercadoPago();
			await node.execute.call(context as any);

			expect(mockHttpRequest.mock.calls[0][1].body).toEqual({ amount: 50.25 });
		});
	});

	describe('execute - Merchant Get Info', () => {
		it('should call GET /users/me', async () => {
			const { context, mockHttpRequest } = createMockExecuteFunctions({
				resource: 'merchant',
				operation: 'getInfo',
			});

			mockHttpRequest.mockResolvedValue({
				id: 123456,
				email: 'merchant@example.com',
				site_id: 'MLA',
			});

			const node = new MercadoPago();
			const result = await node.execute.call(context as any);

			expect(mockHttpRequest).toHaveBeenCalledWith(
				'mercadoPagoApi',
				expect.objectContaining({
					method: 'GET',
					url: 'https://api.mercadopago.com/users/me',
				}),
			);

			expect(result[0][0]).toMatchObject({
				json: { id: 123456, email: 'merchant@example.com' },
			});
		});
	});

	describe('paymentId path traversal prevention', () => {
		it('should reject paymentId with path traversal characters', async () => {
			const { context } = createMockExecuteFunctions({
				resource: 'payment',
				operation: 'get',
				paymentId: '../../users/me',
			});

			const node = new MercadoPago();
			await expect(node.execute.call(context as any)).rejects.toThrow('Invalid payment ID');
		});

		it('should reject non-numeric paymentId in refund create', async () => {
			const { context } = createMockExecuteFunctions({
				resource: 'refund',
				operation: 'create',
				paymentId: '../admin',
				fullRefund: true,
			});

			const node = new MercadoPago();
			await expect(node.execute.call(context as any)).rejects.toThrow('Invalid payment ID');
		});

		it('should allow normal numeric paymentId for payment get', async () => {
			const { context, mockHttpRequest } = createMockExecuteFunctions({
				resource: 'payment',
				operation: 'get',
				paymentId: '12345',
			});

			mockHttpRequest.mockResolvedValue({ id: 12345, status: 'approved' });

			const node = new MercadoPago();
			const result = await node.execute.call(context as any);

			expect(mockHttpRequest).toHaveBeenCalledWith(
				'mercadoPagoApi',
				expect.objectContaining({
					url: 'https://api.mercadopago.com/v1/payments/12345',
				}),
			);
			expect(result[0][0]).toMatchObject({ json: { id: 12345 } });
		});

		it('should allow normal numeric paymentId for refund create', async () => {
			const { context, mockHttpRequest } = createMockExecuteFunctions({
				resource: 'refund',
				operation: 'create',
				paymentId: '99999',
				fullRefund: true,
			});

			mockHttpRequest.mockResolvedValue({ id: 'ref_1', status: 'approved' });

			const node = new MercadoPago();
			await node.execute.call(context as any);

			expect(mockHttpRequest).toHaveBeenCalledWith(
				'mercadoPagoApi',
				expect.objectContaining({
					url: 'https://api.mercadopago.com/v1/payments/99999/refunds',
				}),
			);
		});
	});

	describe('error handling', () => {
		it('should push error message when continueOnFail is true', async () => {
			const { context, mockHttpRequest } = createMockExecuteFunctions({
				resource: 'payment',
				operation: 'get',
				paymentId: '99999',
			});

			(context.continueOnFail as any) = () => true;
			mockHttpRequest.mockRejectedValue(new Error('Not Found'));

			const node = new MercadoPago();
			const result = await node.execute.call(context as any);

			expect(result[0][0]).toMatchObject({ json: { error: 'Not Found' } });
		});

		it('should throw on unsupported resource/operation', async () => {
			const { context } = createMockExecuteFunctions({
				resource: 'unknown',
				operation: 'unknown',
			});

			const node = new MercadoPago();
			await expect(node.execute.call(context as any)).rejects.toThrow();
		});
	});
});
