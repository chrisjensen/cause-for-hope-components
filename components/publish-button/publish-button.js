(RaiselyComponents, React) => function PublishButton() {
	const { getCurrentToken } = RaiselyComponents.api;
	const { Spinner } = RaiselyComponents;
	const { get } = RaiselyComponents.Common;

	const PUBLISH_URL = 'https://asia-northeast1-cause-for-hope.cloudfunctions.net/publish';

	const { mock } = get(this.props, 'global.campaign.mock');
	const { isAdmin } = get(this.props, 'global.user.isAdmin');

	const [state, setState] = React.useState();

	// Don't show the button unless the user is an admin or we're in the
	// Raisely Page editor
	if (!(mock || isAdmin)) return null;

	async function doPublish() {
		setState('loading');
		try {

			const opts = Object.assign({
				mode: 'cors',
				headers: {
					'Content-Type': 'application/json',
				},
				method: 'POST',
			});

			// Send the user's current token so cloud function can verify the
			// request is from an admin
			const token = getCurrentToken();
			if (token) opts.headers.Authorization = `Bearer ${token.replace(/"/g, '')}`;

			console.log('Doing publish', PUBLISH_URL);
			const response = await fetch(PUBLISH_URL, opts);

			// If the request didn't succeed, log the error
			// and try to create a helpful error for the user
			if (response.status !== 200) {
				// Default to showing the response text
				let message = `Error: ${response.statusText}`;

				// But try to get a better message if we can
				message += response.text();
				throw new Error(message);
			}

			setState('done');
		} catch (e) {
			console.error(e);
			setState('error');
		}
	}

	const labels = {
		loading: 'Publishing ...',
		error: 'Publishing Failed',
		done: 'Published!',
	}

	let label = labels[state] || 'Publish Now';

	return (
		<Button onClick={doPublish} disabled={state}>
			{(state === 'loading') && <Spinner />} {label}
		</Button>
	);
}
