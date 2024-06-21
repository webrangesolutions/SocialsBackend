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
      user: user? user : {}
    });
  }
);

headRouter.get("/logout", (req, res) => {
	req.logout();
	res.redirect(process.env.CLIENT_URL_SUCCESS);
});

// meta
headRouter.get('/facebook',
  passport.authenticate('facebook',  { scope: ["profile", "email"] }) // Ensure 'email' scope is requested
);

headRouter.get('/facebook/callback',
    passport.authenticate('facebook', {
      successRedirect: process.env.CLIENT_URL_SUCCESS,
      failureRedirect: process.env.CLIENT_URL_FAILURE,
    }),
    (req, res) => {
      // Successful authentication
      const user = req.user;
      res.status(200).send({
        message: user ? "User exist" : "User donot exist",
        user: user? user : {}
      });
    }
  );

// apple
headRouter.get('/apple',
  passport.authenticate('apple'));

  headRouter.get('/apple/callback',
    express.urlencoded(),
    passport.authenticate('apple', { failureRedirect: '/login' }),
    (req, res) => {
      // Generate JWT token if authentication is successful
      const token = jwt.sign({ id: req.user.id }, process.env.SESSION_SECRET, {
        expiresIn: '1h'
      });
      res.redirect(`${process.env.CLIENT_URL_SUCCESS}?token=${token}`);
    }
  );
  


module.exports =  headRouter;
