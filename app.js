const path = require("path");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const csrf = require("csurf");
const cors = require("cors");
const flash = require("connect-flash"); // special area of the session used for storing messages
const MongoDBStore = require("connect-mongodb-session")(session); // Do not forget to pass your session

require("dotenv/config");
const PORT = process.env.PORT || process.env.DBDEV_PORT; // So we can run on heroku || (OR) localhost:port

const errorController = require("./controllers/error");
const User = require("./models/user");

const app = express();
const store = new MongoDBStore({
  uri: process.env.MONGODB_URL,
  collection: "sessions",
});

// CSRF - Cross Site Request Forgery
const csrfProtection = csrf();

// Constant to handle the file upload naming
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, ".") + "-" + file.originalname
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Template engine EJS
app.set("view engine", "ejs");
app.set("views", "views");

// Routes
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
); // For file uploads, make sure to update the view and form. The input should have a name id that matches the param in single();

app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images"))); // So we can retrieve the images from the DB and display them

// Session saved in DB to handle multiple users with hashed cookie
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

// Add csrf protection after the session has been created
app.use(csrfProtection);

app.use(flash());

// User for testing so we can work with Mongoose
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      throw new Error(err);
    });
});

/* Tell express to load this for every view EXPRESS LOCALS
Add the following anywhere where there is a POST form

  <!-- Do not forget to add the token and the name "_csrf"-->
  <!-- THE NAME MUST BE "_csrf"-->
  <input type="hidden" name="_csrf" value="<%= csrfToken %>" />
*/
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next(); // Do not forget this
});
/* END OF EXPRESS LOCALS */

// Default routes
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

const corsOptions = {
  origin: "https://e-commerce-node-example.herokuapp.com/",
  optionsSuccessStatus: 200,
};

// 404 handler
app.use(errorController.get404).use(cors(corsOptions));
// 500 handler
app.get("/500", errorController.get500).use(cors(corsOptions));

// Connect to DB
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then((result) => {
    app.listen(PORT, () => {
      console.log(`DB connected successfully`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
