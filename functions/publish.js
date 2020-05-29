const _ = require('lodash');
const dayjs = require('dayjs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const customParseFormat = require('dayjs/plugin/customParseFormat')
const axios = require('axios');
const pMap = require('p-map');
const webpush = require("web-push");

dayjs.extend(customParseFormat);

// Shared secret. Will prevent basic scrapers (won't stop people
// from extracting the shared key from the Javascript that calls it)
const WEBHOOK_SECRET = process.env.ADMIN_WEBHOOK_SECRET;

const AUTOMATE_WEBHOOK = process.env.AUTOMATE_WEBHOOK;

// Only allowed CORS from our domain
const allowedOrigins = ['https://cause-for-hope.raisely.com', 'https://admin.raisely.com'];

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

	const method = req.method.toLowerCase();

	// If it's an options request, end here
	if (method === 'options') {
		res.status(204).send();
		return true;
	}

	// Throw 403 if not authenticated
	const isAuthentic = await authenticate(req, res);
	if (!isAuthentic) return false;

	try {
		const { socialSheet, winRows, actionRows } = await insertNewLinks();
		const publishedCount = await schedulePosts(req, res, socialSheet, winRows, actionRows);
		if (publishedCount) {
			await sendPushNotifications(publishedCount)
		}
	} catch (e) {
		console.error(e);
		res.status(500).send({ success: false, message: e.message || 'Unknown error' });
		return false;
	}
	return true;
};

async function sendPushNotifications(publishedCount, title) {
	const RAISELY_API = 'https://api.raisely.com/v3';
	const MAX_CONCURRENCY = 50;

	const message = {
		title,
		actionCount: publishedCount,
		url: '/',
	};
	// fetch users from raisely


	// Raisely API doesn't have a is present modifier, but we can hack the Greater Than search to find
	// anything that has a value that's alphabetically "greater than" http which will be any record
	// with a url starting with http
	let nextUrl = `${RAISELY_API}/users?private=1&private.subscriptionGT=http`;
	do {
		// eslint-disable-next-line no-await-in-loop
		const { data } = await axios.get(nextUrl, {
			headers: {
				Authorization: `Bearer ${process.env.RAISELY_API_KEY}`,
			},
		});

		({ nextUrl } = data.pagination);

		// Push to the user
		await pMap(data.data, (user) => pushToUser(user, message), { concurrency: MAX_CONCURRENCY });
	} while (nextUrl);

}

async function pushToUser(user, message) {
	const pushSubscription = user.private.subscription;
	return webpush
		.sendNotification(
			pushSubscription,
			JSON.stringify(message),
		)
		.catch(err => {
			console.log(err);
		});
}

async function insertNewLinks() {
	const document = await getDocument();
	const socialSheet = getSheet(document, 'Social');

	const [actionRows, winRows, socialRows] = await Promise.all([
		getSheet(document, 'Actions').getRows().then(filterRowsByDate),
		getSheet(document, 'Wins').getRows().then(filterRowsByDate),
		socialSheet.getRows(),
	]);

	const newActionRows = findUnscheduledRows(actionRows, socialRows)
		.map(r => ({ ...r, Type: 'Action' }));
	const newWinRows = findUnscheduledRows(winRows, socialRows)
		.map(r => ({ ...r, Type: 'Win' }));

	// Combine them into a new array, alternating [action, win, action, ...]
	const mergedRows = _.flatten(_.zip(newActionRows,newWinRows)).filter(a => a)

	const toInsert = mergedRows.map(row => {
		return _.pick(row, ['Link', 'Type', 'Heading']);
	});
	await socialSheet.addRows(toInsert);

	return { socialSheet, winRows, actionRows };
}

function findUnscheduledRows(sheet, socialSheet) {
	const weekAgo = dayjs()
		.subtract(7, 'days')
		.format('YYYY-MM-DD');
	return sheet
		// Don't share anything that's more than 1 week old
		.filter(row => row['Share on'] > weekAgo)
		.filter(row => !socialSheet.find(r => r.Link === row.Link));
}

async function schedulePosts(req, res, socialSheet, winRows, actionRows) {
	// Reload the rows
	const rows = await socialSheet.getRows();
	// Get oldest 10 rows that haven't been posted
	let rowsToPost = rows
		.filter(r => !r.Queued)
		.slice(0, 10);

	rowsToPost.forEach(row => {
		const originalRows = row.Type === 'Action' ? actionRows : winRows;
		const original = originalRows.find(r => r.Link === row.Link);
		if (original) row.Description = original.Description;
	});

	let published = 0;

	const now = dayjs().toISOString();

	for (let i = 0; i < rowsToPost.length; i++) {
		const row = rowsToPost[i];
		// Just move on if we couldn't find the description for the post
		if (!row.Description) continue;
		console.log(`Publishing: ${row.Heading}`);
		// Only post 10 rows because that's buffer's limit, the rest
		// will silently fail
		await axios.post(AUTOMATE_WEBHOOK, {
			message: `${row.Description} ${row.Link}`,
		});
		row.Queued = now;
		row.save()
			.catch(console.error);
		published += 1;
	}

	res.status(200).send({ success: true, message: `${published} posts buffered` });

	return published;
}

/**
 * Check if the current user is an admin and disallow publishing if they're not
 *
 * @param {*} req
 * @param {*} res
 * @returns {boolean} true if the request is authenticated
 */
async function authenticate(req, res) {
	const secret = req.headers.authorization;

	// Load the details of this user to check if they are an admin
	const url = `${RAISELY_API}/users/me?private=1`;

	const { data: user } = await axios.get(url, {
		headers: {
			Authorization: `Bearer ${secret}`,
		},
	});

	if (user.isAdmin) return true;

	res.status(403).send({ success: false, error: 'unauthorized' });
	return false;
}

function filterRowsByDate(rows) {
	const filteredRows = rows
		.filter(row => row['Share on'])
		.filter(row => {
			// Convert date to ISO8601
			const formatted = dayjs(row['Share on'], 'D/M/YYYY');
			row['Share on'] = formatted.isValid() ? formatted.format('YYYY-MM-DD') : null;
			return row;
		})
		.filter(row => row['Share on']);
	return filteredRows;
}

async function getDocument() {
	// spreadsheet key is the long id in the sheets URL
	const doc = new GoogleSpreadsheet(process.env.SHEET_KEY);

	let credentials;
	if (process.env.GOOGLE_CREDENTIALS_JSON) {
		const jsonCreds = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
		credentials = _.pick(jsonCreds, ['client_email', 'private_key']);
	} else {
		credentials = {
			// use service account creds
			client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
			private_key: process.env.GOOGLE_PRIVATE_KEY,
		};
	}
	await doc.useServiceAccountAuth(credentials);

	// loads document properties and worksheets
	await doc.loadInfo();

	return doc;
}

function getSheet(document, name) {
	const sheet = document.sheetsByIndex.find(s => s.title === name);
	return sheet;
}

