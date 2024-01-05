import stripe from "stripe";

export default class Api {
	constructor({honoContext, paymentModule, stripeSecretKey}) {
		this.c=honoContext;
		this.paymentModule=paymentModule;
		this.stripeSecretKey=stripeSecretKey;
	}

	async confirmPayment(order) {
		console.log("confirming payment intent: "+order.paymentIntentId);

		let stripeClient=stripe(this.stripeSecretKey);
		let intent=await stripeClient.paymentIntents.retrieve(order.paymentIntentId);
		if (intent.status!="succeeded")
			throw new Error("Payment intent status is not succeeded");

		order.transaction_id=intent.id;

		let paymentCallback=this.paymentModule.default;
		await paymentCallback(order,this.c);
		return order;
	}

	async submitPayment(order) {
		let stripeClient=stripe(this.stripeSecretKey);
		let intent=await stripeClient.paymentIntents.create({
			confirm: true,
			amount: order.amount*100,
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
			            user_agent: this.c.req.raw.headers.get("user-agent"),
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
