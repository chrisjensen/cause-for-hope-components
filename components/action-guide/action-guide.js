(RaiselyComponents, React) => {
	const { Button, ProgressBar } = RaiselyComponents.Atoms;
	const { Communicator } = RaiselyComponents.Modules;
	const { get, sumBy } = RaiselyComponents.Common;

	const SubscribeForm = RaiselyComponents.import('subscribe-form');
	const NotifySubscribe = RaiselyComponents.import('notify-subscribe');

	// Initial steps for someone to complete
	const initialSteps = [{
		name: 'first-actions',
		render: () => <p>Next Step: Complete 2 actions</p>,
		getProgress: ({ actionCount }) => actionCount,
		// Step requires getProgress to be === 2 to be complete
		steps: 2,
	}, {
		name: 'share',
		render: ShareStep,
		steps: 1,
	}, {
		name: 'allow-push',
		render: ({ global, onStepDone }) => <NotifySubscribe global={global} onSubscribe={onStepDone} />,
		steps: 1,
	}, {
		// Bonus step to become an All Star
		name: 'more-actions',
		render: () => <p>Complete 2 more actions to become an All Star</p>,
		getProgress: ({ actionCount }) => Math.max(0, actionCount - 2),
		steps: 2,
	}, {
		name: 'subscribe',
		render: ({ global }) => <SubscribeForm global={global} embed description="Next Step: Keep updated on the latest actions" onSubscribe={onStepDone} />,
		getProgress: ({ global }) => global.user ? 1 : 0,
		steps: 1,
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
			stepIndex: 0,
			mode: 'champion',
			// Hash of individual progress for each step (as some can be partially complete)
			stepProgress: {},
			goal: 4,
			// score
		}

		componentDidMount() {
			this.refreshSteps();
		}

		componentDidUpdate() {
			const actionCount = this.getActionCount();
			if (this.oldActionCount !== actionCount) {
				this.oldActionCount = actionCount;
				this.refreshSteps();
			}
		}

		evaluateSteps() {
			const { global } = this.state;
			const { stepProgress } = this.state;
			const actionCount = this.getActionCount();

			initialSteps.forEach(step => {
				// If the step has a function to evaluate progress and the step
				// is not complete, evaluate it
				if (step.getProgress && ((stepProgress[step.name] || 0) < step.steps)) {
					const progress = step.getProgress({ actionCount, global });
					// Ensure progress never exceeds maximum value
					stepProgress[step.name] = Math.min(step.steps, progress);
				}
			});

			// Sum the value of all steps
			const score = sumBy(initialSteps, step => stepProgress[step.name] || 0);

			this.setState({ stepProgress });
			return { score, stepProgress };
		}

		refreshSteps = () => {
			let { goal, mode, stepIndex } = this.state;
			const { score: oldScore } = this.state;
			const { score, stepProgress } = this.evaluateSteps();
			let step;

			if (score >= goal) {
				// If they've done the regular steps, extend
				// them into bonus steps
				if (mode === 'champion') {
					mode = 'bonus';
					goal = 6;
				} else {
					mode = 'finished';
					step = null;
				}
			}

			// If a step has complete and we were on that step
			// advance to the next unfinished step
			if (score !== oldScore) {
				if (step.steps >= (stepProgress[step.name] || 0)) {
					stepIndex = initialSteps.findIndex(s => stepProgress[s.name] || 0 < s.steps);
					step = initialSteps[stepIndex];
				}
			}

			this.setState({
				goal,
				score,
				mode,
				step,
				stepIndex,
				stepProgress,
			});
		}

		onStepDone(name) {
			const { stepProgress } = this.state;
			stepProgress[name] = (stepProgress[name] || 0) + 1;
			this.setState({ stepProgress }, this.refreshSteps);
		}

		stepForward = () => {
			const { step, stepProgress } = this.state;
			let { actionCount } = this.state;
			if (step.getProgress) actionCount += 1;
			else stepProgress[step.name] = (stepProgress[step.name] || 0) + 1;

			console.log('Got click', step.name, stepProgress[step.name])
			this.setState({ actionCount, stepProgress }, this.refreshSteps);
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
							{step.render({ globals, actionCount, onStepDone: () => this.onStepDone(step.name) })}
						</div>
					)}
					<Button
						className="action-guide__next-button"
						onClick={this.stepForward}
					>&gt;</Button>
					<ProgressBar
						displaySource="custom"
						total={score}
						goal={goal}
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
