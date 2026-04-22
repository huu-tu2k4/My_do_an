import express from "express";
import bodyParser from "body-parser";
import viewEngine from "./config/viewEngine";
import initWebRoutes from "./routes/web";
import connectDB from "./config/connectDB";
// import cors from "cors";
require('dotenv').config();

const app = express();
// app.use(cors({origin: true}));
// app.use(cors({origin: true, credentials: true}));

app.use(function(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", process.env.URL_REACT);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader("Access-Control-Allow-Credentials", true);
    next();
});

//config app
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

viewEngine(app);
initWebRoutes(app);

connectDB();

const port = process.env.PORT || 8386;

app.listen(port, () => {
    console.log(`BackEnd is running with port : ${port}`);
});