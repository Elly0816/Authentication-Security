const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
require("dotenv").config();
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
require("dotenv").config();



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
const userSchema = new mongoose.Schema({ email: String, password: String });

userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", (req, res) => { //Get request to the home page
    res.render("pages/home");
});

app.route("/login")
    .get((req, res) => {
        res.render("pages/login");
    })
    .post((req, res) => {
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