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
    callbackURL: process.env.FACEBOOK_CALLBACK_URL
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      let user = await User.findOne({ facebookId: profile.id });
      if (!user) {
        // Create a new user if one doesn't exist
        user = await User.create({
          facebookId: profile.id,
          name: profile.displayName,
          // Add other fields as necessary
        });
      }
      return cb(null, user);
    } catch (err) {
      console.error("Error in Facebook Strategy callback:", err);
      return cb(err, null);
    }
  }
));

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

