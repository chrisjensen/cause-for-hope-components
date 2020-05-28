(RaiselyComponents, React) => {
	const { Button, ProgressBar } = RaiselyComponents.Atoms;
	const { Communicator } = RaiselyComponents.Modules;
	const { get, sumBy } = RaiselyComponents.Common;

	const SubscribeForm = RaiselyComponents.import('subscribe-form');

	// Initial steps for someone to complete
	const initialSteps = [{
		name: 'first-actions',
		render: () => <p>Next Step: Complete 2 actions</p>,
		getProgress: ({ actionCount }) => actionCount,
		steps: 2,
	}, {
		name: 'subscribe',
		render: ({ global }) => <SubscribeForm global={global} embed description="Next Step: Keep updated on the latest actions" />,
		steps: 1,
	}, {
		name: 'share',
		render: ShareStep,
		steps: 1,
	}, {
		// Bonus step to become an All Star
		name: 'more-actions',
		render: () => <p>Complete 2 more actions to become an All Star</p>,
		getProgress: ({ actionCount }) => Math.max(0, actionCount - 2),
		steps: 2,
	}];

	const ShareStep = ({ global }) => (
		<React.Fragment>
			<p>Next Step: Invite your friends to act too</p>
			<RaiselyShare
				global={global}
				url="current"
				networks={['facebook','twitter','whatsapp','email','link']}
			/>
		</React.Fragment>
	)

	class ActionGuide extends React.Component {
		state = {
			step: 0,
			completeSteps: 0,
			mode: 'champion',
			stepProgress: {},
			totalSteps: 4,
		}

		componentDidMount() {
			this.refreshSteps();
		}

		evaluateSteps() {
			const { stepProgress } = this.state;
			const actionCount = this.getActionCount();

			initialSteps.forEach(step => {
				if (step.getProgress && ((stepProgress[step.name] || 0) < step.steps)) {
					const progress = step.getProgress({ actionCount });
					// Ensure progress never exceeds maximum value
					stepProgress[step.name] = Math.min(step.steps, progress);
				}
			});

			const completeSteps = sumBy(initialSteps, step => stepProgress[step.name] || 0);

			this.setState({ stepProgress });
			return completeSteps;
		}

		refreshSteps() {
			let { totalSteps, mode, stepProgress } = this.state;
			let completeSteps = 0;
			let step;

			completeSteps = this.evaluateSteps();

			if (completeSteps >= totalSteps) {
				if (mode === 'champion') {
					mode = 'bonus';
					totalSteps = 6;
				} else {
					mode = 'finished';
					step = null;
				}
			}

			if (mode !== 'finished') {
				// Find the first incomplete step
				step = initialSteps.find(s => stepProgress[s.name] || 0 < s.steps)
			}

			this.setState({
				completeSteps,
				totalSteps,
				mode,
				step,
			});
		}

		componentDidUpdate() {
			const actionCount = this.getActionCount();
			if (this.oldActionCount !== actionCount) {
				this.oldActionCount = actionCount;
				this.refreshSteps();
			}
		}

		stepForward = () => {
			const { step, stepProgress, actionCount } = this.state;
			if (step.getProgress) this.setState({ actionCount: (actionCount || 0) + 1 })
			else stepProgress[step.name] = (stepProgress[step.name] || 0) + 1;

			console.log('Got click', step.name, stepProgress[step.name])
			this.setState({ stepProgress });
			this.refreshSteps();
		}

		getActionCount = () => {
			return this.state.actionCount || 0;
			return get(this.props, 'actionData.actionCount', 0);
		}

		render() {
			const { globals } = this.props;
			const { step, completeSteps, mode, totalSteps } = this.state;
			const actionCount = this.getActionCount();

			const headers = {
				champion: `You're just ${totalSteps - completeSteps} steps from becoming a Champion for people and planet`,
				bonus: `Well done! You're a Champion for people & planet`,
				finished: "Amazing! You're an All Star Action Taker!",
			}

			return (
				<div className={`action-guide action-guide--${mode}`} onClick={this.stepForward}>
					<p className="action-guide__header">{headers[mode]}</p>
					{step && (
						<div className="action-guide__step">
							{step.render({ globals, actionCount })}
						</div>
					)}
					<Button
						className="action-guide__next-button"
						onClick={this.steForward}
					>&gt;</Button>
					<ProgressBar
						displaySource="custom"
						total={completeSteps}
						goal={totalSteps}
						showTotal={false}
						showGoal={false}
						style="rounded"
					/>
				</div>
			)
		}
	}

	return function WrappedActionGuide({ ...props }) {
		return (
			<Communicator channelId="actions-taken">
				{({ current: actionData }) => (
					<ActionGuide {...props} actionData={actionData} />
				)}
			</Communicator>
		);
	}
}
