require('dotenv').config();
const nock = require('nock');
const chai = require('chai');
const chaiSubset = require('chai-subset');

chai.use(chaiSubset);
const { expect } = chai;

const { integration: webhook } = require('./publish')

describe('Publish Webhook', () => {
	let bufferedPosts;
	let result;
	let req;
	let res;
	before(async function beforeTest() {
		this.timeout(10000);

		const testCredentials = require('./test-service-account.json');
		process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = testCredentials.client_email;
		process.env.GOOGLE_PRIVATE_KEY = testCredentials.private_key;

		process.env.SHEET_KEY = '1CtvNeNkpHcYkF36BzigGyoHoyzfSDazSlV0ZOpv-TDQ';

		bufferedPosts = [];

		nock('https://wh.automate.io/')
			.log(console.log)
			.post(/.*/)
			.reply(200, function hook(uri, requestBody) {
				console.log('Called!')
				bufferedPosts.push(requestBody);
				return requestBody;
			})
			.persist();

		({ req, res } = prepare());

		try {
			result = await webhook(req, res);
		} catch (e) {
			console.error(e);
			throw e;
		}
	});
	itSucceeds();
	it('Updates the sheets')
	it('Publishes to buffer', () => {
		expect(bufferedPosts).to.have.length(10);
	});

	function itSucceeds() {
		it('has good result', () => {
			expect(res.body).to.containSubset({ success: true });
			expect(res.statusCode).to.eq(200);
			expect(result).to.eq(true);
		});
	}
});

/**
 * Prepare a mock request to test the cloud function with
 * @param {*} body
 */
function prepare(reqOptions) {
	const req = {
		headers: {
			authorization: `bearer ${process.env.ADMIN_WEBHOOK_SECRET}`,
		},
		method: 'post',
		...reqOptions,
	};
	const res = {};
	res.status = (code) => {
		res.statusCode = code;
		return res.status;
	};
	res.set = (key, val) => {
		if (!res.headers) res.headers = {};
		res.headers[key] = val;
	}
	res.status.send = (response) => (res.body = response);

	return { req, res };
}
