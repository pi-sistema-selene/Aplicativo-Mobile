const express = require("express");
const router = express.Router();
const adminAuthMiddleware = require("../middleware/admin-auth-mongodb");
const adminDashboardController = require("../controllers-mongodb/adminDashboardController");

router.get("/stats", adminAuthMiddleware, adminDashboardController.stats);
router.get("/home", adminAuthMiddleware, adminDashboardController.home);

module.exports = router;