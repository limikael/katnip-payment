import {quickRpc} from "fullstack-utils/hono-quick-rpc";
import path from "path";
import Api from "./Api.js";

async function onHonoMiddlewares(hookEvent) {
	console.log("Installing payment middleware...");

	let paymentModulePath=path.join(process.cwd(),hookEvent.onPayment);
	let paymentModule=await import(paymentModulePath);
	//console.log(hookEvent);

	hookEvent.app.use("/payment",quickRpc(c=>new Api({
		honoContext: c, 
		paymentModule: paymentModule,
		stripeSecretKey: hookEvent.stripeSecretKey
	})));
}

async function onClientProps(hookEvent) {
	hookEvent.props.stripePublicKey=hookEvent.stripePublicKey;
}

async function onClientWrappers(event) {
	event.clientWrappers.push("katnip-payment/client-wrapper.jsx");
}

async function onWorkerModules(hookEvent) {
	//console.log("worker modules hook event ",hookEvent);

	let paymentModulePath=path.join(process.cwd(),hookEvent.onPayment);

	console.log("adding payment worker module");
	hookEvent.workerModules.katnipPayment="katnip-payment/worker.js";
	hookEvent.workerModules.katnipPaymentHandler=paymentModulePath;
}

export function registerHooks(hookRunner) {
	hookRunner.on("hono-middlewares",onHonoMiddlewares,{
		description: "Hono middleware for payment.",
		priority: 16
	});

	hookRunner.on("worker-modules",onWorkerModules);

	hookRunner.on("client-wrappers",onClientWrappers);
	hookRunner.on("client-props",onClientProps);

	hookRunner.on("build",()=>{},{
		description: "Check payment settings.",
		options: {
			"stripePublicKey": "The Stripe public key.",
			"stripeSecretKey": "The Stripe secret key.",
			"onPayment": "JS module to call on completed payment."
		}
	});
}