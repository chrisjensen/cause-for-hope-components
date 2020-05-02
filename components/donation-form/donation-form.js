(RaiselyComponents, React) => {
	const { DonationForm } = RaiselyComponents.Molecules;

	return class CustomDonationWrapper extends React.Component {
		donate = () => this.setState({ showDonate: true });

		render() {
			const { props } = this;
			const { showDonate } = this.state;
			const profile = {
				name: 'ACOSS - Australian Council of Social Services',
				description: `They're the peak body for Australian advocates for those living with poverty, disadvantage or inequality. People who especially need a voice now.`,
			};
			return (
				<div className="action-list__spotlight spotlight-donate">
					{showDonate ? (
						<DonationForm
							profileUuid={null}
							integrations={props.integrations}
							global={props.global}
						/>
					) : (
						<div className="action-list__item">
							<div className="action-list__body">
								<h3>Donate to support {profile.name}</h3>
								<p>{profile.description}</p>
							</div>
							<Button onClick={this.donate}>⚡️ Donate</Button>
						</div>
					)}
				</div>
			);
		}
	}
}
