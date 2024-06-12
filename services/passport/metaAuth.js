const express = require('express');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const dotenv = require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('../../models/user.model'); // Adjust the path according to your project structure

const headRouter = express.Router();

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      let user = await User.findOne({ facebookId: profile.id });
      if (!user) {
        user = new User({
          facebookId: profile.id,
          name: profile.displayName,
          email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null,
        });
        await user.save();
      }

      // Create JWT token
      const token = jwt.sign(
        { _id: user._id },
        process.env.TOKEN_SECRET,
      );

      // Attach token to the user object
      user.authToken = token;

      return cb(null, user);
    } catch (err) {
      console.error("Error in Facebook Strategy callback:", err);
      return cb(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
