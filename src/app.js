const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const router = require("../routes/main.route");
const initSocket = require("../routes/socket");
const passport = require("passport");
const passportGoogleSetup = require('../services/passport/googleAuth');
// const passportMetaSetup = require('../services/passport/metaAuth');
const http = require("http");
const mongoose = require("mongoose");
const session = require("express-session"); // Import express-session
const path = require("path");

class App {
  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.http = new http.Server(this.app);
    this.io = require("socket.io")(this.http, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      cors: {
        origin: "*",
      },
    });
    this.PORT = process.env.PORT || 8000;
    dotenv.config();
    this.initMiddleware();
    this.connectToMongoDB();
    this.initRoutes();
  }

  initMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());

    // Configure session middleware
    this.app.use(session({
      secret: process.env.SESSION_SECRET || 'your-secret-key', // Use a strong secret key
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false } // Set to true if using HTTPS
    }));

    // Initialize Passport and restore authentication state, if any, from the session
    this.app.use(passport.initialize());
    this.app.use(passport.session());
  }

  connectToMongoDB() {
    const db = process.env.MONGO_CONNECTION;
    mongoose.connect(
      db,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
      },
      (err, db) => {
        if (err) {
          console.log("err", err);
        } else {
          console.log("db connected");
        }
      }
    );
  }

  initRoutes() {
    const folderPath = __dirname;
    const publicPath = path.join(folderPath, "..", "public");

    this.app.use(express.static(publicPath));
    this.app.use("/", router);
    initSocket(this.io);
  }

  createServer() {
    this.http.listen(this.PORT, () => {
      console.log("Server started at port 8000");
    });
  }
}

module.exports = App;
