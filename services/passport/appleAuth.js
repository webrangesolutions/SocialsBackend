passport.use(new AppleStrategy({
  clientID: 'com.example.account', // Services ID
  teamID: '1234567890', // Team ID of your Apple Developer Account
  keyID: 'ABCDEFGHIJ', // Key ID, received from https://developer.apple.com/account/resources/authkeys/list
  key: fs.readFileSync(path.join('path', 'to', 'AuthKey_XYZ1234567.p8')), // Private key, downloaded from https://developer.apple.com/account/resources/authkeys/list
  scope: ['name', 'email'],
  callbackURL: 'https://example.com/auth/apple/callback'
},
(accessToken, refreshToken, profile, cb) => {
  User.findOrCreate({ exampleId: profile.id }, (err, user) => {
    return cb(err, user);
  });
}
));