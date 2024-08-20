require('dotenv').config({ path: './config.env' });
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const { StatusCodes } = require('http-status-codes');
const bcrypt = require('bcrypt');
const sgMail = require('@sendgrid/mail');

// IMPORTS
const router = require('./routes/routes');
const connectDB = require('./DB/connectDB');
const { Article, Login } = require('./models/models');
const { createToken } = require('./token');
const { logOutAndRedir, addUserRoleMiddleware } = require('./middlewares/middlewares');
const checkEmailDB = require('./sendEmail');

const app = express();

app.use(express.urlencoded({ extended: false }))
app.use(cookieParser());
app.use(express.json());
app.use(helmet());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'views')));
app.use(methodOverride('_method'));
app.use(addUserRoleMiddleware);

// MAIN PAGE
app.get('/', async (req, res) => {
    const articles = await Article.find().sort({ createdAt: 'desc' });
    const userAccess = req.cookies['access-token'];
    let userRole = req.role;
   
    res.render('articles/index', { articles: articles, userAccess: userAccess, userRole: userRole.role, author: req.role.author });
});

// CONTACT PAGE
app.get('/contact', (req, res) => {
    res.render('contact');
})

// ABOUT PAGE
app.get('/about', (req, res) => {
    res.render('about');
})

// LOGIN ROUTES
app.get('/admin/login', (req, res) => {
    res.render('login');
}) 

app.post('/admin/access', async (req, res) => {
    const { username, password } = req.body;

    const user = await Login.findOne({ username: username }, 'username role id password');

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'username or password incorrect' });

    const accessToken = createToken(user);

        res.cookie('access-token', accessToken, {
            maxAge: 60 * 60 * 24 * 30 * 1000,
            httpOnly: true
        });

    res.redirect('/articles/new');
})

// LOGOUT ROUTES
app.get('/admin/logout', (req, res, next) => {
    res.clearCookie('access-token');
    next();
}, logOutAndRedir('/'));

// REGISTER ROUTES
app.get('/admin/register', (req, res) => {
    res.render('register');
})

app.post('/admin/new', async (req, res) => {
    const userPass = req.body.password;
    if (!userPass) return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Please, provide a valid password '});

    bcrypt.hash(userPass, 10, async function(err, hash) {
        Login.create({ username: req.body.username, email: req.body.email, password: hash }).then(user => {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            const msg = {
                to: user.email,
                from: 'LukaSZBlog20@gmail.com',
                subject: 'Welcome welcome',
                text: 'Congrats, your registration was a success. You can now start writing your articles to the world.'
            };

            sgMail.send(msg);

        })
    })

    res.redirect('/admin/login');
})

app.use('/articles', router);

const DB_URL = process.env.DATABASE_URL.replace('<password>', process.env.DATABASE_PASSWORD);

const startDB = async () => {
    try {
        await connectDB(DB_URL);
        app.listen(process.env.PORT, () => console.log(`server is running on port ${process.env.PORT}`));
    } catch(err) {
        console.log(err)
    }
}

startDB().catch(err => console.log(err));