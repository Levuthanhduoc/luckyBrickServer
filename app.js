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
const { fileManager } = require('./modules/fileManager');

//init data base
init()
const corsOption ={
  origin : [`${process.env.FRONTEND}`,"http://localhost:5173"],
  credentials: true,
}
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  keyGenerator: (req) => {
    // Use the `X-Forwarded-For` header if trust proxy is enabled
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  },
});


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('trust proxy', true);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'", "http://localhost:5173",`${process.env.FRONTEND}`],
        "script-src": ["'self'", "'unsafe-eval'","http://localhost:5173",`${process.env.FRONTEND}`],
        "worker-src": ["'self'", "http://localhost:5173","blob:", "'unsafe-eval'",`${process.env.FRONTEND}`],
        "frame-ancestors": ["'self'", "http://localhost:5173",`${process.env.FRONTEND}`],
        "frame-src": ["'self'", "http://localhost:5173",`${process.env.FRONTEND}`],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(limiter);
app.use(cors(corsOption));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/storage",fileManager,express.static(path.join(__dirname, 'uploads')));

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
