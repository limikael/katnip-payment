export async function onPayment({order}) {
	console.log("got payment",order);
}

export async function onFetch({request}) {
    // return new Response("This is the server...");
}

export async function onStart() {
	console.log("start in app...")
}