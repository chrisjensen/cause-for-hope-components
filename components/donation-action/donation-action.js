(RaiselyComponents, React) => {
	const { Button } = RaiselyComponents.Atoms;
	const { DonationForm } = RaiselyComponents.Molecules;

	return class DonationAction extends React.Component {
		state = {};

		donate = () => this.setState({ showDonate: true });

		render() {
			const { props } = this;
			const { showDonate } = this.state;
			const profile = {
				name: 'ACOSS - Australian Council of Social Services',
				description: `ACOSS are the peak body of Australian advocates for those living with poverty, disadvantage or inequality. People who especially need a voice now.`,
			};

			if (showDonate) {
				return (
					<div className="donation-action">
						<DonationForm
							profileUuid={null}
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
							<p><strong>The organisations the advocate for people and planet depend on the generosity of donors to fund their advocacy.</strong></p>
							<p>{profile.description}</p>
						</div>
						<Button onClick={this.donate} theme="secondary">Donate</Button>
					</div>
				</div>
			);
		}
	}
}
