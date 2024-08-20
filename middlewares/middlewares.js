const { verify } = require('jsonwebtoken');

function logOutAndRedir(path) {
    return (req, res) => {
        res.redirect(`${path}`);
    }
};

function getUserRole(req) {
    const token = req.cookies['access-token'];
    if (!token) return { role: 'user', author: 'user' }

    const accessToken = verify(token, process.env.JWT_SECRET);

    if (accessToken) {
        return { role: accessToken.role, author: accessToken.username };
    }
}
 
function addUserRoleMiddleware(req, res, next) {
    req.role = getUserRole(req);
    return next();
}

module.exports = { logOutAndRedir, addUserRoleMiddleware };