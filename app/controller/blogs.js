const db = require('../helper/database')
const moment = require('moment')

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

        if (result.rowCount > 0) {
            response.status(200).json({
                status: 'success',
                message: 'success',
                results: result.rows[0]
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

module.exports = {
    insertBlogs,
    lists,
    details
}