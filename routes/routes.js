const express = require('express');
const { readingTime } = require('reading-time-estimator');
const { verify } = require('jsonwebtoken');

// IMPORTS
const { Article } = require('../models/models');
const { validateToken } = require('../token');
const { addUserRoleMiddleware } = require('../middlewares/middlewares');

const router = express.Router();

/*router.use((req, res, next) => {
    const token = req.cookies['access-token'];
    if (!token) return console.log('token not provided');
    const accessToken = verify(token, process.env.JWT_SECRET);

    if (!accessToken) {
        req.role = { role: 'user', author: 'user' }
        return next();
    } else {
        req.userInfo = { role: accessToken.role, author: accessToken.username }
        return next()
    }
});*/

router.use(addUserRoleMiddleware);

router.route('/new')
.get(validateToken, (req, res) => {
    let articles = new Article();
    res.render('articles/new', { articles: articles });
})

router.route('/edit/:id')   
.get(async (req, res) => {
    let articles = await Article.findById(req.params.id);
    res.render('articles/edit', { articles: articles });
})

router.route('/') 
.post((req, res, next) => {
    req.articles = new Article();
    next();
}, saveAndRedirect('new'))

router.route('/:slug')
.get(async (req, res) => {
    const articles = await Article.findOne({ slug: req.params.slug });
    if (articles === null) return res.redirect('/'); 
    const adminAccess = req.cookies['access-token'];
    const result = readingTime(articles.sanitizedHTML, 238);
    res.render('articles/show', { articles: articles, adminAccess: adminAccess, readingEstimator: result });
})

router.route('/edit/:id')
.put(async (req, res, next) => {
    req.articles = await Article.findByIdAndUpdate(req.params.id);
    next();
}, saveAndRedirect('edit'));

router.route('/delete/:slug')
.delete(async (req, res) => {
    await Article.findOneAndDelete({ slug: req.params.slug });
    res.redirect('/');
})

function saveAndRedirect(path) {
    return async (req, res) => { 
    let articles = req.articles;
    articles.title = req.body.title,
    articles.description = req.body.description,
    articles.markdown = req.body.markdown,
    articles.createdBy = req.role.author

    try {
        articles = await articles.save();
        res.redirect(`/articles/${articles.slug}`);
    } catch (err) {
        console.log(err);
        res.render(`articles/${path}`, { articles: articles });
    }
}
}

module.exports = router;