# katnip-payment

This plugin makes it easy to accept stripe payments in your katnip project.

Install the plugin into your katnip project with:

```bash
npm install -g katnip-cloudflare
```

## Client

On the client side, this plugin provides react functionality to show a payment form. Use it like this:

```jsx
import {usePayment, PaymentForm} from "katnip-payment";

function MyPage() {
	let payment=usePayment({
		onSuccess: order=>{console.log("success!")}
		onError: order=>{console.log("payment failed...")}
	})

	function handlePayment() {
		payment.submitOrder({
			amount: 123,
			currency: "usd",
			something: "app specific"
		});
	}

	return (<>
		<PaymentForm payment={payment}/>
		<button onclick={handlePayment}/>
	</>)
}

```

## Server

Then, on the server, there is an event `payment` triggered when the payment have been submited and confirmed.

If you don't already have one, you need first create a server event handler and point it out from `package.json`:

```json
	{
		"exports": {
			"./katnip-server-hooks": "./server.js"
		}
	}
```

Then, inside `server.js`, create a function to act on the event:

```js
export async function payment(ev) {
	let order=ev.order;

	// At this point, the order will have been confirmed with the stripe api.
}
```