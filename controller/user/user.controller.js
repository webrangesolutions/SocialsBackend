const User = require("../../models/user.model");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//VALIDATION
const Joi = require("@hapi/joi");

//validation for register data
const registerValidationSchema = Joi.object({
  googleId: Joi.string().min(3),
  name: Joi.string().min(3).required(),
  email: Joi.string().required(),
  password: Joi.string().min(3),
});

//validation for login data
const loginValidationSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().min(3).required(),
});

const userController = {
  async register(req, res) {
    const { error } = registerValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        data: { error: error.details.map((detail) => detail.message) },
      });
    } else {
      const userData = req.body;

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
  async login(req, res) {
    const { error } = loginValidationSchema.validate(req.body);
    if (error) {
      res.status(400).send(error.details[0].message);
    } else {
      const userData = req.body;
      const user = new User(userData);
      const founduser = await User.findOne({ email: userData.email });

      if (!founduser) {
        res.status(400).send({ data: { error: "User not found" } });
      } else {
        const validPass = await bcrypt.compare(
          user.password,
          founduser.password
        );
        if (!validPass) {
          res.status(400).send({ data: { error: "Wrong password" } });
        } else {
          const token = jwt.sign(
            { _id: founduser._id },
            process.env.TOKEN_SECRET
          );
          res.status(200).send({
            data: {
              message: "Logged in successfully",
              user: {
                authToken: token,
                name: founduser.name,
                email: founduser.email,
                _id: founduser._id,
              },
            },
          });
        }
      }
    }
  },
};

module.exports = userController;

// router.post("/login", async (req, res) => {
// });
