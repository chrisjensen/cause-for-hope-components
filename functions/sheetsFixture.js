const dayjs = require('dayjs');

// Mock initial google sheet state for use during the tests

const today = dayjs().format('D/M/YYYY');
const lastMonth = dayjs().subtract(1, 'month').format('D/M/YYYY');
const todayISO = dayjs().toISOString();

const mockSheets = [
	{
		title: 'Actions',
		headers: ['Link', 'Description', 'Heading', 'Share on'],
		rows: [
			{ Link: 'https://link1.test/', Heading: 'Newest Action ', 'Share on': today },
			{ Link: 'https://link2.test/', Heading: 'Action 2', 'Share on': today },
			{ Link: 'https://link3.test/', Heading: 'Action 3', 'Share on': today },
			{ Link: 'https://link4.test/', Heading: 'Action 4', 'Share on': today },
			{ Link: 'https://link5.test/', Heading: 'Action 5', 'Share on': today },
			// Too old to be published, so won't be scheduled
			{ Link: 'https://oldlink1.test/', Heading: 'Oldest Action', 'Share on': lastMonth },
		],
	},
	{
		title: 'Wins',
		headers: ['Link', 'Heading', 'Description'],
		rows: [
			{ Link: 'https://win1.test', Heading: 'A big win!', Description: 'We had a big win', 'Share on': today },
			{ Link: 'https://win2.test', Heading: 'A win again!', Description: 'Another big win', 'Share on': today },
		],
	},
	{
		title: 'Social',
		headers: ['Link', 'Type', 'Heading', 'Queued'],
		rows: [
			{ Link: 'https://link6.test/', Type: 'Action', Heading: 'Action 6', 'Queued': todayISO },
			{ Link: 'https://link7.test/', Type: 'Action', Heading: 'Action 7' },
			{ Link: 'https://link8.test/', Type: 'Action', Heading: 'Action 8' },
			{ Link: 'https://link9.test/', Type: 'Action', Heading: 'Action 9' },
			{ Link: 'https://link10.test/', Type: 'Action', Heading: 'Action 10' },
			{ Link: 'https://link11.test/', Type: 'Action', Heading: 'Action 11' },
		]
	},
];

module.exports = mockSheets;
