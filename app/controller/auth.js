const db = require('../helper/database')
const { networkInterfaces } = require('os')
const { sha256Generator } = require('../helper/encryptor')
const moment = require('moment')
const { setgroups } = require('process')

async function login(request, response) {
    const { email, password, securityCode } = request.body
    const apiKey = process.env.API_KEY
    const serverHash = sha256Generator('encrypt', apiKey + email + password)

    if (securityCode === serverHash) {
        const ipAddress = await getIpAddress()
        const browserVersion = request.get('user-agent')

        const checkUser = await db.query(`SELECT * from exp_blog_user where email = $1 and password = $2`, [email, password])

        if (checkUser.rowCount > 0) {
            const userdata = {
                id: checkUser.rows[0].id,
                name: checkUser.rows[0].name,
                email: checkUser.rows[0].email
            }

            const session = request.session
            session.sessionID = request.sessionID
            session.userdata = userdata

            await db.query(`INSERT INTO exp_blog_sessions values($1, $2, $3, $4)`, [request.sessionID, ipAddress[0], browserVersion, moment(moment().format('YYYY-MM-DD HH:mm:ss')).unix()])

            response.status(200).json({
                status: 'success',
                message: 'Successfully logged in!',
                session: session
            })
        } else {
            response.status(500).json({
                status: 'error',
                message: 'Incorrect email or password!'
            })
        }
    } else {
        response.status(401).json({
            status: 'error',
            message: 'Your security code is invalid!'
        })
    }

}

async function logout(request, response) {
    await db.query(`DELETE FROM exp_blog_sessions where session_id = $1`, [request.headers.authorization])

    response.status(200).json({
        status: 'success',
        message: 'success'
    })
}

async function getIpAddress() {
    const nets = networkInterfaces()
    const results = []

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                // results[name].push(net.address)
                results.push(net.address)
            }
        }
    }

    return results
}

module.exports = {
    login
}