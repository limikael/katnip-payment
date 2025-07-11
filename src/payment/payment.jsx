import {useState, useEffect, useRef, createContext, useContext} from "react";
import {useIsoContext, urlGetParams} from "isoq";
import {useEventUpdate} from "../utils/react-util.jsx";
import urlJoin from "url-join";
import {createRpcProxy} from "fullstack-rpc/client";
//import {loadStripe} from "@stripe/stripe-js";

export const PaymentContext=createContext();

class Payment extends EventTarget{
	constructor({onError, onSuccess, returnUrl, initialBusy, rpc, stripePromise}) {
		super();

		if (!onError || !onSuccess)
			throw new Error("Must handle onError and onSuccess for payments");

		this.rpc=rpc;
		this.onError=onError;
		this.onSuccess=onSuccess;
		this.returnUrl=returnUrl;
		this.localStorageKey="order";
		this.busy=false;
		this.ready=false;
		this.stripePromise=stripePromise;

		if (initialBusy)
			this.busy=true;
	}

	setBusy(busy) {
		this.busy=busy;
		this.dispatchEvent(new Event("change"));
	}

	isBusy() {
		return this.busy;
	}

	isReady() {
		return this.ready;
	}

	getOrder() {
		let orderJson=window.localStorage.getItem(this.localStorageKey);
		let order=JSON.parse(orderJson);

		return order;
	}

	setOrder(order) {
		let orderJson=JSON.stringify(order);
		window.localStorage.setItem(this.localStorageKey,orderJson);
	}

	async initRef(ref) {
		//await new Promise(r=>setTimeout(r,5000));

		this.stripe=await this.stripePromise;
		this.ref=ref;

		const options = {
			mode: 'payment',
			amount: 100, // dummy
			currency: "usd", // dummy
			paymentMethodCreation: 'manual',
		    appearance: {theme: 'stripe'},
		};
		this.elements=this.stripe.elements(options);
		const paymentElementOptions = {
		    layout: "tabs",
		};

		const paymentElement = this.elements.create("payment", paymentElementOptions);
		paymentElement.mount(this.ref.current);
		paymentElement.on("ready",()=>{
			this.ready=true;
			this.dispatchEvent(new Event("change"));
		});

		if (this.getOrder()) {
			try {
				this.setBusy(true);
				await this.checkPaymentStatus();
				this.setBusy(false);
			}

			catch (e) {
				this.setBusy(false);
				//this.setOrder(null);
				await this.onError(e);
			}
		}

		this.setBusy(false);
	}

	// Order must have amount and currency.
	async submitOrder(order) {
		try {
			this.setBusy(true);
			this.elements.update({
				amount: Math.round(order.amount*100),
				currency: order.currency
			});

			let submitResult=await this.elements.submit();
			if (submitResult.error)
				throw new Error(submitResult.error.message);

			let methodResult=await this.stripe.createPaymentMethod({
				elements: this.elements,
			});

			if (methodResult.error)
				throw new Error(methodResult.error.message);

			order.paymentMethodId=methodResult.paymentMethod.id;
			order.returnUrl=this.returnUrl;
			//console.log("submit payment...");
			let submitHandlerResult=await this.rpc.submitPayment(order);
			//console.log(submitHandlerResult);
			order={...order,...submitHandlerResult};
			this.setOrder(order);
			await this.checkPaymentStatus();
			this.setBusy(false);
		}

		catch (e) {
			this.setBusy(false);
			await this.onError(e);
		}
	}

	async checkPaymentStatus() {
		let order=this.getOrder();
		if (!order)
			return;

		let urlParams=urlGetParams(window.location);
		if (urlParams.redirect_status &&
				urlParams.payment_intent==order.paymentIntentId &&
				urlParams.payment_intent_client_secret==order.clientSecret) {
			order.paymentStatus=urlParams.redirect_status;
			this.setOrder(order);
		}

		console.log("checking: ",order);

		switch (order.paymentStatus) {
			case "succeeded":
				console.log("payment succeeded, confirming!!!");
				let confirmResult=await this.rpc.confirmPayment(order);
				this.setOrder(null);
				await this.onSuccess(confirmResult);
				break;

			case "requires_action":
				let result=await this.stripe.handleNextAction({
					clientSecret: order.clientSecret
				});

				if (result.error) {
					console.log(result);
					this.setOrder(null);
					throw new Error(result.error.message);
				}

				else if (result.paymentIntent) {
					order.paymentStatus=result.paymentIntent.status;
					this.setOrder(order);
					await this.checkPaymentStatus();
				}

				else
					throw new Error("Got strange response from Stripe "+JSON.stringify(result));

				break;

			case "failed":
				this.setOrder(null);
				throw new Error("Payment confirmation failed.");
				break;

			default:
				this.setOrder(null);
				throw new Error("Unknown payment status: "+order.paymentStatus);
				break;
		}
	}
}

class MockPayment extends EventTarget {
	constructor({onError, onSuccess, rpc}) {
		super();
		this.mockPayment=true;
		this.onError=onError;
		this.onSuccess=onSuccess;
		this.rpc=rpc;
	}

	initRef() {}

	isReady() {
		return true;
	}

	isBusy() {
		return false;
	}

	async submitOrder(order) {
		try {
			let result=await this.rpc.mockPayment(order);
			this.onSuccess(result);
		}

		catch (e) {
			console.log("mock error payment error",e);
			this.onError(e);
		}
	}
}

export function usePayment(options={}) {
	let iso=useIsoContext();
	let paymentRef=useRef();
	let urlParams=urlGetParams(iso.getUrl());
	let paymentContext=useContext(PaymentContext);

	if (paymentContext.mockPayment) {
		options.rpc=createRpcProxy({
			fetch: iso.fetch,
			url: "/payment"
		});

		if (!paymentRef.current)
			paymentRef.current=new MockPayment(options);
	}

	else {
		if (!paymentContext.stripePromise)
			paymentContext.stripePromise=paymentContext.loadStripe(paymentContext.stripePublishableKey);

		let u=new URL(iso.getUrl());
		options.returnUrl=urlJoin(u.origin,u.pathname);
		options.stripePromise=paymentContext.stripePromise;
		options.rpc=createRpcProxy({
			fetch: iso.fetch,
			url: "/payment"
		});

		if (urlParams.redirect_status)
			options.initialBusy=true;

		if (!paymentRef.current)
			paymentRef.current=new Payment(options);
	}

	useEventUpdate(paymentRef.current,"change");
	return paymentRef.current;
}

export function PaymentForm({payment}) {
	let elementRef=useRef();
	let iso=useIsoContext();

	useEffect(()=>{
		if (iso.isSsr())
			return;

		payment.initRef(elementRef);
	},[]);

	if (payment.mockPayment) {
		return (
			<div ref={elementRef} style="background-color: #0000ff; padding: 16px; color: #ffffff; text-align: center">
				MOCKED PAYMENT
			</div>
		)
	}

	return (
		<div ref={elementRef}/>
	);
}