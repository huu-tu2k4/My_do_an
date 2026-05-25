import express from "express";
import bodyParser from "body-parser";
import viewEngine from "./config/viewEngine";
import initWebRoutes from "./routes/web";
// import connectDB from "./config/connectDB";   // ← XÓA DÒNG NÀY
import db from "./models";   // ← SỬA THÀNH DÒNG NÀY

require('dotenv').config();
import cookieParser from 'cookie-parser';

const app = express();

app.use(function(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", process.env.URL_REACT);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", true);
    next();
});

//config app
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

// parse cookies
app.use(cookieParser());

viewEngine(app);
initWebRoutes(app);

// Kết nối Database
const connectDB = async () => {
    try {
        await db.sequelize.authenticate();
        console.log('✅ Database connection has been established successfully.');
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
    }
};

connectDB();

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`✅ BackEnd is running with port : ${port}`);
});