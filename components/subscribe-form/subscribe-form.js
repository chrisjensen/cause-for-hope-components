(RaiselyComponents, React) => {
	const { api } = RaiselyComponents;
	const { getData, getQuery, save } = api;
	const { dayjs, get, set } = RaiselyComponents.Common;

	const CustomForm = RaiselyComponents.import('custom-form');

	const fields = ['user.preferredName', 'user.email'];

	const steps = [{
		title: 'Subscribe',
		description: 'No spam. Simple emails to keep you informed of the latest actions you can take.',
		fields,
	}];

	function dec2hex (dec) {
		return ('0' + dec.toString(16)).substr(-2)
	}

	// generateId :: Integer -> String
	function randomPassword (len) {
		var arr = new Uint8Array((len || 40) / 2)
		window.crypto.getRandomValues(arr)
		return Array.from(arr, dec2hex).join('')
	}


	return class SubscribeForm extends React.Component {
		save = async (values, formToData) => {
			const { user } = formToData(values);
			const campaignUuid = get(this.props, 'global.campaign.uuid');

			// Signup creates users for login, but we don't need the user
			// to login. So let's keep the form lean by generating a
			// secure password for them
			user.password = randomPassword();
			await getData(api.users.signup({ data: user, campaignUuid }));
		}

		render() {
			const values = this.props.getValues();
			const props = {
				...this.props,
				steps,
				controller: this,
				completeText: '👍 Thanks!',
				actionText: 'Subscribe',
			};

			return (
				<div className="subscribe--form subscribe--box">
					<CustomForm {...{ ...props }} />
				</div>
			);
		}
	}
}
