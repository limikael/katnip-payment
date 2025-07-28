import {RpcServer} from "fullstack-rpc/server";
import Api from "./Api.js";

export async function clientProps(ev) {
	ev.props.stripePublishableKey=ev.env.STRIPE_PUBLISHABLE_KEY;
	ev.props.mockPayment=ev.env.MOCK_PAYMENT;
}

export async function start({env}) {
	env.paymentRpcServer=new RpcServer("payment");
}

export async function fetch(ev) {
	let {request, env}=ev;

	return env.paymentRpcServer.handleRequest(request,{
		handlerFactory: ()=>new Api(ev)
	});
}
