const express = require("express")
const router = express.Router()
const {registerUser , loginUser, logout,updateUserRole,deleteUser, getAllUsers, getUserDetailsByEmail, getUserDetailsById,updateUserDetails, addReview, AlluserDel, changePassword,  sendToken, sendOtpForLogin, loginUsertest} = require("../controllers/userController")
const {isAuthenticatedUser,isAdmin, authenticateUser} = require("../middleware/auth");


router.route("/register").post(registerUser)
router.route("/logout").get(authenticateUser,logout)
router.get("/user/id/:id", getUserDetailsById);
router.get("/user/email/:email",isAuthenticatedUser,getUserDetailsByEmail);
router.post('/products/:productId/reviews', isAuthenticatedUser, addReview);
router.post('/user/change/password', changePassword)
router.get("/getToken", sendToken);
router.post("/sendOtp", sendOtpForLogin);
router.route("/loginUserTest").post(loginUsertest)

// Admin route: only acces by adimn
router.patch("/user/email/:email",updateUserDetails);
router.patch('/user/:userId/role', isAuthenticatedUser, isAdmin, updateUserRole);
router.get('/users', getAllUsers);
router.delete('/users/delete/:userId', deleteUser);





router.delete('/deleteUsersWithUserRole', AlluserDel)
module.exports=router;