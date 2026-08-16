const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers-mongodb/dashboardController');
const authMiddleware = require('../middleware/auth-mongodb');
router.get('/principal', authMiddleware, DashboardController.principal);
router.get('/dispositivo/:id', authMiddleware, DashboardController.dispositivo);
router.get('/plantas', authMiddleware, DashboardController.plantas);
module.exports = router;