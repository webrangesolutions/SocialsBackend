
const passport = require("passport");
const fs = require('fs');
const path = require('path');
const AppleStrategy = require('@nicokaiser/passport-apple').Strategy;
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const User = require('../../models/user.model'); // Adjust the path according to your project structure
// const p8File = require("../../configurations/AuthKey_26JLSMUV95.p8")

dotenv.config();

passport.use(
  new AppleStrategy(
    {
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      key: fs.readFileSync(
        path.join(__dirname, '../../configurations/AuthKey_26JLSMUV95.p8')
      ),
      callbackURL: process.env.APPLE_CALLBACK_URL,
      scope: ['email'],
    },
    ((accessToken, refreshToken, profile, cb) => {
      // Here, check if the idToken exists in your database!
      const { id, email } = profile;

      User.findOne({
        $and: [{ appleToken: { $exists: true } },{ email }],
      })
        .then((user) => {
          if (user !== null) {
            return cb(null, user);
          }
         
        })
        .catch((err) => cb(err, null));
    })
  )
);