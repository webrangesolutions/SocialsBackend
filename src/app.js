const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const router = require("../routes/main.route");
const initSocket = require("../routes/socket");
const http = require("http");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');
// Set the paths for ffmpeg and ffprobe
// const ffmpegPath = path.resolve(__dirname, '../ffmpeg/bin/ffmpeg.exe');
// const ffprobePath = path.resolve(__dirname, '../ffmpeg/bin/ffprobe.exe');

// ffmpeg.setFfmpegPath(ffmpegPath);
// ffmpeg.setFfprobePath(ffprobePath);
const allowedOrigins = ["https://socials-tau.vercel.app", "*"];
class App {
  constructor() {
    dotenv.config(); // Load environment variables at the beginning
    this.app = express();
    this.http = http.Server(this.app);
    this.io = require("socket.io")(this.http, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      cors: {
        origin: ["https://socials-tau.vercel.app/",
          ,"*"],
      },
    });
    this.PORT = process.env.PORT || 8080;

    this.initMiddleware();
    this.connectToMongoDB();
    this.initRoutes();
    this.initSocketIO();
    this.PORT = process.env.PORT || 8080;
  }

  initMiddleware() {
    // Use bodyParser for JSON and URL-encoded data
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ limit: '50mb', extended: false }));

    // Configure session middleware
    this.app.use(session({
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false } // Set to true if using HTTPS
    }));

    // Initialize CORS for all routes
    this.app.use((req, res, next) => {
      const { origin } = req.headers;
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        res.setHeader("Access-Control-Allow-Origin", origin || "*");
      }
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
      );
      next();
    });
  }

  connectToMongoDB() {
    const db = process.env.MONGO_CONNECTION;
    mongoose.connect(
      db,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
      (err) => {
        if (err) {
          console.log("Database connection error:", err);
        } else {
          console.log("Database connected");
        }
      }
    );
  }

  initRoutes() {

      this.app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      res.header("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, OPTIONS");
      next();
    });
    const folderPath = __dirname;
    const publicPath = path.join(folderPath, "..", "public");

    this.app.use(express.static(publicPath));
    this.app.use("/", router);
  }

  initSocketIO() {
    const io = require("socket.io")(this.http, {
      cors: {
        origin: (origin, callback) => {
          // Allow requests with no origin (like mobile apps or curl requests)
          if (!origin) return callback(null, true);

          if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
            return callback(null, true);
          } else {
            return callback(new Error("Not allowed by CORS"));
          }
        },
        credentials: true,
        transports: ["websocket", "polling"],
      },
    });
    initSocket(io);
  }

  createServer() {
    this.http.listen(this.PORT, () => {
      console.log(`Server started at port ${this.PORT}`);
    });
  }
}

module.exports = App;
