const express = require('express');
const router = express.Router();

const usersRoutes = require('./users.routes');
const imagesRoutes = require('./images.routes');
const threadsRoutes = require('./threads.routes');
const postsRoutes = require('./posts.routes');
const articlesRoutes = require('./articles.routes');

router.use('/users', usersRoutes);
router.use('/images', imagesRoutes);
router.use('/threads', threadsRoutes);
router.use('/posts', postsRoutes);
router.use('/articles', articlesRoutes);

module.exports = router;