const mongoose = require("mongoose");
const validator = require("validator");
const bcryptJs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter your Name"],
    maxLength: [30, "Name Cannot exceed 30 character"],
    minLength: [4, "Name shoukd have min 4 character"],
  },
  email: {
    type: String,
    required: [true, "Please Enter your Email"],
  },
  password: {
    type: String,
    required: [true, "Please Enter your password"],

    select: false,
  },
  contactNumber:{
    type: String,
    required:true,
  },
  avatar: {
   type:String,
  //  required:true
  },

  token:{
    type :String
  },

  role: {
    type: String,
    default: "user",
  },
  dateOfJoin: {
    type: Date,

  },
  resetPasswordToken: String,
  expireResetPasswordToken: Date,
});
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  try {
    this.password = await bcryptJs.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// Listen for the "ValidationError" event on the userSchema
userSchema.post("validate", function (error, doc, next) {
  // If validation error occurs, log the error message to the console
  if (error.name === "ValidationError") {
    console.error(error.message);
  }

  next(); // Continue with the normal execution flow
});

// Define the getJWTToken method on the userSchema
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_TOKEN, {
    expiresIn: process.env.JWT_Expires,
  });
};
//compare password

userSchema.methods.comparePassword = async function (enetrPassword) {
  return await bcryptJs.compare(enetrPassword, this.password);
};

//reset password token

// Generating Password Reset Token
userSchema.methods.getResetPasswordToken = function () {
  // Generating Token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hashing and adding resetPasswordToken to userSchema
  this.resetPasswordToken = crypto
    .createHash("sha256") //algoritham
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};
module.exports = mongoose.model("User", userSchema);
