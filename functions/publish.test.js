require('dotenv').config();
const nock = require('nock');
const chai = require('chai');
const chaiSubset = require('chai-subset');
const sinon = require('sinon');
const sheetsFixture = require('./sheetsFixture');
const assert = require('assert');

chai.use(chaiSubset);
const { expect } = chai;

const { integration: webhook } = require('./publish')

let sandbox;

describe('Publish Webhook', () => {
	let bufferedPosts;
	let result;
	let req;
	let res;
	let sheets;
	before(async function beforeTest() {
		this.timeout(10000);

		sandbox = sinon.sandbox.create();

		const testCredentials = require('./test-service-account.json');
		process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = testCredentials.client_email;
		process.env.GOOGLE_PRIVATE_KEY = testCredentials.private_key;

		process.env.SHEET_KEY = '1CtvNeNkpHcYkF36BzigGyoHoyzfSDazSlV0ZOpv-TDQ';

		nockRaisely();
		mockWebPush();
		sheets = mockSheets(sheetsFixture);

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
	it('Adds to the social sheet', async () => {
		const socialSheet = sheets.find(s => s.title === 'Social');
		const rows = await socialSheet.getRows();
		expect(rows).to.containSubset([
			{ Link: 'https://link6.test/', Type: 'Action', Heading: 'Action 6', 'Queued': todayISO },
			{ Link: 'https://link7.test/', Type: 'Action', Heading: 'Action 7' },
			{ Link: 'https://link8.test/', Type: 'Action', Heading: 'Action 8' },
			{ Link: 'https://link9.test/', Type: 'Action', Heading: 'Action 9' },
			{ Link: 'https://link10.test/', Type: 'Action', Heading: 'Action 10' },
			{ Link: 'https://link11.test/', Type: 'Action', Heading: 'Action 11' },
			{ Link: 'https://win1.test', Type: 'Win', Heading: 'A big win!' },
			{ Link: 'https://link1.test/', Type: 'Action', Heading: 'Newest Action ' },
			{ Link: 'https://win2.test', Type: 'Win', Heading: 'A win again!' },
			{ Link: 'https://link2.test/', Type: 'Action', Heading: 'Action 2' },
			{ Link: 'https://link3.test/', Type: 'Action', Heading: 'Action 3' },
			{ Link: 'https://link4.test/', Type: 'Action', Heading: 'Action 4' },
			{ Link: 'https://link5.test/', Type: 'Action', Heading: 'Action 5' },
		]);
	});
	it('Publishes to buffer', () => {
		expect(bufferedPosts).to.have.length(10);
	});
	it('Marks social sheet entries published', async () => {
		const socialSheet = sheets.find(s => s.title === 'Social');
		const rows = await socialSheet.getRows();
		const queued = rows.slice(0, 11);
		// Assert 10 + the existing row are marked queued
		queued.forEach(row => assert.ok(row.Queued, `${row.Link} has not been queued`));
		// Assert remaining rows were not marked queued
		const skipped = rows.slice(11);
		skipped.forEach(row => assert.ok(!row.Queued, `${row.Link} was queued when it should not have been`));
	});

	after(() => {
		sandbox.restore();
	})

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

function nockRaisely() {
	const mockSubscription = {
		endpoint: 'https://push.test',
		keys: {
			auth: 'XXXXX',
			p256dh: 'YYYY',
		}
	}

	// Nock /users/me
	nock('https://api.raisely.com/v3')
		.get('/users/me?private=1')
		.reply(200, { data: { isAdmin: true } })

	// Nock /users with subscription
		.get('/users')
		.reply(200, { data: [{ private: { subscription: JSON.stringify(mockSubscription) }}]);
}

/**
 * Mock webpush send notification return a resolved promise
 */
function mockWebPush() {
	sandbox
		.stub(webpush, 'sendNotification')
		.returns(Promise.resolve());
}

function mockSheets(sheets, info = {}) {
	const createdSheets = [];

	// Stub calls to google so that it will throw rather than
	// fail strangely if we've missed a method we need to stub
	nock('https://sheets.googleapis.com/');
	sandbox.stub(spreadsheets.GoogleSpreadsheet.prototype, 'useServiceAccountAuth')
		.callsFake(function loadSheets() {
			this._rawProperties = info;
			// Turn the sheet fixtures into Worksheet instances
			sheets.forEach(sheet => {
				const { title } = sheet;
				const sheetId = sheet.sheetId || `${sheet.title}-id`;
				this._updateOrCreateSheet({
					properties: { sheetId, title },
				});
				const worksheet = this._rawSheets[sheetId];
				Object.assign(worksheet, {
					headerValues = sheet.headers,
					_mockSheet = sheet.rows || [],
					_mockRows = [],
				});
				createdSheets.push(worksheet);
			});
			return Promise.resolve();
		});
	sandbox.stub(spreadsheets.GoogleSpreadsheet.prototype, 'loadInfo').returns(Promise.resolve());
	sandbox.stub(spreadsheets.GoogleSpreadsheetWorksheet.prototype, 'getRows')
		.callsFake(function fillWorksheet() {
			// If the rows are empty, check we've initialised them with the nitial dummy data
			if (!this._mockRows.length) {
				this.addRows(this._mockSheet);
			}
			return Promise.resolve(this._mockRows);
		})
	sandbox.stub(spreadsheets.GoogleSpreadsheetWorksheet.prototype, 'addRows')
		.callsFake(function addRows(rows) {
			const offset = 1 + this._mockRows.length;
			const newRows = rows.map((row, i) => new spreadsheets.GoogleSpreadsheetRow(this, offset + i, row));
			this._mockRows = this._mockRows.concat(newRows);
			return Promise.resolve(newRows);
		});
	sandbox.stub(spreadsheets.GoogleSpreadsheetRow.prototype, 'save').returns(Promise.resolve());

	return createdSheets;
}
