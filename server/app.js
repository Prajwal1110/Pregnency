require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const graphqlHTTP = require("express-graphql");
const schema = require("./graphql/schema");
const logger = require("morgan");
const path = require("path");
const cors = require("cors");
const flash = require("connect-flash");

mongoose
  .connect(process.env.DBURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch(error => {
    console.error("Error connecting to MongoDB:", error);
  });

const app = express();

app.set("view engine", "hbs");
app.use(express.static(path.join(__dirname, "public")));

const whitelist = ["http://localhost:3000", "http://localhost:19002"];

const corsOptions = {
  origin: function(origin, callback) {
    const originIsWhitelisted = whitelist.indexOf(origin) !== -1;
    callback(null, originIsWhitelisted);
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  session({
    secret: "irongenerator",
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.DBURL,
      mongooseConnection: mongoose.createConnection(process.env.DBURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
    })
  })
);

app.use(flash());
require("./passport")(app);

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const patientRoutes = require("./routes/patients");
const appointmentsRoutes = require("./routes/appointments");

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentsRoutes);

app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: process.env.NODE_ENV !== "production"
  })
);

app.use("*", (req, res) =>
  res.sendFile(path.join(__dirname, "/public/indexx.html"))
);

module.exports = app;
