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
  passport.authenticate('facebook', { scope: ['email'] }) // Ensure 'email' scope is requested
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
      req.logIn(user, async (err) => {
        if (err) {
          console.error("Error logging in user:", err);
          return res.redirect(process.env.CLIENT_URL_FAILURE);
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
          expiresIn: '1h'
        });

        // Redirect with token (you might want to handle this on the client side)
        res.redirect(`${process.env.CLIENT_URL_SUCCESS}?token=${token}`);
      });
    })(req, res, next);
  }
);


// apple
headRouter.get('/apple',
  passport.authenticate('apple'));

headRouter.post('/apple/callback',
  express.urlencoded(),
  passport.authenticate('apple', { failureRedirect: '/login' }),
  (req, res) => {
     // Generate JWT token
     const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
    // Successful authentication, redirect home.
    res.redirect(`${process.env.CLIENT_URL_SUCCESS}?token=${token}`);
  });


module.exports =  headRouter;
