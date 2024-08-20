const mongoose = require('mongoose');

const connectDB = async (url) => {
    console.log('connected to database');
    await mongoose.connect(url)
};

module.exports = connectDB;