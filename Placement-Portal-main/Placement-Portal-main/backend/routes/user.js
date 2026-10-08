const express = require('express');

router = express.Router();
 
const {signUp , login , logout , sendOtpForResetPswd , verifyOtp , changePassword} = require('../controllers/Auth');
const {auth, isAdmin} = require('../Middleware/auth')

router.post('/signup',auth,isAdmin,signUp);
router.post('/login',login);
router.get('/logout',logout);
router.post('/sendOtpForResetPswd',sendOtpForResetPswd); 
router.post('/verifyOtp',verifyOtp);
router.post('/changePassword',changePassword);

  
module.exports = router; 
