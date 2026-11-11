require('dotenv').config();
const app = require('./src/app');
const PORT = process.env.PORT || 5000;
console.log('--- Server Starting ---');
console.log('Environment:', process.env.NODE_ENV);
console.log('DB Config:', {
  host: process.env.DB_HOST || 'localhost (default)',
  user: process.env.DB_USER || 'root (default)',
  port: process.env.DB_PORT || '3306 (default)',
  name: process.env.DB_NAME,
  password: process.env.DB_PASSWORD ? '****' : '(empty)'
});

app.listen(PORT, () => console.log(`HMS API listening on http://localhost:${PORT}`));



/*

require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // bind to all interfaces for LAN access

app.listen(PORT, HOST, () => {
  console.log(`HMS API listening on http://${HOST}:${PORT}`);
});

*/

