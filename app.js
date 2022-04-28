const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
require("dotenv").config();
const bcrypt = require('bcrypt');
const saltRounds = 10;


const app = express();
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const port = 3000;

mongoose.connect("mongodb://localhost:27017/userDB");

// Using mongoose Schema method
const userSchema = new mongoose.Schema({ email: String, password: String });


const User = new mongoose.model("User", userSchema);


app.get("/", (req, res) => { //Get request to the home page
    res.render("pages/home");
});

app.route("/login")
    .get((req, res) => { //Get request to the login page
        res.render("pages/login");
    })
    .post((req, res) => {
        User.findOne({ email: req.body.email },
            (error, user) => {
                if (error) {
                    res.send(error);
                } else if (!user) {
                    res.send("You are not registered.");
                } else {
                    bcrypt.compareSync(req.body.password, user.password, (err, result) => {
                        if (err) {
                            console.log(err);
                        } else if (!result) {
                            res.send("Invalid Password");
                        } else {
                            res.render("pages/secrets");
                        }
                    });
                }
            }
        );
    });

app.route("/register")
    .get((req, res) => { //Get request to the register page
        res.render("pages/register");
    })
    .post((req, res) => {
        const newUser = new User({
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, saltRounds)
        });
        newUser.save((error, user) => {
            if (error) {
                res.send(error);
            } else {
                res.render("pages/secrets");
            }
        });
    });

// app.get("/secrets", (req, res) => { //Get request to the secrets page
//     res.render("pages/secrets");
// });
// .post()

app.get("/submit", (req, res) => { //Get request to the submit page
    res.render("pages/submit");
});
// .post()

app.listen(port, () => {
    console.log("Server up and running");
});