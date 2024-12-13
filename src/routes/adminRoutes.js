const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

router.post('/register', adminController.register);
router.post('/login', adminController.login);
router.get('/users', adminAuth, adminController.getUsers); // Protect this route with adminAuth middleware
router.put('/update-payment-status', adminAuth, adminController.updateUserPaymentStatus); // Protect this route with adminAuth middleware
router.get('/dashboard', adminAuth, adminController.getDashboardStats); // Protect this route with adminAuth middleware
router.post('/create-users', adminAuth, adminController.createUsers); // Add this line

module.exports = router;