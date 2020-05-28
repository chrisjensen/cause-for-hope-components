(RaiselyComponents, React) => {
	const { useState, useEffect } = React;

	const { api } = RaiselyComponets;
	const { Button } = RaiselyComponents.Atoms;
	const { getData } = api;

	const isNotifySupported = () => "serviceWorker" in navigator && "PushManager" in window;

	return function NotifySubscribe({ onSubscribe }) {
		const [grant, setGrant] = useState(null);
		const [error, setError] = useState(null);
		const [subscribed, setSubscribed] = useState(null);

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
				await getData(api.users.update({ private: { subscription: subscription.endpoint }}))
				setSubscribed(true);
				if (onSubscribe) onSubscribe();
			} catch (err) {
				console.error(err);
				setError(err);
			}
		}

		return (
			<div className="subscribe">
				<p>{`Don't`} miss out! Get notified when {`there's`} more you can do</p>
				{grant === 'denied' && (
					<p>You need to grant permission for us to send you notifications</p>
				)}
				<Button onClick="doSubscribe">Notify Me</Button>
			</div>
		);
	};
}
