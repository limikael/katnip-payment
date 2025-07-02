import {usePayment, PaymentForm} from "katnip-payment";

export default function() {
	let payment=usePayment({
		onError: err=>console.log("error",err),
		onSuccess: ()=>console.log("success"),
	});

	function handlePayClick() {
		payment.submitOrder({amount: 123, currency: "usd"});
	}

	return (<>
		<div class="p-5">HELLO FROM KATNIP</div>
		<PaymentForm payment={payment}/>
		<button class="p-2" onClick={handlePayClick}>PAY</button>
	</>);
}
