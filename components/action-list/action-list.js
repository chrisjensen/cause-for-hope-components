/**
 * Action List
 * Renders a list of actions and links to take them along with an "I did this" button
 * to display a fun alert pop up in the live stream
 *
 * Leverages Raisely to Streamlabs webhook to make the alerts pop up in streamlabs
 * https://github.com/chrisjensen/raisely-streamlabs-webhooks
 */
(RaiselyComponents, React) => {
	const { Link } = RaiselyComponents;
	const { Button } = RaiselyComponents.Atoms;
	const { get } = RaiselyComponents.Common;

	// List of actions
	const actionList = {
		'9 April 2020': [
			{
				label: "Choice - Stop Price Gouging",
				action: 'called for oversight',
				url: 'https://action.choice.com.au/page/58805/petition/1?ea.url.id=4658490',
			},
			{
				label: "Share - Amsterdam to embrace 'doughnut' model to mend post-coronavirus",
				action: 'called for oversight',
				url: 'https://www.theguardian.com/world/2020/apr/08/amsterdam-doughnut-model-mend-post-coronavirus-economy',
			},
			{
				label: "Stop mining in the Sydney water catchment",
				action: 'called for oversight',
				url: 'https://act.greenpeace.org.au/nswmining',
			},
			{
				label: "Donat to a Cure for All",
				action: 'called for oversight',
				url: 'https://actions.sumofus.org/a/covid-cure-held-hostage',
			},
			{
				label: "Webinar - When everything changes, can everything change?",
				action: 'called for oversight',
				url: 'https://www.eventbrite.com.au/e/when-everything-changes-can-everything-change-tickets-101939253050',
			},
			{
				label: "Join training to be part of the solution",
				action: 'called for oversight',
				url: 'https://action.getup.org.au/2020_community_fellowship',
			},
			{
				label: "Join a Mutual Aid Group",
				action: 'called for oversight',
				url: 'http://tiny.cc/9ibhlz',
			},
			{
				label: "Write to the Editor about maintaining the renewable Transition",
				action: 'called for oversight',
				url: 'https://www.solarcitizens.org.au/renewable_recovery_letter?utm_campaign=renewable_recovery_letter&utm_medium=email&utm_source=solarcitizens',
			},
		],
		'7 April 2020 - Special Action before Parliament Reconvenes ': [
			{
				label: "We need Government Oversight during Covid Crisis",
				action: 'called for oversight',
				url: 'https://nb.tai.org.au/covid19_committee',
			},
			{
				label: "Support for All during Covid Crisis - migrants",
				action: 'supported migrants',
				url: 'https://www.getup.org.au/campaigns/racial-justice/demand-support-for-all-during-covid-19-crisis/support-for-all-during-coronavirus-crisis?t=ejn6YFxwZ',
			},
			{
				label: "Support for All during Covid Crisis - Disabled and their Carers",
				action: 'supported dsp',
				url: 'https://www.megaphone.org.au/petitions/raisethedsp-now-equality-for-disabled-people-and-carers',
			},
			{
				label: "Support for All during Covid Crisis - Disabled and their Carers",
				action: 'supported dsp',
				url: 'https://www.megaphone.org.au/petitions/raisethedsp-now-equality-for-disabled-people-and-carers',
			},
			{
				label: "Share stories of people falling through the gaps during Covid",
				action: 'supported dsp',
				url: 'https://greens.org.au/storiesforscotty',
			},
			{
				label: "Support for Temporary Visa holders",
				action: 'supported temporary visas',
				url: 'https://www.colourcode.org.au/campaigns/colour-code/support-temporary-migrants-during-covid-19-crisis/support-temporary-migrants-during-covid-19-crisis',
			},
		],
		'2 April 2020': [
			{
				label: "Don't let big tech mediate our connections",
				action: 'joined telegram',
				subactions: [
					{
						label: 'Telegram',
						url: 'https://telegram.org/',
					},
					{
						label: 'Signal',
						url: 'https://signal.org/',
					},
				],
			},
			{
				label: 'Wage Subsidy for All - Migrant Workers',
				action: 'took action for migrant workers',
				url: 'https://actionnetwork.org/letters/a-wage-subsidy-for-all-including-migrant-workers/',
			},
			{
				label: 'Wage Subsidy for All - Casual Workers',
				action: 'took action for casuals',
				url: 'https://www.megaphone.org.au/petitions/coronavirus-wage-subsidies-now',
			},
			{
				label: 'Federal Jobs Guarantee',
				action: 'supports a jobs guarantee',
				url: 'https://www.getup.org.au/campaigns/covid-recovery/we-need-a-job-guarantee/sign-on-we-need-a-job-guarantee?t=QxOm2cwXk',
			},
			{
				label: 'Release those in immigration detention',
				action: 'supports asylum seekers',
				url: 'http://contact-federalmps.greens.org.au/profiles/contact/modules/contrib/civicrm/extern/url.php?u=368910&qid=98195476',
			},
			{
				label: 'Cancel National Debts',
				action: 'supports cancelling debt',
				url: 'https://secure.avaaz.org/campaign/en/coronavirus_debt_relief_loc_rb/?bkcHmab&v=124440&cl=16928037001&_checksum=535e71a8f1cc74feb6a383813c1c7fa741531cecd17a4c58cb1041b281f719da',
			},
			{
				label: 'Share - Stop bulldozing Forests',
				action: 'supported forests',
				url: 'https://www.nature.org.au/blog/2020/03/stop-logging-koala-habitat/',
			},
			{
				label: 'Join a Letter Storm',
				action: "RSVP'ed to Letter Storm",
				url: 'https://www.eventbrite.com.au/e/mpeg-april-letter-storm-join-us-to-demand-climate-action-from-our-mps-tickets-99155060455',
			},
			{
				label: 'Support a Just Recovery',
				action: "supports a Just Recovery",
				url: 'https://350.org/just-recovery/?akid=117550.302931.heNV17&rd=1&t=9',
			},
			{
				label: 'Share - This is not the apocalypse you were looking for',
				action: "shared the article",
				url: 'https://www.wired.com/story/coronavirus-apocalypse-myths/',
			},
			{
				label: 'Volunteer on the phones for Find a Bed',
				action: 'is holding the phone',
				url: 'https://findabed.com.au/',
			},
			{
				label: 'Spread the Kindness Pandemic',
				action: 'is spreading kindness',
				url: 'https://www.facebook.com/groups/515507852491119/',
			},
		],
		'25 March 2020': [
			{
				label: 'Call for a Morotorium on Evictions',
				action: 'called for an eviction morotorium',
				url: 'https://www.betterrenting.org.au/coronavirus_evictionmoratorium?fbclid=IwAR2M2G6JDj0xrLqUs2-rt_m-hN_E5i6Pa16VhBrjonlkCeXex7bwZglZ_ac',
			},
			{
				label: 'Protect for asylum seekers',
				action: 'protected refugees',
				url: 'https://action.asrc.org.au/covid_19_petition',
			},
			{
				label: 'Call for suspension of obligations on the unemployed',
				action: 'is looking out for the unemployed',
				url: 'https://greens.org.au/campaigns/suspend-mutual-obligations',
			},
			{
				label: 'Declare fracking non-essential',
				action: '✍️ Fracking is non-essential',
				url: 'https://www.getup.org.au/campaigns/first-nations-justice-campaigns/declare-fracking-non-essential/declare-fracking-in-the-nt-non-essential-now',
			},
			{
				label: 'Join a Mutual Aid Group in your area',
				action: 'is doing mutual aid',
				url: 'https://docs.google.com/spreadsheets/d/1J7bjI-2bD4zpvpQM3v1QB9dlbbUgPErnn-JjBq4NrNs/htmlview?fbclid=IwAR2DCyGbIbrUZQuAFCwrB0wHZSFhYN4_XjWhWUfk9cW6kvVF6A4SAynZCY0#',
			},
			{
				label: 'Stop Alan Jones',
				action: 'called advertisers',
				url: 'https://docs.google.com/spreadsheets/d/1ZJ4pe-IyC5iV3MaY9WVpkrDvy1CyFJw66xV2qooT1lc/edit?fbclid=IwAR0eeYQtH5FB7CK1yZhrtSN_skhW84dg-U-9T97x2f-J7yZ3ePC3TFczUiU#gid=1396957034',
			},
			{
				label: 'Share something good for our mental health',
				action: '🧡\'s 🐶 + 🍂',
				url: 'https://twitter.com/chayahyunxx/status/1238148972092354561',
			}
		]
	};

	return class ActionList extends React.Component {
		state = { actions: {} };

		/**
		 * Send an alert to streamlabs when someone takes action
		 */
		didAction = async (action) => {
			const campaignUuid = get(this.props, 'global.campaign.uuid');

			this.state.actions[action.url] = true;
			this.setState({ actions: this.state.actions });

			const url = 'https://us-central1-raisely-custom.cloudfunctions.net/streamlabs';

			const opts = Object.assign({
				mode: 'cors',
				headers: {
					'Content-Type': 'application/json',
				},
				method: 'POST',
				body: {
					secret: 'streamlabs-test',
					data: {
						source: `campaign:${campaignUuid}`,
						type: 'action.taken',
						data: {
							name: 'taking action',
							username: 'someone',
							message: `Someone ${action.action}`,
						},
					}
				},
			});

			console.log('Doing fetch', url, opts);
			if (opts.body && typeof opts.body !== 'string') {
				opts.body = JSON.stringify(opts.body);
			}
			const response = await fetch(url, opts);
		}

		renderButton(action) {
			const isDone = (this.state.actions[action.url]);

			if (isDone) {
				return (
					<Button disabled={true}>Great work!</Button>
				)
			}

			return (
				<Button className="took-action" onClick={() => this.didAction(action)}>
					I did this!
				</Button>
			);
		}

		render() {
			const dates = Object.keys(actionList);
			return (
				<div className="action-list__wrapper">
					{dates.map(actionDate => (
						<div key={actionDate} className="action-list__date-group">
							<h2>{actionDate}</h2>
							{actionList[actionDate].map(action => (
								<div className="action-list__item" key={action.url}>
									<div className="action-list__body">
										<h3>
											{action.url ? (
												<Link href={action.url}>{action.label}</Link>
											) : action.label}
										</h3>
										{action.subactions && action.subactions.map(subaction => (
											<Link className="subaction" key={subaction.url} href={subaction.url}>{subaction.label}</Link>
										))}
										{action.description && <p>{action.description}</p>}
									</div>
									{this.renderButton(action)}
								</div>
							))}
						</div>
					))}
				</div>
			);
		}
	};
};
