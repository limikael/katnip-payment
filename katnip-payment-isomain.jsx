import {PaymentContext} from "./Payment.jsx";
import {useIsoContext} from "isoq";
import {loadStripe} from "@stripe/stripe-js";
import {useRef} from "react";

export function Wrapper({stripePublicKey, mockPayment, children}) {
	if (!stripePublicKey)
		throw new Error("Stripe public key is not set");

	//console.log("katnip payment client init");
	//console.log("Stripe public key: "+stripePublicKey);

	let iso=useIsoContext();
	let ref=useRef();

	if (!ref.current) {
		ref.current={};

		if (mockPayment) {
			ref.current.mockPayment=true;
		}

		else {
			ref.current.stripePromise=loadStripe(stripePublicKey);
		}
	}

	return (
		<PaymentContext.Provider value={ref.current}>
			{children}
		</PaymentContext.Provider>
	);
}