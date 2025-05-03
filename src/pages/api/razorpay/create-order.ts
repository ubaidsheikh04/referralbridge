
I will create a new API route, likely at src/pages/api/razorpay/create-order.ts.
This endpoint will receive the amount (100 INR).
It will use the provided Razorpay key_id (rzp_test_51TABBJcBdp6DS) and key_secret (2Dg1SED1eabs24JaaBOXAoxI - this secret should ideally be stored securely in environment variables, not directly in code) to interact with the Razorpay API using their Node.js SDK.
It will create a Razorpay order for 100 INR and return the order_id along with the key_id to the frontend.
