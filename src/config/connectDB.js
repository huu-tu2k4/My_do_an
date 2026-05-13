const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'bookingcaredb';
const dbUser = process.env.DB_USERNAME || 'root';
const dbPass = process.env.DB_PASSWORD || null;
const dbHost = process.env.DB_HOST || 'localhost';
const dbDialect = process.env.DB_DIALECT || 'mysql';

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
    host: dbHost,
    dialect: dbDialect,
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    timezone: process.env.DB_TIMEZONE || '+07:00'
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