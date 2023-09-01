const express = require("express")
const { getAllProducts, createProduct,updateProduct,deleteProduct,gettSingleProducts } = require("./controllers/productControll")
const {isAuthenticatedUser ,isAdmin} = require("./middleware/auth");


const router = express.Router()


router.route("/products").get(getAllProducts)
router.route("/products/new").post(createProduct)

router.route('/products/:id').put(updateProduct).delete(deleteProduct).get(gettSingleProducts)


module.exports=router