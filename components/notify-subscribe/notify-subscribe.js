/**
 * Push notification subscribe component
 * Thanks to @Spyna for the tutorial on this
 * https://github.com/Spyna/push-notification-demo/
 */
(RaiselyComponents, React) => {
	const { useEffect, useState } = React;
	const { Spinner } = RaiselyComponents;

	const { api } = RaiselyComponents;
	const { Button } = RaiselyComponents.Atoms;
	const { getData } = api;

	const isNotifySupported = () => "serviceWorker" in navigator && "PushManager" in window;

	return function NotifySubscribe({ onSubscribe }) {
		const [loading, setLoading] = useState(false);
		const [grant, setGrant] = useState(null);
		const [error, setError] = useState(null);
		const [isSubscribing, setSubscribing] = useState();
		const [isSubscribed, setSubscribed] = useState(null);

		useEffect(() => {
			if (isNotifySupported()) {
				setLoading(true);
				setError(false);
				navigator.serviceWorker.register("/sw.js")
					.then(() => {
					})
					.catch(e => {
						setError(e);
						console.error(e);
						setLoading(false);
					});
			}
		}, []);

		useEffect(() => {
			const getExixtingSubscription = async () => {
				try {
					const serviceWorker = await navigator.serviceWorker.ready;
					const existingSubscription = await serviceWorker.pushManager.getSubscription();
					setLoading(false);
					setSubscribed(!!existingSubscription);
				} catch (e) {
					setError(e);
					console.error(e);
					setLoading(false)
				}
			};
			getExixtingSubscription();
		}, []);

		async function doSubscribe() {
			const consent = await Notification.requestPermission();
			if (consent !== 'granted') {
				setGrant('denied');
				return;
			}
			const serviceWorker = await navigator.serviceWorker.ready;
			// subscribe and return the subscription
			try {
				const subscription = await serviceWorker.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: pushServerPublicKey,
				});
				setSubscribing(true);
				await getData(api.users.update({ private: { subscription: JSON.stringify(subscription) }}))
				setSubscribed(true);
				// Notify calling component that subscription is complete
				if (onSubscribe) onSubscribe();
			} catch (err) {
				setSubscribing(false);
				console.error(err);
				setError(err);
			} finally {
				setSubscribing(false);
			}
		}

		if (loading) {
			return <Spinner />;
		}

		if (isSubscribed) {
			return (
				<div className="subscribe">
					<p>{`You're`} subscribed!</p>
				</div>
			)
		}

		if (error) {
			return (
				<div className="subscribe">
					<p className="error">Error subscribing</p>
				</div>
			)
		}

		return (
			<div className="subscribe">
				<p>{`Don't`} miss out! Get notified when {`there's`} more actions to take</p>
				{grant === 'denied' && (
					<p>You need to grant permission for us to send you notifications</p>
				)}
				<Button onClick={doSubscribe} disabled={isSubscribing}>
					{isSubscribing && <Spinner />} Notify Me
				</Button>
			</div>
		);
	};
}
