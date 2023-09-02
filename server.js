const express = require("express");
const app = express();
const Order = require("./modals/orderModal")
const path = require("path")
const cors = require('cors');
const Razorpay =require("razorpay")
const cookieParser = require("cookie-parser")
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });
const userA = require("./modals/userModal");
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const SECRET_KEY = 'OEDKFLJIHYJBAFCQAWSEDRFTGYHUJNIMXCDFVGBHNJDCFVGBHJN'

app.use(cors({
 // Adjust the origin to match your frontend
// / Allow cookies to be included in requests
}));
const port = process.env.PORT;
// Database
app.use(cors())
const conectDb =require("../backend/config/database")
conectDb()
// Route imports

const product = require("../backend/productRoute");
const PaymentRouter = require("./routes/paymentRoutes")
// Middleware
const MiddlewareError = require("./middleware/error")

app.use(MiddlewareError)
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

// Route to verify a token
app.post('/api/v1/verifyToken', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token is missing.' });
  }

  try {
    // Verify the token using the same secret key used for signing
    const decoded = jwt.verify(token, SECRET_KEY);
    
    // If verification is successful, send a success response
    return res.status(200).json({ message: 'Token verified successfully.' });
  } catch (error) {
    return res.status(401).json({ message: 'Token verification failed.' });
  }
});


// //========================================Invoice
app.get('/api/v1/orders/:orderId/download', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // // Check if the user is an admin
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({ message: 'Unauthorized' });
    // }

    res.download(order.invoicePath); // Send the PDF for download
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});
////=======================================invoice end
//orders========
const order = require("./routes/orderRoute")
// payment instance for razarpay
// ============================
// In your activation route
app.get('/activate', async (req, res) => {
  try {
    const activationToken = decodeURIComponent(req.query.token);
    const userActivated = await userA.findOne({ activationToken });

    if (!userActivated) {
      return res.status(400).send("Invalid activation token.");
    }

    // Check if the activation token has expired
    if (userActivated.activationTokenExpires < Date.now()) {
      return res.status(400).send("Activation token has expired.");
    }

    // Mark the user's account as activated
    userActivated.isActivated = true;
    userActivated.activationToken = undefined;
    await userActivated.save();

    // Clear the deletion timeout
    clearTimeout(deletionTimeout);

    const filePath = __dirname + '/temeplete/activated.html';
    res.sendFile(filePath); 
    console.log(filePath);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred.");
  }
});


app.get('/',(req,res)=>{
 res.send("server runing success")
})
// =======================
// ////////////////////////////////////////////////==============================================

app.get('/reset-password', async (req, res) => {
  try {
    const resetPasswordToken = decodeURIComponent(req.query.token);
    console.log("Reset Password Token:", resetPasswordToken); // Log the token

    const user = await userA.findOne({ resetPasswordToken });

    if (!user) {
      console.log("Invalid Token User:", user); // Log the user
      return res.status(400).send("Invalid reset password token.");
    }

    // Redirect the user to the reset password page
    const resetPasswordPagePath = __dirname + '/temeplete/passwordreset.html';
    res.sendFile(resetPasswordPagePath);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred.");
  }
});

app.post('/reset-password', async (req, res) => {
  try {
    const resetPasswordToken = decodeURIComponent(req.query.token);
    console.log("Received reset password token:", resetPasswordToken);

    // Find the user by reset password token
    const user = await userA.findOne({ resetPasswordToken });

    if (!user) {
      console.log("Invalid reset password token.");
      return res.status(400).send("Invalid reset password token.");
    }

    console.log("Found user:", user);

    // Check if the reset password token has expired
    if (user.resetPasswordTokenExpires < new Date()) {
      console.log("Reset password token has expired.");
      return res.status(400).send("Reset password token has expired.");
    }

    // Mark the user's password as changed
    const newPassword = req.body.newPassword;
    console.log("New password:", newPassword);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpires = undefined;
    await user.save();

    console.log("Password changed successfully.");

    // Redirect the user to a success page or send a success response
    const successPagePath = __dirname + '/temeplete/passwordsucess.html';
    res.sendFile(successPagePath);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred.");
  }
});

app.get("/success", (req, res) => {
  const filePath = path.join(__dirname, "/temeplete/passwordsucess.html"); // Change "success.html" to your actual file name
  res.sendFile(filePath);
});


// Routes
const user = require("../backend/routes/userRoutes");
const { authenticateUser } = require("./middleware/auth");
const { deletionTimeout } = require("./controllers/userController");
app.use(cookieParser())

app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", PaymentRouter);

// Start server
const server =app.listen(port, () => {
  console.log("Server is running on port " + port );
});
//unhandled promise rejection

process.on("unhandledRejection",err=>{
  //console log the error
  console.log(`Error: ${err.message}`)

})



app.get("/api/getKey", (req,res) => {
  res.status(200).json({ key:process.env.RAZARPAY_API_KEY})
})
