const _ = require('lodash');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat')
const { GoogleSpreadsheet } = require('google-spreadsheet');
const cache = require('nano-cache');

dayjs.extend(customParseFormat);

// Shared secret. Will prevent basic scrapers (won't stop people
// from extracting the shared key from the Javascript that calls it)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Only allowed CORS from our domain
const allowedOrigins = ['cause-for-hope.raisely.com']

let getRowsPromise = null;

/**
 * Example Cloud Function that catches webhooks from Raisely
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
exports.integration = async function integration(req, res) {
	// CORS so custom events can also be sent from the browser
	res.set('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
	res.set(
		'Access-Control-Allow-Headers',
		'Access-Control-Allow-Headers, Authorization, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers'
	);
	// only allow CORS from specific hosts
	const allowedOrigin = allowedOrigins.includes(req.headers.origin) ? req.headers.origin : allowedOrigins[0];
	res.set('Access-Control-Allow-Origin', allowedOrigin);
	res.set('Access-Control-Allow-Credentials', true);
	res.set('Access-Control-Max-Age', '86400');

	// If it's an options request, end here
	if (req.method.toLowerCase() === 'options') {
		res.status(204).send();
		return true;
	}

	// Throw 403 if not authenticated
	if (!authenticate(req, res)) return false;

	// If we need to clear the cache
	if (req.query.clearCache) {
		cache.clear();
	}

	let rows = await getCachedRows();

	const response = {
		data: rows,
		pagination: {
			page: 1,

		}
	}

	res.status(200).send(response);
	return true;
};

/**
 * Verify that the webhook came from raisely by checking the shared secret
 * If authentication fails, will set a 200 response
 * (to prevent Raisely from continuing to retry the webhook with a bad secret)
 * @param {*} req
 * @param {*} res
 * @returns {boolean} true if the request is authenticated
 */
function authenticate(req, res) {
	const secret = req.headers.authorization;

	if (secret && secret.toLowerCase() === `bearer ${WEBHOOK_SECRET}`.toLowerCase()) return true;

	res.status(403).send({ success: false, error: 'unauthorized' });
	return false;
}

function formatRows(rows) {
	const realKeys = Object.keys(rows[0]).filter(r => !r.startsWith('_'));
	const filteredRows = rows
		.filter(row => row['Share on'])
		.filter(row => {
			// Convert date to ISO8601
			const formatted = dayjs(row['Share on'], 'D/M/YYYY');
			row['Share on'] = formatted.isValid() ? formatted.format('YYYY-MM-DD') : null;
			return row;
		})
		.filter(row => row['Share on'])
		.map(r => _.pick(r, realKeys));
	return groupByDate(filteredRows);
}

function groupByDate(rows) {
	const byDate = {};
	rows.forEach(row => {
		const date = row['Share on'];
		if (!byDate[date]) byDate[date] = [];
		byDate[date].push(row);
	});
	return byDate;
}

/**
 * Get the spreadsheet rows from the cache or fetch them
 */
async function getCachedRows() {
	let rows = cache.get('rows');

	if (!rows) {
		// Save the promise so if others come looking for
		// the rows we don't send multiple requests
		if (!getRowsPromise) getRowsPromise = getRows();
		try {
			rows = await getRowsPromise;
			if (getRowsPromise) {
				rows = formatRows(rows);
				cache.set('rows', rows, {
					ttl: 10 * 60 * 1000,
				});
			} else {
				// Someone else has stored the rows in
				// cache, no need to format
				rows = cache.get('rows');
			}
		} finally {
			// Always clear the promise at the
			// end so we re-fetch when the cache
			// expires or the request fails
			getRowsPromise = null;
		}
	}

	return rows;
}


/**
 * Get rows from Google Sheets
 */
async function getRows() {
	// spreadsheet key is the long id in the sheets URL
	const doc = new GoogleSpreadsheet(process.env.SHEET_KEY);

	// use service account creds
	await doc.useServiceAccountAuth({
		client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
		private_key: process.env.GOOGLE_PRIVATE_KEY,
	});

	// loads document properties and worksheets
	await doc.loadInfo();
	const sheet = doc.sheetsByIndex.find(sheet => sheet.title === 'Actions');

	const rows = await sheet.getRows();

	return rows;
}
