const express = require("express")
const router = express.Router()
const stripeController = require("../controllers/paymentController"); // Import the Checkout function

router.post("/payment/process",stripeController.processPayment);
router.get("/stripeapikey",stripeController.sendStripeApiKey);

module.exports = router; 