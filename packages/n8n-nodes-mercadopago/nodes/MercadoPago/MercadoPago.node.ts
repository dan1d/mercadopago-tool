import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export class MercadoPago implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Mercado Pago',
		name: 'mercadoPago',
		icon: 'file:mercadopago.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Interact with the Mercado Pago API',
		defaults: {
			name: 'Mercado Pago',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'mercadoPagoApi',
				required: true,
			},
		],
		properties: [
			// ------ Resource ------
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Payment Preference', value: 'paymentPreference' },
					{ name: 'Payment', value: 'payment' },
					{ name: 'Refund', value: 'refund' },
					{ name: 'Merchant', value: 'merchant' },
				],
				default: 'paymentPreference',
			},

			// ------ Operations ------

			// Payment Preference operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: { resource: ['paymentPreference'] },
				},
				options: [
					{ name: 'Create', value: 'create', description: 'Create a checkout preference', action: 'Create a checkout preference' },
				],
				default: 'create',
			},

			// Payment operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: { resource: ['payment'] },
				},
				options: [
					{ name: 'Get', value: 'get', description: 'Get a payment by ID', action: 'Get a payment' },
					{ name: 'Search', value: 'search', description: 'Search payments', action: 'Search payments' },
				],
				default: 'get',
			},

			// Refund operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: { resource: ['refund'] },
				},
				options: [
					{ name: 'Create', value: 'create', description: 'Create a refund for a payment', action: 'Create a refund' },
				],
				default: 'create',
			},

			// Merchant operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: { resource: ['merchant'] },
				},
				options: [
					{ name: 'Get Info', value: 'getInfo', description: 'Get merchant account information', action: 'Get merchant info' },
				],
				default: 'getInfo',
			},

			// ------ Fields ------

			// Payment Preference: Create
			{
				displayName: 'Items',
				name: 'items',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: {
					show: { resource: ['paymentPreference'], operation: ['create'] },
				},
				default: {},
				placeholder: 'Add Item',
				options: [
					{
						name: 'itemValues',
						displayName: 'Item',
						values: [
							{
								displayName: 'Title',
								name: 'title',
								type: 'string',
								default: '',
								required: true,
								description: 'Item title',
							},
							{
								displayName: 'Quantity',
								name: 'quantity',
								type: 'number',
								default: 1,
								required: true,
								description: 'Item quantity',
							},
							{
								displayName: 'Unit Price',
								name: 'unit_price',
								type: 'number',
								default: 0,
								required: true,
								typeOptions: { numberPrecision: 2 },
								description: 'Unit price of the item',
							},
							{
								displayName: 'Currency ID',
								name: 'currency_id',
								type: 'options',
								default: 'BRL',
								options: [
									{ name: 'ARS (Argentine Peso)', value: 'ARS' },
									{ name: 'BRL (Brazilian Real)', value: 'BRL' },
									{ name: 'CLP (Chilean Peso)', value: 'CLP' },
									{ name: 'COP (Colombian Peso)', value: 'COP' },
									{ name: 'MXN (Mexican Peso)', value: 'MXN' },
									{ name: 'PEN (Peruvian Sol)', value: 'PEN' },
									{ name: 'UYU (Uruguayan Peso)', value: 'UYU' },
									{ name: 'USD (US Dollar)', value: 'USD' },
								],
								description: 'Currency identifier',
							},
							{
								displayName: 'Description',
								name: 'description',
								type: 'string',
								default: '',
								description: 'Item description',
							},
							{
								displayName: 'ID',
								name: 'id',
								type: 'string',
								default: '',
								description: 'Item ID in your system',
							},
						],
					},
				],
				description: 'Items to include in the payment preference',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['paymentPreference'], operation: ['create'] },
				},
				options: [
					{
						displayName: 'Back URL - Success',
						name: 'backUrlSuccess',
						type: 'string',
						default: '',
						description: 'URL to redirect on successful payment',
					},
					{
						displayName: 'Back URL - Failure',
						name: 'backUrlFailure',
						type: 'string',
						default: '',
						description: 'URL to redirect on failed payment',
					},
					{
						displayName: 'Back URL - Pending',
						name: 'backUrlPending',
						type: 'string',
						default: '',
						description: 'URL to redirect on pending payment',
					},
					{
						displayName: 'Notification URL',
						name: 'notificationUrl',
						type: 'string',
						default: '',
						description: 'URL to receive payment notifications (webhooks)',
					},
					{
						displayName: 'External Reference',
						name: 'externalReference',
						type: 'string',
						default: '',
						description: 'Reference to sync with your system',
					},
					{
						displayName: 'Expires',
						name: 'expires',
						type: 'boolean',
						default: false,
						description: 'Whether the preference expires',
					},
					{
						displayName: 'Expiration Date From',
						name: 'expirationDateFrom',
						type: 'dateTime',
						default: '',
						description: 'Start date of the preference validity',
						displayOptions: {
							show: { expires: [true] },
						},
					},
					{
						displayName: 'Expiration Date To',
						name: 'expirationDateTo',
						type: 'dateTime',
						default: '',
						description: 'End date of the preference validity',
						displayOptions: {
							show: { expires: [true] },
						},
					},
					{
						displayName: 'Auto Return',
						name: 'autoReturn',
						type: 'options',
						default: 'approved',
						options: [
							{ name: 'Approved', value: 'approved' },
							{ name: 'All', value: 'all' },
						],
						description: 'Auto-return behavior after payment',
					},
				],
			},

			// Payment: Get
			{
				displayName: 'Payment ID',
				name: 'paymentId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['payment'], operation: ['get'] },
				},
				description: 'The ID of the payment to retrieve',
			},

			// Payment: Search
			{
				displayName: 'Options',
				name: 'searchOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: { resource: ['payment'], operation: ['search'] },
				},
				options: [
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						default: '',
						options: [
							{ name: 'All', value: '' },
							{ name: 'Approved', value: 'approved' },
							{ name: 'Pending', value: 'pending' },
							{ name: 'Authorized', value: 'authorized' },
							{ name: 'In Process', value: 'in_process' },
							{ name: 'In Mediation', value: 'in_mediation' },
							{ name: 'Rejected', value: 'rejected' },
							{ name: 'Cancelled', value: 'cancelled' },
							{ name: 'Refunded', value: 'refunded' },
							{ name: 'Charged Back', value: 'charged_back' },
						],
						description: 'Filter by payment status',
					},
					{
						displayName: 'Sort',
						name: 'sort',
						type: 'options',
						default: 'date_created',
						options: [
							{ name: 'Date Created', value: 'date_created' },
							{ name: 'Date Approved', value: 'date_approved' },
							{ name: 'Date Last Updated', value: 'date_last_updated' },
							{ name: 'Money Release Date', value: 'money_release_date' },
						],
						description: 'Sort field',
					},
					{
						displayName: 'Criteria',
						name: 'criteria',
						type: 'options',
						default: 'desc',
						options: [
							{ name: 'Ascending', value: 'asc' },
							{ name: 'Descending', value: 'desc' },
						],
						description: 'Sort direction',
					},
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						default: 30,
						typeOptions: { minValue: 1, maxValue: 100 },
						description: 'Max number of results to return',
					},
					{
						displayName: 'Offset',
						name: 'offset',
						type: 'number',
						default: 0,
						typeOptions: { minValue: 0 },
						description: 'Number of results to skip',
					},
					{
						displayName: 'External Reference',
						name: 'external_reference',
						type: 'string',
						default: '',
						description: 'Filter by external reference',
					},
				],
			},

			// Refund: Create
			{
				displayName: 'Payment ID',
				name: 'paymentId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['refund'], operation: ['create'] },
				},
				description: 'The ID of the payment to refund',
			},
			{
				displayName: 'Full Refund',
				name: 'fullRefund',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: { resource: ['refund'], operation: ['create'] },
				},
				description: 'Whether to refund the full payment amount',
			},
			{
				displayName: 'Amount',
				name: 'refundAmount',
				type: 'number',
				default: 0,
				typeOptions: { numberPrecision: 2 },
				displayOptions: {
					show: { resource: ['refund'], operation: ['create'], fullRefund: [false] },
				},
				description: 'Amount to refund (for partial refund)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		const credentials = await this.getCredentials('mercadoPagoApi');
		const accessToken = credentials.accessToken as string;
		const baseUrl = 'https://api.mercadopago.com';

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let responseData: IDataObject;

				if (resource === 'paymentPreference' && operation === 'create') {
					responseData = await executePaymentPreferenceCreate.call(this, i, baseUrl, accessToken);
				} else if (resource === 'payment' && operation === 'get') {
					responseData = await executePaymentGet.call(this, i, baseUrl, accessToken);
				} else if (resource === 'payment' && operation === 'search') {
					responseData = await executePaymentSearch.call(this, i, baseUrl, accessToken);
				} else if (resource === 'refund' && operation === 'create') {
					responseData = await executeRefundCreate.call(this, i, baseUrl, accessToken);
				} else if (resource === 'merchant' && operation === 'getInfo') {
					responseData = await executeMerchantGetInfo.call(this, baseUrl, accessToken);
				} else {
					throw new NodeApiError(this.getNode(), {
						message: `Unsupported resource/operation: ${resource}/${operation}`,
					} as JsonObject);
				}

				returnData.push(responseData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: (error as Error).message });
					continue;
				}
				if (error instanceof NodeApiError) {
					throw error;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject);
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}

async function mercadoPagoRequest(
	context: IExecuteFunctions,
	method: string,
	url: string,
	accessToken: string,
	body?: IDataObject,
): Promise<IDataObject> {
	const options: RequestInit = {
		method,
		headers: {
			'Authorization': `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
		},
	};

	if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
		options.body = JSON.stringify(body);
	}

	const response = await fetch(url, options);
	const data = await response.json() as IDataObject;

	if (!response.ok) {
		throw new NodeApiError(context.getNode(), data as JsonObject, {
			message: `Mercado Pago API error: ${response.status} ${response.statusText}`,
			httpCode: String(response.status),
		});
	}

	return data;
}

async function executePaymentPreferenceCreate(
	this: IExecuteFunctions,
	index: number,
	baseUrl: string,
	accessToken: string,
): Promise<IDataObject> {
	const itemsData = this.getNodeParameter('items.itemValues', index, []) as IDataObject[];
	const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;

	const items = itemsData.map((item) => ({
		title: item.title as string,
		quantity: item.quantity as number,
		unit_price: item.unit_price as number,
		currency_id: item.currency_id as string,
		...(item.description ? { description: item.description as string } : {}),
		...(item.id ? { id: item.id as string } : {}),
	}));

	const body: IDataObject = { items };

	// Build back_urls if any are provided
	const backUrls: IDataObject = {};
	if (additionalFields.backUrlSuccess) {
		backUrls.success = additionalFields.backUrlSuccess;
	}
	if (additionalFields.backUrlFailure) {
		backUrls.failure = additionalFields.backUrlFailure;
	}
	if (additionalFields.backUrlPending) {
		backUrls.pending = additionalFields.backUrlPending;
	}
	if (Object.keys(backUrls).length > 0) {
		body.back_urls = backUrls;
	}

	if (additionalFields.notificationUrl) {
		body.notification_url = additionalFields.notificationUrl;
	}

	if (additionalFields.externalReference) {
		body.external_reference = additionalFields.externalReference;
	}

	if (additionalFields.autoReturn) {
		body.auto_return = additionalFields.autoReturn;
	}

	if (additionalFields.expires) {
		body.expires = true;
		if (additionalFields.expirationDateFrom) {
			body.expiration_date_from = additionalFields.expirationDateFrom;
		}
		if (additionalFields.expirationDateTo) {
			body.expiration_date_to = additionalFields.expirationDateTo;
		}
	}

	return await mercadoPagoRequest(this, 'POST', `${baseUrl}/checkout/preferences`, accessToken, body);
}

async function executePaymentGet(
	this: IExecuteFunctions,
	index: number,
	baseUrl: string,
	accessToken: string,
): Promise<IDataObject> {
	const paymentId = this.getNodeParameter('paymentId', index) as string;
	return await mercadoPagoRequest(this, 'GET', `${baseUrl}/v1/payments/${paymentId}`, accessToken);
}

async function executePaymentSearch(
	this: IExecuteFunctions,
	index: number,
	baseUrl: string,
	accessToken: string,
): Promise<IDataObject> {
	const searchOptions = this.getNodeParameter('searchOptions', index, {}) as IDataObject;

	const params = new URLSearchParams();

	if (searchOptions.status) {
		params.append('status', searchOptions.status as string);
	}
	if (searchOptions.sort) {
		params.append('sort', searchOptions.sort as string);
	}
	if (searchOptions.criteria) {
		params.append('criteria', searchOptions.criteria as string);
	}
	if (searchOptions.limit !== undefined) {
		params.append('limit', String(searchOptions.limit));
	}
	if (searchOptions.offset !== undefined) {
		params.append('offset', String(searchOptions.offset));
	}
	if (searchOptions.external_reference) {
		params.append('external_reference', searchOptions.external_reference as string);
	}

	const queryString = params.toString();
	const url = `${baseUrl}/v1/payments/search${queryString ? `?${queryString}` : ''}`;

	return await mercadoPagoRequest(this, 'GET', url, accessToken);
}

async function executeRefundCreate(
	this: IExecuteFunctions,
	index: number,
	baseUrl: string,
	accessToken: string,
): Promise<IDataObject> {
	const paymentId = this.getNodeParameter('paymentId', index) as string;
	const fullRefund = this.getNodeParameter('fullRefund', index) as boolean;

	const body: IDataObject = {};

	if (!fullRefund) {
		const refundAmount = this.getNodeParameter('refundAmount', index) as number;
		body.amount = refundAmount;
	}

	return await mercadoPagoRequest(
		this,
		'POST',
		`${baseUrl}/v1/payments/${paymentId}/refunds`,
		accessToken,
		Object.keys(body).length > 0 ? body : undefined,
	);
}

async function executeMerchantGetInfo(
	this: IExecuteFunctions,
	baseUrl: string,
	accessToken: string,
): Promise<IDataObject> {
	return await mercadoPagoRequest(this, 'GET', `${baseUrl}/users/me`, accessToken);
}
