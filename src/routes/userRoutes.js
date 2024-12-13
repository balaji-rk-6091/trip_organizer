const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/fetch', auth, userController.fetchUserDetails); // Protect this route with auth middleware
router.put('/update-payment-status', auth, userController.updatePaymentStatus); // Protect this route with auth middleware
router.put('/add-family-details', auth, userController.updateFamilyDetails); // Protect this route with auth middleware
router.put('/update-family-member', auth, userController.updateFamilyMemberDetails); // Protect this route with auth middleware

module.exports = router;