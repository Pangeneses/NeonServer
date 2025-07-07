const express = require('express');
const router = express.Router();
const multer = require('multer');

//const authorize = require('../middleware/authorize.middleware')

const usersController = require('../controllers/users.controller');

const upload = multer();

router.get('/listed', usersController.getListedUsers);
router.post('/auth/login', usersController.loginUser);

router.post('/', usersController.createUser);
router.put('/:id', usersController.updateUser);

module.exports = router;