const Razorpay = require("razorpay")
const dotenv = require("dotenv");
dotenv.config({ path: "../config/config.env" });

const instance = new Razorpay({
    key_id:process.env.RAZARPAY_API_KEY,
    key_secret: process.env.RAZARPAY_SECRECT_KEY,
  });
  

module.exports=instance