(RaiselyComponents, React) => {
	const { Button, ProgressBar } = RaiselyComponents.Atoms;
	const { DonationForm } = RaiselyComponents.Molecules;
	const { api } = RaiselyComponents;
	const { getData } = api;

	const profilePath = 'original-power';

	return class DonationAction extends React.Component {
		state = { profile: { name: 'Original Power' }};

		componentDidMount() {
			this.load();
		}

		async load() {
			try {
				const profile = await getData(api.profiles.get({ id: profilePath }));
				this.setState({ profile });
			} catch (e) {
				console.error(e);
			}
		}

		donate = () => this.setState({ showDonate: true });

		render() {
			const { props } = this;
			const { profile, showDonate } = this.state;

			if (showDonate) {
				return (
					<div className="donation-action">
						<DonationForm
							profileUuid={profile.uuid}
							title={`Donate to support ${profile.name}`}
							recurring={true}
							integrations={props.integrations}
							global={props.global}
						/>
					</div>
				);
			}
			return (
				<div className="action-list__spotlight spotlight-donate">
					<div className="action-list__item">
						<div className="action-list__body">
							<h3>Donate to support {profile.name}</h3>
							<p><strong>The organisations that advocate for people and planet depend on the generosity of donors to fund their advocacy.</strong></p>
							<p>{profile.description}</p>
						</div>
						<div className="action-list__button-wrapper">
							<Button onClick={this.donate} theme="secondary">Donate</Button>
						</div>
					</div>
					<ProgressBar
						profile={profile}
						statPosition="middle"
						showTotal={false}
						showGoal={false}
						style="rounded"
					/>
				</div>
			);
		}
	}
}
