import {quickRpc} from "fullstack-utils/hono-quick-rpc";
import path from "path";
import Api from "./Api.js";

async function onClientProps(hookEvent) {
	hookEvent.props.stripePublicKey=hookEvent.stripePublicKey;
}

async function onClientWrappers(event) {
	event.clientWrappers.push("katnip-payment/client-wrapper.jsx");
}

async function onWorkerModules(hookEvent) {
	let paymentModulePath=path.join(process.cwd(),hookEvent.onPayment);

	console.log("adding payment worker module...");
	hookEvent.workerModules.katnipPayment="katnip-payment/main-runtime.js";
	hookEvent.workerModules.katnipPaymentHandler=paymentModulePath;
}

export function registerHooks(hookRunner) {
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