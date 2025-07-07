const express = require('express');
const router = express.Router();

const authorize = require('../middleware/authorize.middleware')

const threadController = require('../controllers/sale.controller');

router.post('/', threadController.newThread);
router.get('/', authorize, threadController.getAllThreads); 
router.get('/', authorize, threadController.getBatchThreads);
router.get('/', authorize, threadController.getThread);
router.put('/', authorize, threadController.putThread);
router.patch('/', authorize, threadController.patchThread); 
router.delete('/', authorize, threadController.deleteThread); 

module.exports = router;