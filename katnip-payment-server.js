import {RpcServer} from "fullstack-rpc/server";
import Api from "./Api.js";

export function clientProps(ev) {
	ev.props.stripePublicKey=ev.options.stripePublicKey;
	ev.props.mockPayment=ev.options.mockPayment;
}

export function start(ev) {
	ev.appData.paymentRpcServer=new RpcServer("payment");
}

export function fetch(ev) {
	return ev.appData.paymentRpcServer.handleRequest(ev.request,{
		handlerFactory: ()=>new Api(ev)
	});
}
