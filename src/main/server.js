import {RpcServer} from "fullstack-rpc/server";
import Api from "./Api.js";

export function onStart({env}) {
	env.__CLIENT_PROPS.stripePublishableKey=env.STRIPE_PUBLISHABLE_KEY;
	env.__CLIENT_PROPS.mockPayment=env.MOCK_PAYMENT;
	env.paymentRpcServer=new RpcServer("payment");
}

export function onFetch(ev) {
	let {request, env}=ev;

	return env.paymentRpcServer.handleRequest(request,{
		handlerFactory: ()=>new Api(ev)
	});
}
