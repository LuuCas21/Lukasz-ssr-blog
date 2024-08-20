const { Login } = require('./models/models');

const checkEmailDB = async (username) => {
    const isUser = await Login.exists({ username: username });
    return isUser;
}

module.exports = checkEmailDB;