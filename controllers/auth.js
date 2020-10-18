const bcrypt = require("bcryptjs");
const User = require("../models/user");

exports.getLogin = (req, res, next) => {
  let message = req.flash('error') // Pull key set in line 31
  if(message.length > 0){
    message = message[0];
  }else{
    message = null;
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    isAuthenticated: false,
    errorMessage: message
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error') // Pull key set in line 31
  if(message.length > 0){
    message = message[0];
  }else{
    message = null;
  }
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Sign up",
    isAuthenticated: false,
    errorMessage: message
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  // Check if user exists
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        // If user is not found, show message to user
        // First param a key, then the message
        req.flash('error', 'Invalid email or password, please try again or sign up');
        return res.redirect("/login");
      }
      bcrypt
        .compare(password, user.password)
        .then((passwordMatch) => {
          if (passwordMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              if (err === undefined) {
                // Do nothing
              } else {
                console.log("ERROR saving session: " + err);
              }
              res.redirect("/");
            });
          }
          res.redirect("/login");
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/login");
        });
    })
    .catch((err) => console.log(err));
};

exports.postSignup = (req, res, next) => {
  // Make sure this names match the name fields in the input fields
  const email = req.body.email;
  const password = req.body.password;

  // Check if user exists
  User.findOne({ email: email })
    .then((userDoc) => {
      if (userDoc) {
        // If user is not found, show message to user
        // First param a key, then the message
        req.flash('error', 'Email already in use, please login or sign up with another email');
        return res.redirect("/signup");
      }

      // Hash password
      return bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
          // User does not exist, create one
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] },
          });
          return user.save();
        })
        .then((result) => {
          // Once a user is created, login
          res.redirect("/login");
        });
    })
    .catch((err) => {
      if (err === undefined) {
        // Do nothing
      } else {
        console.log("Error searching if user's email already exists: " + err);
      }
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err === undefined) {
      // Do nothing
    } else {
      console.log("Error when destroying session: " + err);
    }
    res.redirect("/");
  });
};
