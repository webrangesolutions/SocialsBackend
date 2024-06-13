const express = require("express");
const headController = require("../../controller/user/authh.controller");
const passport = require("passport");

const dotenv = require("dotenv").config();

const headRouter = express.Router();

headRouter.post("/register", headController.register);
headRouter.put("/login", headController.login);
headRouter.get("/checkUser", headController.checkUser);

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
      message: user ? "User exist" : "User donot exist",
      data: {
        user: user? user : {}
      }
    });
  }
);

headRouter.get("/logout", (req, res) => {
	req.logout();
	res.redirect(process.env.CLIENT_URL_SUCCESS);
});


// meta
headRouter.get('/facebook',
  passport.authenticate('facebook', { scope: ['user_friends', 'email'] }) // Ensure 'email' scope is requested
);

headRouter.get('/facebook/callback',
  (req, res, next) => {
    passport.authenticate('facebook', (err, user, info) => {
      if (err) {
        console.error("Error during authentication:", err);
        return res.redirect(process.env.CLIENT_URL_FAILURE);
      }
      if (!user) {
        return res.redirect(process.env.CLIENT_URL_FAILURE);
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error("Error logging in user:", err);
          return res.redirect(process.env.CLIENT_URL_FAILURE);
        }
        return res.redirect('/');
      });
    })(req, res, next);
  }
);


// apple
headRouter.get('/apple',headController.registerUsingApple);


module.exports =  headRouter;
