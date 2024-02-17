import {RpcServer} from "fullstack-rpc/server";
import Api from "./Api.js";

export function clientProps(props, ev) {
	props.stripePublicKey=ev.options.stripePublicKey;
}

export function start(ev) {
	ev.data.paymentRpcServer=new RpcServer("payment");
}

export function fetch(req, ev) {
	return ev.data.paymentRpcServer.handleRequest(req,{
		handlerFactory: ()=>new Api(ev)
	});
}
