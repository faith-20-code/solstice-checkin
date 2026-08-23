require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // OR use the individual variables version above
});

async function test() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Success! Connected at:', res.rows[0].now);
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    await pool.end();
  }
}

test();