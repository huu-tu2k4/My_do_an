const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USERNAME;
const dbPass = process.env.DB_PASSWORD;
const dbHost = process.env.DB_HOST;
const dbDialect = process.env.DB_DIALECT;
const dbSSL = process.env.DB_SSL;
const dbPort = process.env.DB_PORT;

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
    host: dbHost,
    port: dbPort,
    dialect: dbDialect,
    logging: false,
    dialectOptions: {
        ssl: dbSSL === 'true' ? {
            require: true,
            rejectUnauthorized: false
        } : false
    }
});

let connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch(error) {
        console.log('Unable to connect to the database: ', error);
    }
}

module.exports = connectDB;