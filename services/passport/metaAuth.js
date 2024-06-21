const express = require('express');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const User = require('../../models/user.model'); // Adjust the path according to your project structure

dotenv.config();

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    scope: ["profile", "email"],
      passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ facebookId: profile.id });
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
)
);
passport.serializeUser((user, done) => {
  done(null, user.id); // Serialize user ID
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user); // Deserialize user by ID
  } catch (err) {
    done(err, null);
  }
});

