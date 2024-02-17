import {PaymentContext} from "./Payment.jsx";
import {useIsoContext} from "isoq";
import {loadStripe} from "@stripe/stripe-js";
import {useRef} from "react";

export default function({stripePublicKey, children}) {
	if (!stripePublicKey)
		throw new Error("Stripe public key is not set");

	//console.log("katnip payment client init");
	//console.log("Stripe public key: "+stripePublicKey);

	let iso=useIsoContext();
	let ref=useRef();

	if (!ref.current) {
		ref.current={};

		if (!iso.isSsr())
			ref.current.stripePromise=loadStripe(stripePublicKey);
	}

	return (
		<PaymentContext.Provider value={ref.current}>
			{children}
		</PaymentContext.Provider>
	);
}