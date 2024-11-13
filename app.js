var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const {init} = require('./modules/dataBase')
const RateLimit = require("express-rate-limit");
const helmet = require("helmet");
const {AdminOnly,check} = require('./controller/userController');
require('dotenv').config()

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const queryRouter = require('./routes/query');
const legoRouter = require('./routes/lego');

//init data base
init()
const corsOption ={
  origin : [`${process.env.FRONTEND_HOST}`,`${process.env.FRONTEND_HOST}/#/admin/news/edit`,"http://localhost:5173"],
  credentials: true,
}
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
});


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'", "http://localhost:5173"],
        "script-src": ["'self'", "'unsafe-eval'","http://localhost:5173"],
        "worker-src": ["'self'", "http://localhost:5173","blob:", "'unsafe-eval'"],
        "frame-ancestors": ["'self'", "http://localhost:5173"],
        "frameSrc": ["'self'", "http://localhost:5173"],
      },
    },crossOriginResourcePolicy: { policy: "same-site" }
  })
);
app.use(limiter);
app.use(cors(corsOption));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/storage",express.static(path.join(__dirname, 'uploads')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/legos',legoRouter);
app.use('/query',check,AdminOnly,queryRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
