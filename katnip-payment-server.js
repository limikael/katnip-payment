import {RpcServer} from "fullstack-rpc/server";
import Api from "./Api.js";

export function clientProps(ev) {
	ev.props.stripePublicKey=ev.options.stripePublicKey;
}

export function start(ev) {
	ev.appData.paymentRpcServer=new RpcServer("payment");
}

export function fetch(ev) {
	return ev.appData.paymentRpcServer.handleRequest(ev.request,{
		handlerFactory: ()=>new Api(ev)
	});
}
