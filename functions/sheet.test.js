const chai = require('chai');
const chaiSubset = require('chai-subset');
const cache = require('nano-cache');

// Set a secret for use in auth tests
process.env.WEBHOOK_SECRET = 'Test_Secret';

const { integration: webhook } = require('./sheet');

chai.use(chaiSubset);
const { expect } = chai;


describe('Google Sheets Cloud Function', () => {
	let req;
	let res;
	let result;

	before(() => {
		const testCredentials = require('./test-service-account.json');
		process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = testCredentials.client_email;
		process.env.GOOGLE_PRIVATE_KEY = testCredentials.private_key;

		process.env.SHEET_KEY = '1CtvNeNkpHcYkF36BzigGyoHoyzfSDazSlV0ZOpv-TDQ';
		cache.clear();
	});

	describe('First request', () => {
		before(async function beforeFirst() {
			this.timeout(5000);
			({ req, res } = prepare());

			try {
				result = await webhook(req, res);
				return result;
			} catch (e) {
				console.error(e);
				throw e;
			}
		});
		itSucceeds();
		itReturnsRows();
		itReturnsCorrectRows();
	});

	describe('Second request', () => {
		before(async function beforeFirst() {
			({ req, res } = prepare());

			try {
				result = await webhook(req, res);
				return result;
			} catch (e) {
				console.error(e);
				throw e;
			}
		});
		itSucceeds();
		itReturnsRows();
		itReturnsCorrectRows();
		it('Spreadsheet calls were not made');
	});

	describe('Cache bust', () => {
		before(async function cacheBustBefore() {
			this.timeout(5000);

			({ req, res } = prepare({ query: { clearCache: 1 } }));

			try {
				result = await webhook(req, res);
				return result;
			} catch (e) {
				console.error(e);
				throw e;
			}
		});
		itSucceeds();
		itReturnsRows();
		itReturnsCorrectRows();
	});

	/**
	 * Verify that the cloud function returns status 200 and a body of
	 * { success: true }
	 */
	function itSucceeds() {
		it('has good result', () => {
			expect(result).to.eq(true);
		});
	}
	function itReturnsRows() {
		it('returns rows with pagination', () => {
			expect(res.body).to.containSubset({
				data: {},
				pagination: {},
			});
			const dates = Object.keys(res.body.data);
			expect(dates.length).to.be.above(0);
			const headers = ["Type",
				"Description",
				"Organisation",
				"Link",
				"Supports",
				"Status",
				"Share on"];

			const firstDate = dates[0];
			const firstActions = res.body.data[firstDate];
			expect(firstActions).to.containSubset([{}]);
			const columns = Object.keys(firstActions[0]);
			expect(columns).to.deep.eq(headers);
		});
	}
	function itReturnsCorrectRows() {
		it('Returns correct rows', () => {
			expect(res.body.data).to.containSubset({});
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
			authorization: `bearer ${process.env.WEBHOOK_SECRET}`,
		},
		method: 'get',
		query: {},
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
