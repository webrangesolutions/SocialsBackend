const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");
const dotenv = require("dotenv").config();
const User = require("../../models/user.model"); // Adjust the path to your User model
const jwt = require("jsonwebtoken");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      scope: ["profile", "email"],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
          });
          await user.save();
        }

        // Create JWT token
        const token = jwt.sign(
          { _id: user._id },
          process.env.TOKEN_SECRET,
          { expiresIn: '1h' } // Optional: set token expiration time
        );

        // Attach token to the user object
        user.authToken = token;

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
