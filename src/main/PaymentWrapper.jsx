import {PaymentContext} from "../payment/payment.jsx";
import {useIsoContext} from "katnip";
import {loadStripe} from "@stripe/stripe-js";
import {useRef} from "react";

export default function Wrapper({stripePublishableKey, mockPayment, children}) {
	if (!stripePublishableKey)
		throw new Error("Stripe publishable key is not set");

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
			ref.current.stripePromise=loadStripe(stripePublishableKey);
		}
	}

	return (
		<PaymentContext.Provider value={ref.current}>
			{children}
		</PaymentContext.Provider>
	);
}