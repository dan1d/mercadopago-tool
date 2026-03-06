import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class MercadoPagoApi implements ICredentialType {
	name = 'mercadoPagoApi';
	displayName = 'Mercado Pago API';
	documentationUrl = 'https://www.mercadopago.com.br/developers/en/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'The Mercado Pago Access Token. Found in your application credentials at https://www.mercadopago.com/developers/panel/app',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.mercadopago.com',
			url: '/users/me',
			method: 'GET',
		},
	};
}
