const { Router } = require('express');

const {signup, login, logout, forgotPassword, resetPassword} = require('../../controllers/authController')
const {checkSignupUserData, protect} = require('../../middlewares/authMiddlewares')

const router = Router();

router.post('/signup', checkSignupUserData, signup)
router.post('/login', login)
router.post('/logout', protect, logout)
router.post('/restore-password', forgotPassword)
router.post('/set-new-password/:otp', resetPassword)


module.exports = router;