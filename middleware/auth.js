const ErrorHander = require("../utils/errorHandler");
const jwt = require("jsonwebtoken");
const cookie = require("cookie-parser")
const User = require("../modals/userModal");
const catchAsyncErrors = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
  exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
    const token = req.headers.authorization; // Use the Authorization header to get the token
  
    if (!token || !token.startsWith("Bearer ")) {
      res.locals.isAuthenticated = false;
      return next(new ErrorHander("Please Login to access this resource", 401));
    }
  
    try {
      const decodedData = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET_TOKEN);
  
      // Use async/await to get the user
      const user = await User.findById(decodedData.id);
  
      if (!user) {
        res.locals.isAuthenticated = false;
        return next(new ErrorHander("User not found", 401));
      }
      
      req.user = user; // Attach the user to the request object
      res.locals.isAuthenticated = true; // Set isAuthenticated to true
      next();
    } catch (error) {
      console.error("Token Verification Error:", error);
      res.locals.isAuthenticated = false;
      return next(new ErrorHander("Please Login to access this resource", 401));
    }
  });
  
  
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHander(
          `Role: ${req.user.role} is not allowed to access this resouce `,
          403
        )
      );
    }

    next();
  };
};

exports.isAdmin = (req, res, next) => {
  // Assuming req.user contains the authenticated user data from the isAuthenticatedUser middleware
  if (req.user && req.user.role === 'admin') {
    next(); // User is an admin, proceed to the next middleware or route handler
  } else {
    res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action.' });
  }
};

exports.authenticateUser = (req, res, next) => {
  const token = req.cookies.token; // Assuming the token is stored in a cookie

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
      req.user = decoded; // Attach user information to req.user
    } catch (error) {
      // Handle invalid token or token expiration
      console.error("Token verification error:", error);
    }
  }

  next();
};

