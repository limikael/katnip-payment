import stripe from "stripe";

export default class Api {
	constructor(ev) {
		this.ev=ev;
		this.stripeSecretKey=ev.env.STRIPE_SECRET_KEY;
	}

	async mockPayment(order) {
		if (!this.ev.env.MOCK_PAYMENT)
			throw new Error("Mock payments not enabled");

		order.transaction_id="MOCK-"+crypto.randomUUID();

		let paymentEvent={
			...this.ev,
			order
		};

		for (let mod of this.ev.app.modules)
			if (mod.onPayment)
				await mod.onPayment(paymentEvent);

		return order;
	}

	async confirmPayment(order) {
		//console.log("confirming payment intent: "+order.paymentIntentId);

		let stripeClient=stripe(this.stripeSecretKey);
		let intent=await stripeClient.paymentIntents.retrieve(order.paymentIntentId);
		if (intent.status!="succeeded")
			throw new Error("Payment intent status is not succeeded");

		order.transaction_id=intent.id;

		let paymentEvent={
			...this.ev,
			order: order
		};

		for (let mod of this.ev.app.modules)
			if (mod.onPayment)
				await mod.onPayment(paymentEvent);

		return order;
	}

	async submitPayment(order) {
		let stripeClient=stripe(this.stripeSecretKey);
		let intent=await stripeClient.paymentIntents.create({
			confirm: true,
			amount: Math.round(order.amount*100),
			currency: order.currency,
			// In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
			automatic_payment_methods: {enabled: true},
			payment_method: order.paymentMethodId, // the PaymentMethod ID sent by your client
			return_url: order.returnUrl,
			use_stripe_sdk: true,
			mandate_data: {
			    customer_acceptance: {
			        type: "online",
			        online: {
			            //ip_address: req.ip,
			            ip_address: "127.0.0.1",
			            user_agent: this.ev.request.headers.get("user-agent"),
			        },
			    },
		  	},
		});

		return {
			paymentIntentId: intent.id,
			clientSecret: intent.client_secret,
			paymentStatus: intent.status,
		}
	}
}
