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

dotenv.config(); // Load environment variables at the beginning

ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');

const allowedOrigins = [
  "https://socials-tau.vercel.app",
  "https://backend.vupop.io",
  "*"
];

class App {
  constructor() {
    this.app = express();
    this.http = http.Server(this.app);
    this.io = require("socket.io")(this.http, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
        transports: ["websocket", "polling"]
      },
    });
    this.PORT = process.env.PORT || 8080;

    this.initMiddleware();
    this.connectToMongoDB();
    this.initRoutes();
    this.initSocketIO();
  }

  initMiddleware() {
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ limit: '50mb', extended: false }));

    this.app.use(session({
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false } // Set to true if using HTTPS
    }));

    this.app.use(cors({
      origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || allowedOrigins.includes("*") || !origin) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }));

    this.app.use((req, res, next) => {
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
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
    const folderPath = __dirname;
    const publicPath = path.join(folderPath, "..", "public");

    this.app.use(express.static(publicPath));
    this.app.use("/", router);
  }

  initSocketIO() {
    const io = this.io;
    initSocket(io);
  }

  createServer() {
    this.http.listen(this.PORT, () => {
      console.log(`Server started at port ${this.PORT}`);
    });
  }
}

module.exports = App;
