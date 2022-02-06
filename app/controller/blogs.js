const db = require('../helper/database')
const moment = require('moment')
const { sha256Encryptor, sha256Generator } = require('../helper/encryptor')

async function comments(id) {
    const result = await db.query(`SELECT username, created_date as \"createdDate\", comment_text as \"commentText\" from exp_blog_posts_comments where post__id = $1`, [id])

    return result.rows
}

async function lists(request, response) {
    try {
        const results = await db.query(`SELECT id, title, substring(content, 1, 30) as content, status, to_char(created_date, 'dd Month yyyy') as \"createdDate\", to_char(published_date, 'dd Month yyyy') as \"publishedDate\" from exp_blog_posts`)

        response.status(200).json({
            status: 'success',
            message: 'success',
            results: results.rows
        })
    } catch (errors) {
        console.error(errors)
        response.status(500).json({
            status: 'error',
            message: errors.stack
        })
    }
}

async function insertBlogs(request, response) {
    const { id, title, image, content, status, userId } = request.body

    const currentDate = moment().format('YYYY-MM-DD HH:mm:ss')
    const publishedDate = (parseInt(status) === 1) ? currentDate : null

    try {
        if (id === '') {
            const results = await db.query(`INSERT INTO exp_blog_posts(title, image, content, status, created_by, created_date, published_date) VALUES($1, $2, $3, $4, $5, $6, $7)`, [title, image, content, status, userId, currentDate, publishedDate])

            if (results.rowCount > 0) {
                response.status(200).json({
                    status: 'success',
                    message: 'Successfully added your data!'
                })
            }
        } else {
            const results = await db.query(`UPDATE exp_blog_posts set title = $1, image = $2, content = $3, status = $4, modified_by = $5, modified_date = $6 where id = $7`, [title, image, content, status, userId, currentDate, id])

            if (results.rowCount > 0) {
                response.status(200).json({
                    status: 'success',
                    message: 'Successfully update your data'
                })
            } else {
                response.status(500).json({
                    status: 'error',
                    message: `Posts with id ${id} not found!`
                })
            }
        }
    } catch (errors) {
        response.status(500).json({
            status: 'error',
            message: errors.stack
        })
    }
}

async function details(request, response) {
    try {
        const id = request.params.id

        const result = await db.query(`SELECT * FROM exp_blog_posts where id = $1`, [id])

        const post = result.rows[0]
        const getComments = await comments(id)

        const data = {
            ...post,
            comments: getComments
        }

        if (result.rowCount > 0) {
            response.status(200).json({
                status: 'success',
                message: 'success',
                results: data
            })
        } else {
            response.status(500).json({
                status: 'success',
                message: `The posts with id ${id} not found!`
            })
        }
    } catch (errors) {
        response.status(500).json({
            status: 'error',
            message: errors.stack
        })
    }
}

async function insertComments(request, response) {
    const { postId } = request.params
    const { securitycode, timestamp } = request.headers
    const { username, commentText } = request.body

    const hash = sha256Generator('encrypt', process.env.API_KEY + username + timestamp)
    console.log({})

    if (hash === securitycode) {
        const results = await db.query(`INSERT INTO exp_blog_posts_comments(post__id, username, comment_text, created_date) values($1, $2, $3, $4)`, [postId, username, commentText, moment().format('YYYY-MM-DD HH:mm:ss')])

        const getComments = await comments(postId)

        if (results) {
            response.status(200).json({
                status: 'success',
                message: 'success',
                results: getComments
            })
        }
    } else {
        response.status(401).json({
            status: 'error',
            message: 'Your security code was invalid!'
        })
    }
}

async function getComments(request, response) {
    const { id } = request.body
    const commentResults = await comments(id)

    response.status(200).json({
        status: 'success',
        message: 'success',
        results: commentResults
    })
}

module.exports = {
    insertBlogs,
    lists,
    details,
    insertComments,
    getComments
}