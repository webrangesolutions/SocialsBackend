const AppleStrategy = require('@nicokaiser/passport-apple').Strategy;
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const User = require('../../models/user.model'); // Adjust the path according to your project structure

dotenv.config();

passport.use(
  new AppleStrategy(
    {
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      key: fs.readFileSync(
        path.join(__dirname, './config/AuthKey_67FHCH3CU7.p8')
      ),
      callbackURL: process.env.APPLE_CALLBACK_URL,
      scope: ['email'],
    },
    ((accessToken, refreshToken, profile, cb) => {
      // Here, check if the idToken exists in your database!
      const { id, email } = profile;

      User.findOne({
        $and: [{ appleToken: { $exists: true } }, { appleToken: id }, { email }],
      })
        .then((user) => {
          if (user !== null) {
            return cb(null, user);
          }
          stripe.addNewUser(email).then((customer) => {
            // create user
            const userBody = {
              email,
              name: email.split('@')[0],
              appleToken: id,
              customerId: customer.id,
              isVerified: true
            };
            User.create(userBody)
              .then((user) => {
                // send welcome email
                sendEmail({
                  userID: user._id.toString(),
                  templateName: 'welcome',
                  data: {
                    userName: user.name
                  }
                }).catch((error) => {
                  logger.warn({ error }, 'Error sending welcome email');
                });

                cb(null, user);
              })
              .catch((err) => cb(err, null));
          });
        })
        .catch((err) => cb(err, null));
    })
  )
);