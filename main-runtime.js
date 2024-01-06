import {quickRpc} from "fullstack-utils/hono-quick-rpc";
import Api from "./Api.js";

async function onHonoMiddlewares(hookEvent) {
	console.log("Installing payment middleware...");
	//console.log(hookEvent);

	//let paymentModule=hookEvent.workerModules.katnipPaymentHandler;

	hookEvent.app.use("/payment",quickRpc(c=>new Api(c,hookEvent)));
}

async function onClientProps(hookEvent) {
	hookEvent.props.stripePublicKey=hookEvent.stripePublicKey;
}

export function registerHooks(hookRunner) {
	hookRunner.on("client-props",onClientProps);

	hookRunner.on("hono-middlewares",onHonoMiddlewares,{
		description: "Hono middleware for payment.",
		priority: 16
	});
}