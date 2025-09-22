import dotenv from 'dotenv';
dotenv.config({
     path: '.env.local'
});
import ngrok from '@ngrok/ngrok';

console.log( process.env.NEXT_PUBLIC_NGROK_AUTHTOKEN);

(async function() {
		const listener = await ngrok.forward({
				// The port your app is running on.
				addr: 3000,
				authtoken: process.env.NEXT_PUBLIC_NGROK_AUTHTOKEN,
				domain: process.env.NEXT_PUBLIC_NGROK_RESERVED_DOMAIN,
				// Secure your endpoint with a traffic policy.
				// This could also be a path to a traffic policy file.
				traffic_policy: '{"on_http_request": [{"actions": [{"type": "oauth","config": {"provider": "google"}}]}]}'
		});

		// Output ngrok url to console
		console.log(`Ingress established at ${listener.url()}`);
})();

// Keep the process alive
process.stdin.resume();