'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const configFile = require('../config/config');

const env = process.env.NODE_ENV || 'development';
const config = configFile[env];

const db = {};

// 🔹 Sequelize instance
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    // -----------------------------------------------------------------
    // 👇 UPDATE THIS SECTION
    // -----------------------------------------------------------------
    dialectOptions: {
      ...config.dialectOptions, // Keep any other options from your config
      ssl: process.env.NODE_ENV === 'production'
        ? { require: true, rejectUnauthorized: false } // Production (Render/Heroku/AWS)
        : false // Local Development (Fixes your error)
    },
    // -----------------------------------------------------------------
  }
);
const IGNORE_FILES = ['index.js', 'enums.js', 'enum.js'];

fs.readdirSync(__dirname)
  .filter(file => file.endsWith('.js') && !IGNORE_FILES.includes(file))
  .forEach(file => {
    const modelFactory = require(path.join(__dirname, file));

    if (typeof modelFactory !== 'function') {
      throw new Error(`Model file ${file} does not export a function`);
    }

    const model = modelFactory(sequelize, DataTypes);
    db[model.name] = model;
  });

// 🔹 Associations
Object.values(db).forEach(model => {
  if (model.associate) model.associate(db);
});

// 🔹 Export
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
