const express = require("express");
const headController = require("../../controller/user/authh.controller");
const passport = require("passport");

const dotenv = require("dotenv").config();

const headRouter = express.Router();

headRouter.post("/register", headController.register);
headRouter.put("/login", headController.login);

// google
headRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

headRouter.get(
	"/google/callback",
	passport.authenticate("google", {
		successRedirect: process.env.CLIENT_URL_SUCCESS,
		failureRedirect: process.env.CLIENT_URL_FAILURE,
	}),
  (req, res) => {
    // Successful authentication
    const user = req.user;
    res.status(200).send({
      message: user ? "Logged in successfully" : "User registered successfully",
      data: {
        authToken: user.authToken,
        name: user.name,
        email: user.email,
        _id: user._id,
      },
    });
  }
);

headRouter.get("/logout", (req, res) => {
	req.logout();
	res.redirect(process.env.CLIENT_URL_SUCCESS);
});


// meta
headRouter.get('/auth/facebook',
  passport.authenticate('facebook'));

headRouter.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });
headRouter.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['user_friends', 'manage_pages'] }));


// apple
headRouter.get('/apple',headController.registerUsingApple);


module.exports =  headRouter;
