export async function stripeObtainCustomerId(stripeClient, {email, name}) {
	let customers=await stripeClient.customers.list({email: email, limit: 1});
	if (customers.data.length) {
		console.log("existing stripe customer, id=",customers.data[0].id);
		return customers.data[0].id;
	}

	console.log("creating stripe customer");
	let customer=await stripeClient.customers.create({
		email: email,
		name: name,
	});

	return customer.id;
}