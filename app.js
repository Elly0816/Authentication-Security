const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
require("dotenv").config();
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20");
const FacebookStrategy = require("passport-facebook")

const app = express();
app.use(express.static(`${__dirname}/public`));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const port = 3000;

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {}
}));

app.use(passport.initialize());
app.use(passport.session());



mongoose.connect("mongodb://localhost:27017/userDB");

// Using mongoose Schema method
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    name: String,
    facebookId: String,
});

userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser((user, cb) => { cb(null, user) });
passport.deserializeUser((obj, cb) => { cb(null, obj) });

passport.use(new GoogleStrategy({ //Authenticate with google//////
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        scope: ['profile'],
        state: true
    },
    function(accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOne({ googleId: profile.id }, (err, cred) => {
            if (err) {
                return cb(err);
            }
            if (!cred) {
                // The account at Google has not logged in to this app before.  Create a
                // new user record and associate it with the Google account.
                User.create({ googleId: profile.id, name: profile.displayName }, (err) => {
                    if (err) {
                        return cb(err);
                    }
                    User.findOne({ googleId: profile.id }, (err, user) => {
                        if (err) {
                            return cb(err);
                        }
                        return cb(null, user);
                    });
                });
            } else {
                // The account at Google has previously logged in to the app.  Get the
                // user record associated with the Google account and log the user in.
                return cb(null, cred);
            }
        })
    }));

////Authenticate with Facebook
passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/secrets"
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOne({ facebookId: profile.id }, (err, user) => {
            if (err) {
                console.log(err);
                return cb(err);
            } else if (!user) {
                User.create({ facebookId: profile.id }, (err, user) => {
                    if (err) {
                        console.log(err);
                        return cb(err);
                    } else {
                        User.findOne({ facebookId: profile.id }, (err, user) => {
                            return cb(err, user);
                        });
                    }
                });
            } else {
                return cb(user);
            };
        });
    }
));


app.get("/", (req, res) => { //Get request to the home page
    res.render("pages/home");
});

//Route to authenticate with google
app.get("/auth/google", passport.authenticate('google'));

//Route for google to redirect to after authentication
app.get("/auth/google/secrets", passport.authenticate('google', {
    failureRedirect: "/",
    failureMessage: true
}), (req, res) => {
    res.redirect("/secrets");
});


//Route to authenticate with facebook
app.get("/auth/facebook", passport.authenticate("facebook"));

//Route for facebook to redirect to after authentication
app.get("/auth/facebook/secrets",
    passport.authenticate("facebook", { failureRedirect: "/" }),
    (req, res) => {
        res.redirect("/secrets");
    });



app.route("/login")
    .get((req, res) => {
        res.render("pages/login");
    })
    .post((req, res) => {
        User.findOne({ email: req.body.email }, (err, found) => {
            if (err) {
                console.log(error);
            } else if (!found) {
                res.redirect("/register");
            } else {
                const authenticate = User.authenticate();
                authenticate(req.body.email, req.body.password, (err, user) => { //user is a boolean
                    if (err) {
                        console.log(err);
                        res.redirect("/login");
                    } else if (!user) { //If user returns false
                        console.log(`Incorrect username or password: ${user}`);
                        res.redirect("/login");
                    } else { //If user returns true
                        console.log(`This is the result of authenticating the user: ${user}`);
                        req.login(user, (err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log("Logged in, redirecting to secrets");
                                res.redirect("/secrets");
                            }
                        });
                    }
                });
            }
        });

    });

app.route("/register")
    .get((req, res) => {
        res.render("pages/register");
    })
    .post((req, res) => {
        User.register(new User({ username: req.body.email }), req.body.password,
            (err) => {
                if (err) {
                    console.log(err);
                    res.redirect("/register");
                } else {
                    const authenticate = User.authenticate('local');
                    authenticate(req.body.email, req.body.password, (err, user) => { //user is a boolean
                        if (err) {
                            console.log(err);
                            console.log("There was an error with authentication")
                            res.redirect("/register");
                        } else {
                            console.log(`This is the result of authenticating the user ${user}`);
                            req.login(user, (err) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log("Logged in after registering");
                                    console.log("Registered, redirecting to secrets page");
                                    res.redirect("/secrets");
                                }
                            });

                        }
                    });
                }
            });
    });

app.route("/secrets")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            console.log("Authenticated, showing secrets.");
            res.render("pages/secrets");
        } else {
            console.log("Not logged in, redirecting to login page");
            res.redirect("/login");
        };
    });
// .post()

app.get("/submit", (req, res) => { //Get request to the submit page
    res.render("pages/submit");
});
// .post()

app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            console.log(err);
        }
    });
    console.log("Logged out successfully");
    res.redirect("/");
});

app.listen(port, () => {
    console.log("Server up and running");
});