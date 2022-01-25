const db = require('./database')
const moment = require('moment')
const crypto = require('crypto')

async function checkSession(request, response, next) {
    const currentDate = moment()
    const whereParam = (request.method === 'GET') ? request.headers.session : request.body.sessionId

    const isValid = await db.query(`SELECT to_timestamp(last_activity)::date from exp_blog_sessions where session_id = $1`, [whereParam])

    if (isValid.rowCount > 0) {
        const lastActivity = moment(isValid.rows[0].last_activity).format('YYYY-MM-DD')
        const dateDiff = currentDate.diff(lastActivity, 'days')

        if (dateDiff > 2) {
            await db.query(`DELETE from exp_blog_sessions where session_id = $1`, [whereParam])
            response.status(408).json({
                status: 'error',
                message: 'Session timeout!'
            })
            return
        }

        const hash = crypto.createHash('sha256').update(process.env.API_KEY + whereParam + request.headers.timestamp).digest('hex')
        await db.query(`UPDATE exp_blog_sessions set last_activity = $1 where session_id = $2`, [moment().unix(), whereParam])

        if (hash === request.headers.securitycode) {
            next()
        } else {
            response.status(401).json({
                status: 'error',
                message: 'Your security code is invalid!'
            })
        }

    } else {
        response.status(408).json({
            status: 'error',
            message: 'Session timeout!'
        })
    }
}

module.exports = checkSession