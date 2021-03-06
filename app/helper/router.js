const express = require('express')
const router = express.Router()
const auth = require('../controller/auth.js')
const blogs = require('../controller/blogs')
const checkSession = require('./sessions.js')

router.use(function hitlog(request, response, next) {
    console.log('Time:', Date.now())
    next()
})

router.post('/authentication', auth.login)
router.post('/logout', auth.logout)
router.get('/blogs', blogs.lists)
router.get('/blogs/details/:id', blogs.details)
router.post('/blogs/comments/:postId', blogs.insertComments)

router.use(checkSession)

router.get('/posts', blogs.lists)
router.get('/posts/details/:id', blogs.details)
router.post('/posts', blogs.insertBlogs)
router.put('/posts', blogs.insertBlogs)

module.exports = router