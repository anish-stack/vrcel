const express = require("express")
const router = express.Router()
const {isAuthenticatedUser,isAdmin} = require("../middleware/auth");
const { newOrder,getOrdersByPhoneNumber,deleteOrdersWithZeroTotalPrice, singleorder,deleteOrdersWithNullItems,myOrderEmail,  myOrder, allOrdersAdmin, changeStatus, deleteOrder, deleteProcessingOrders, totalPaymentamount, totalPaymentAmount, deleteAllOrdersAll } = require("../controllers/orderController");


router.route('/order/new').post(newOrder)
router.route('/order/info/:id').get(isAuthenticatedUser,singleorder)
router.route('/me').get(isAuthenticatedUser,myOrder)
router.route('/meOrder/:email').get(myOrderEmail)
router.route('/allorder/:PhoneNo').get(getOrdersByPhoneNumber);




//admin route
router.route("/admin/orders").get( allOrdersAdmin)
router.route('/changeStatus/:id').patch(isAuthenticatedUser,isAdmin, changeStatus);
router.route('/deleteorder/:id').delete(isAuthenticatedUser,isAdmin, deleteOrder);
router.route('/user/cancel/:id').delete(isAuthenticatedUser, deleteOrder);
router.route("/admin/delete").get(deleteProcessingOrders)
router.delete('/delete-orders-with-null-items', deleteOrdersWithNullItems);
router.delete('/delete-orders-with-total-price-zero', deleteOrdersWithZeroTotalPrice);
router.get('/paymentDone',totalPaymentAmount)
router.delete('/allDelete', deleteAllOrdersAll);


module.exports=router
