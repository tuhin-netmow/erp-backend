const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: false
  })
  : new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      ...(process.env.DB_SOCKET_PATH
        ? {} // access via socket, ignore host/port
        : {
          host: process.env.DB_HOST || '127.0.0.1',
          port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306
        }),
      dialect: 'mysql',
      logging: false, // set true to see SQL queries
      dialectOptions: process.env.DB_SOCKET_PATH ? {
        socketPath: process.env.DB_SOCKET_PATH
      } : {}
    }
  );

console.log(`Sequelize initializing with Host: ${process.env.DB_HOST}, Port: ${process.env.DB_PORT} (parsed: ${parseInt(process.env.DB_PORT || '3306', 10)})`);


// Test connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL connected (Sequelize)');
  } catch (err) {
    console.error('Sequelize connection error:', err);
  }
})();

module.exports = { sequelize };
