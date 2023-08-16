const sendEmail = require("../utils/mailSend");
const user = require("../modals/userModal");
const LoginLog = require("../modals/loginModal");
const User = require("../modals/userModal");
const jwt = require('jsonwebtoken');
const sendToken = require("../utils/jwt");
const twilio = require('twilio');
const nodemailer = require('nodemailer');

const bcrypt = require("bcryptjs")
const crypto = require("crypto");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};



// // Initialize Twilio client
// const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// // Initialize Nodemailer
// const transporter = nodemailer.createTransport({
//   service: 'Gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });

// register user
exports.registerUser = catchAsyncErrors(async (req, res) => {
  try {
    const { name, email, password,role,contactNumber,avatar } = req.body;

    // console.log('Received user data:', { name, email });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);     

    console.log('Hashed password:', hashedPassword);

    // Create a new user
    const newUser = new User({
      name,
      email,
      password,
      role,
      contactNumber,
      avatar,
      dateOfJoin: Date.now()
    });

    await newUser.save();

    // console.log('User saved:', newUser);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});


// // Login user=========================================================================
exports.loginUser = async (req, res, next) => {
  const { contactNumber, password } = req.body;

  // checking if user has given password and email both

  if (!contactNumber || !password) {
    return next(new ErrorHandler("Please Enter Email & Password", 400));
  }

  const user = await User.findOne({ contactNumber }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid phone number or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid phone number or password", 401));
  }

  sendToken(user, 200, res);
};



exports.logout = catchAsyncErrors(async (req, res, next) => {
  // Clear the token cookie on the client-side
  res.clearCookie("token"); // Remove the cookie

  // Send a successful response
  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});



// Forget Password===================================================================
exports.forgetPassword = catchAsyncErrors(async (req, res, next) => {
  const foundUser = await user.findOne({ email: req.body.email });

  if (!foundUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Get reset password token=========================================================
  const resetToken = foundUser.getResetPasswordToken();
  await foundUser.save({ validateBeforeSave: false }); // Save before generating token

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${resetToken}`;

  const message = `Your password reset token is:\n\n${resetPasswordUrl}\n\nIf you have not requested this email, please ignore it.`;

  try {
    // Implement the sendEmail function
    await sendEmail({
      email: foundUser.email,
      subject: "Do Something Password Recovery",
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${foundUser.email} successfully`,
    });
  } catch (error) {
    foundUser.resetPasswordToken = undefined;
    foundUser.resetPasswordExpire = undefined;
    await foundUser.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
}); 
// reset password=============================================================================================
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please enter all required fields.", 400));
  }

  const Users = await user.findOne({
    email,
    resetPasswordToken: resetToken,
  });

  Users.password = password;
  Users.resetPasswordToken = undefined;
  Users.resetPasswordExpire = undefined;

  await Users.save();

  sendToken(Users, 200, res);
});

// Get user details by ID=======================================================================================
exports.getUserDetailsById = catchAsyncErrors(async (req, res, next) => {
  const userId = req.params.id; // Assuming the user ID is provided as a route parameter

  // Find the user by ID
  const foundUser = await user.findById(userId);

  if (!foundUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    data: foundUser,
  });
});
// Get user details by email==========================================================================================
exports.getUserDetailsByEmail = catchAsyncErrors(async (req, res, next) => {
  const userEmail = req.params.email; // Assuming the user email is provided as a route parameter

  // Find the user by email
  const foundUser = await user.findOne({ email: userEmail });

  if (!foundUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    data: foundUser,
  });
});

//================================================================================================= updateUserDetails
exports.updateUserDetails = catchAsyncErrors(async (req, res, next) => {
  const userEmail = req.params.email; // Assuming the user email is provided as a route parameter

  // Find the user by email using an object as the filter
  let foundUser = await user.findOne({ email: userEmail });

  if (!foundUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Update the user details with the provided data
  foundUser.name = req.body.name || foundUser.name;
  foundUser.email = req.body.email || foundUser.email;

  if (req.body.avatar) {
    foundUser.avatar = {
      public_id: "sample_id", // You can use the ID provided by the user's uploaded image
      url: "new_avatar_url", // The new URL of the avatar
    };
  }


  await foundUser.save();

  res.status(200).json({
    success: true,
    data: foundUser,
  });}
)


// Function to update user role by admin//================================================================================================= updateUserDetails

exports.updateUserRole = async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  try {
    // Find the user by their ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user role
    user.role = role;
    await user.save();

    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
// Function to get all user data (for admin)//================================================================================================= updateUserDetails

exports.getAllUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    // Count the total number of users
    const totalCount = await User.countDocuments();

    // Calculate total pages based on total users and limit
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch users based on pagination
    const users = await User.find({}, '-password')
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      users,
      totalPages,
      currentPage: page,
      totalCount,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// Function to delete a user by ID (for admin)//================================================================================================= updateUserDetails

exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    // Check if the user with the specified ID exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the user from the database
    await user.remove();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
//================================================================================================= updateUserDetails

// In this controller function, we use User.findById() to check if the user with the specified ID exists. If the user is found, we use user.remove() to delete the user from the database.
exports.deleteUser = async (req, res) => {
const { userId } = req.params;

try {
  // Check if the user with the specified ID exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Delete the user from the database
  await user.deleteOne();

  res.json({ message: 'User deleted successfully' });
} catch (error) {
  console.error('Error deleting user:', error);
  res.status(500).json({ message: 'Internal Server Error' });
}
}
// =============================reviewconst products = require("./modals/productModal");
const Product = require("../modals/productModal");

// Controller function to add a review and rating to a product
exports.addReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, review, name } = req.body;
  const productId = req.params.productId;
  const userId = req.user._id;

  // Find the product by ID
  const product = await Product.findById(productId);

  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }

  // Check if the user has already reviewed the product
  const existingReview = product.reviews.find((r) => r.user.equals(userId));

  if (existingReview) {
    return next(new ErrorHandler('You have already reviewed this product', 400));
  }

  // Add the new review and rating to the product
  product.reviews.push({
    user: userId,
    name, // The name of the user (optional)
    rating,
    comment: review,
  });

  // Update the product's rating and number of reviews
  product.numOfReviews = product.reviews.length;
  product.ratings = product.reviews.reduce((total, review) => total + review.rating, 0) / product.numOfReviews;

  await product.save();

  res.status(201).json({ success: true, message: 'Review added successfully' });
});



exports.AlluserDel = catchAsyncErrors(async (req, res) => {
  try {
    const deletedUsers = await User.deleteMany({ role: 'user' });
    res.json({ message: `${deletedUsers.deletedCount} users with role 'user' deleted` });
  } catch (error) {
    console.error('Error deleting users:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
