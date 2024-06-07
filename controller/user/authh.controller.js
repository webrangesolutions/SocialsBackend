const User = require("../../models/user.model");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const jwksClient = require("jwks-rsa");

//VALIDATION
const Joi = require("@hapi/joi");

//validation for register data
const registerValidationSchema = Joi.object({
  name: Joi.string().min(3).required(),
  googleId: Joi.string().min(3),
  email: Joi.string().required(),
  password: Joi.string().min(3),
});

//validation for login data
const loginValidationSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().min(3),
});

const client = jwksClient({
  jwksUri: "https://sandrino.auth0.com/.well-known/jwks.json",
  // requestHeaders: {}, // Optional
  // timeout: 30000 // Defaults to 30s
});

const getAppleSigningKey = async (kid) => {
  return new Promise((resolve) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) {
        console.log("error..", err);
        resolve(null);
        return;
      }
      const signingKey = key.getPublicKey();
      resolve(signingKey);
    });
  });
};

const verifyJWT = (json, publicKey) => {
  return new Promise((resolve) => {
    jwt.verify(json, publicKey, (err, payload) => {
      if (err) {
        console.error(err);
        return resolve(null);
      }
      resolve(payload)
    });
  });
};

const userController = {
  async register(req, res) {
    const { error } = registerValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        data: { error: error.details.map((detail) => detail.message) },
      });
    } else {
      let userData = req.body;
      if (!userData.googleId) {
        userData.googleId = "";
      }
      const emailExists = await User.findOne({ email: userData.email });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          data: { error: "This email already exists. Try logging in" },
        });
      } else {
        const user = new User(userData);
        if (userData.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }

        try {
          const registeredUser = await user.save();
          const token = jwt.sign(
            { _id: registeredUser._id },
            process.env.TOKEN_SECRET
          );
          res.status(200).send({
            message: "User registered successfully",
            data: {
              authToken: token,
              name: registeredUser.name,
              email: registeredUser.email,
              _id: registeredUser._id,
            },
          });
        } catch (error) {
          res.status(500).send({ message: error.message });
        }
      }
    }
  },

  async registerUsingApple(req, res) {
    try {
      console.log(req.body);
      const { provider, response } = req.body;
      if (provider == "apple") {
        // validate apple signin
        const { identityToken, user } = response.response;
        const json = jwt.decode(identityToken, { complete: true });
        const kid = json?.header?.kid;

        const appleKey = await getAppleSigningKey(kid);
        if (!appleKey) {
          console.log("Something went wrong");
          return;
        }

        const payload = await verifyJWT(identityToken, appleKey);
        if (!payload) {
          console.log("Something went wrong");
          return;
        }
        console.log("Signing with apple succedded", payload)
      }
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },


  // login
  async login(req, res) {
    try {
      const { error } = loginValidationSchema.validate(req.body);
      if (error) {
        return res.status(400).send(error.details[0].message);
      }
      
      const { email, password } = req.body;
      const foundUser = await User.findOne({ email });
  
      if (!foundUser) {
        return res.status(400).send({ error: "User not found" });
      }
  
      if (!foundUser.password) {
        // Handle scenarios where password is not set
        return res.status(200).send({ message: "Password not set for user" });
      }
  
      const validPass = await bcrypt.compare(password, foundUser.password);
      if (!validPass) {
        return res.status(400).send({ error: "Wrong password" });
      }
  
      const token = jwt.sign({ _id: foundUser._id }, process.env.TOKEN_SECRET);
      res.status(200).send({
        message: "Logged in successfully",
        user: {
          authToken: token,
          name: foundUser.name,
          email: foundUser.email,
          _id: foundUser._id,
        },
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).send({ error: "Internal Server Error" });
    }
  },

  // check user
  async checkUser(req, res) {
    try {
      
      const { email } = req.body;
      const foundUser = await User.findOne({ email });
  
      if (!foundUser) {
        return res.status(400).send({ error: "User not found" });
      }
  
     else{
      res.status(200).send({
        message: "User Found",
        userid: foundUser._id
      });
    }
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).send({ error: "Internal Server Error" });
    }
  },
};

module.exports = userController;

// router.post("/login", async (req, res) => {
// });
