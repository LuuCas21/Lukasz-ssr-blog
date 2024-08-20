const { sign, verify } = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');

const createToken = (user) => {
    console.log(user)
    const token = sign({ username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    return token;
}

const validateToken = (req, res, next) => {
    const accessToken = req.cookies['access-token'];
    if (!accessToken) return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'user not authorized' });

    try {
        const validToken = verify(accessToken, process.env.JWT_SECRET);
        
        if (validToken) {
            req.isAuth = true;
            return next();
        }
    } catch (err) {
        console.log(err)
    }
}

module.exports = { createToken, validateToken }