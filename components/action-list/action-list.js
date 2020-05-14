/**
 * Action List
 * Renders a list of actions and links to take them along with an "I did this" button
 * to display a fun alert pop up in the live stream
 *
 * Leverages Raisely to Streamlabs webhook to make the alerts pop up in streamlabs
 * https://github.com/chrisjensen/raisely-streamlabs-webhooks
 */
(RaiselyComponents, React) => {
	const { Link, Spinner } = RaiselyComponents;
	const { Button } = RaiselyComponents.Atoms;
	const { dayjs, get } = RaiselyComponents.Common;

	const actionListUrl = 'https://asia-northeast1-cause-for-hope.cloudfunctions.net/action-list';
	// This is going on a public facing website so no need to keep it
	// secret, it just adds a little extra protection against dumb bots
	const actionListSecret = 'ifnotnow_when';

	const allIcons = {
		share: ['📖','✨','🌟','🤩'],
		letter: ['📨','💌','✉️','📝'],
		phone: ['☎️'],
		volunteer: ['🙋‍♀️','🙋🏻‍♀️','🙋🏿‍♀️','🙋🏾‍♀️','🙋🏽‍♀️','🙋🏼‍♀️'],
		petition: ['✍️'],
		training: ['🎓','👩‍🏫','👨‍🏫','👨🏿‍🏫','👨🏾‍🏫','👨🏽‍🏫','👨🏼‍🏫','👨🏻‍🏫','👩🏻‍🏫','👩🏼‍🏫','👩🏽‍🏫','👩🏾‍🏫','👩🏿‍🏫'],
		donate: ['💲','💳'],
		art: ['👩‍🎨', '👩🏻‍🎨','👩🏼‍🎨','👩🏽‍🎨','👩🏾‍🎨','👩🏿‍🎨','👨‍🎨','👨🏻‍🎨','👨🏼‍🎨','👨🏽‍🎨','👨🏾‍🎨','👨🏿‍🎨','🎨'],
		survey: ['📋', '☑️','✔','✏'],
		watch: ['📺','🖥','🎞','🍿'],
	};

	const iconMap = {};
	Object.keys(allIcons).forEach(key => {
		const selected = Math.floor(Math.random() * allIcons[key].length);
		iconMap[key] = allIcons[key][selected];
	});

	function ActionButton({ action, clickAction }) {
		const { isDone } = action;

		const theme = action.Spotlight === 'Share' ? 'primary' : 'secondary';

		if (isDone) {
			return (
				<Button disabled={true} theme={theme}>👍 You Did This!</Button>
			);
		}

		return (
			<Button className="took-action" onClick={(e) => clickAction(e, action)} theme={theme}>
				{action['Link Title'] || 'Act Now'}
			</Button>
		);
	}

	function ActionItem(props) {
		const { action, clickAction, spotlight } = props;

		const onClick = (e) => clickAction(e, action);
		action.emoji = iconMap[(action.Type || '').toLowerCase()];
		return (
			<div className="action-list__item">
				<div className="action-list__body">
					<h3 onClick={onClick}>
						{action.emoji} {action.Link ? (
							<a href={action.Link} onClick={onClick}>{action.Heading}</a>
						) : action.Heading}
					</h3>
					{spotlight === 'act' && (
						<p><strong>If you only take one action today, make it this one</strong></p>
					)}
					{spotlight === 'share' && (
						<div>
							<p><strong>Social change happens when people share a vision for a better world.
								Share this to bring us one circle of friends closer to positive change</strong></p>
						</div>
					)}
					{action.subactions && action.subactions.map(subaction => (
						<Link className="subaction" key={subaction.url} href={subaction.url}>{subaction.label}</Link>
					))}
					{action.Description && <p>{action.Description}</p>}
				</div>
				<div className="action-list__button-wrapper">
					<ActionButton {...props} clickAction={onClick} />
				</div>
			</div>
		);
	}

	return class ActionList extends React.Component {
		state = { actions: {}, actionList: {} };

		componentDidMount() {
			this.load();
		}

		async load() {
			try {
				let url = actionListUrl;
				const clearCache = get(this.props, 'router.location.search').includes('clearCache');
				if (clearCache) url += `?clearCache=1`;
				const response = await fetch(url, { headers: { authorization: `bearer ${actionListSecret}` } });
				if (!response.ok) {
					console.error(await response.text());
					throw new Error('Could not load. Try refreshing the page');
				}
				const body = await response.json();
				const actionList = this.formatDates(body.data);
				this.setState({ actionList });
				this.selectSpotlight(actionList);
			} catch (e) {
				console.error(e);
				this.setState({ error: e.message || 'An unknown error occurred' });
			}
		}

		selectSpotlight(actionList) {
			const { currentDate } = this.state;
			if (actionList[currentDate]) {
				const actionSpotlight = actionList[currentDate].find(r => (r.Spotlight || '').toLowerCase() === 'act');
				const shareSpotlight = actionList[currentDate].find(r => (r.Spotlight || '').toLowerCase() === 'share');
				this.setState({ actionSpotlight, shareSpotlight });
			}
		}

		formatDates(actionList) {
			const result = {};
			// Sort (ISO8601 dates can be sorted lexiographically)
			const dates = Object.keys(actionList).sort().reverse();

			// Set the current state to the first date
			this.setState({ currentDate: dayjs(dates[0]).format('dddd, D MMMM YYYY') });

			dates.forEach(oldDate => {
				const newDate = dayjs(oldDate).format('dddd, D MMMM YYYY');
				result[newDate] = actionList[oldDate];
			});
			return result;
		}

		/**
		 * Send an alert to streamlabs when someone takes action
		 */
		clickAction = async (e, action) => {
			console.log('Clicked', e,action)
			e.preventDefault();
			window.open(action.Link);
			// Try to record unique clicks only
			if (action.isDone) return;
			action.isDone = true;
			this.setState({ lastUpdate: new Date() });

			const url = actionListUrl;

			const opts = Object.assign({
				mode: 'cors',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `bearer ${actionListSecret}`,
				},
				method: 'POST',
				body: {
					data: {
						url: action.Link,
					}
				},
			});

			console.log('Doing fetch', url, opts);
			if (opts.body && typeof opts.body !== 'string') {
				opts.body = JSON.stringify(opts.body);
			}
			const response = await fetch(url, opts);
		}

		render() {
			const actionList = this.state.actionList || {};
			const { actionSpotlight, shareSpotlight } = this.state;
			const dates = Object.keys(actionList);

			if (!Object.keys(actionList).length) return <Spinner />
			return (
				<div className="action-list__wrapper">
					{actionSpotlight && (
						<div className="action-list__spotlight spotlight-act">
							<ActionItem action={actionSpotlight} spotlight="act" clickAction={this.clickAction} />
						</div>
					)}
					{shareSpotlight && (
						<div className="action-list__spotlight spotlight-share">
							<ActionItem action={shareSpotlight} spotlight="share" clickAction={this.clickAction} />
						</div>
					)}
					<p>Since {`you're`} here, why not go the extra mile and support these organisations too ...</p>
					{dates.map(actionDate => (
						<div key={actionDate} className="action-list__date-group">
							<h2>{actionDate}</h2>
							{actionList[actionDate].filter(a => !a.Spotlight).map((action, index) => (
								<ActionItem action={action} clickAction={this.clickAction} key={index} />
							))}
						</div>
					))}
				</div>
			);
		}
	};
};
