const express = require('express');
const router = express.Router();
const { userById, readUser, updateUser, verify, sendCode, verified, setNumber, userPhoto } = require('../functions/user');
const { requireLogin, hasAuthorization, isAuth, isAdmin } = require('../functions/auth');
const User = require('../schemas/user');
const config = require('../config')
const client = require('twilio')(config.accountSID, config.authToken)

router.get('/auth/:userId', requireLogin, isAuth, isAdmin, (req, res) => {
    res.json({
        user: req.profile
    });
});

// verify
router.post('/send', sendCode)
router.get('/verify', verify)
router.get('/verified/:userId', verified)
router.get('/number/:userId', setNumber)

router.get('/user/:userId', requireLogin, readUser)
router.put('/user/:userId', requireLogin, isAuth, updateUser)
router.get('/user/photo/:userId', userPhoto)

// router.post('/send', sendCode)

router.param('userId', userById);

module.exports = router