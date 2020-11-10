const path = require("path");

const express = require("express");
const { body } = require("express-validator");
const adminController = require("../controllers/admin");

// Protect routes
const isAuth = require("../middleware/is-auth");

const router = express.Router();

// /admin/add-product => GET
router.get("/add-product", isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get("/products", isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post(
  "/add-product",
  [
    body("title", "Title is required with at least 5 characters")
      .isLength({ min: 5 })
      .isString()
      .trim(),
    body("price", "Price is required and should be numeric").isNumeric(),
    body("description", "Description is required with at least 10 characters")
      .isLength({ min: 10 })
      .trim(),
  ],
  isAuth,
  adminController.postAddProduct
);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post(
  "/edit-product",
  [
    body("title", "Title is required with at least 5 characters")
      .isLength({ min: 5 })
      .isString()
      .trim(),
    body("price", "Price is required and should be numeric").isNumeric(),
    body("description", "Description is required with at least 10 characters")
      .isLength({ min: 10 })
      .trim(),
  ],
  isAuth,
  adminController.postEditProduct
);

router.delete("/product/:productId", isAuth, adminController.deleteProduct);

module.exports = router;

