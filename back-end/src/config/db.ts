import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  port: Number(process.env.PG_PORT) || 5432,
});

export const connectDB = async () => {
  try {
    await pool.connect();
    console.log('PostgreSQL connected');
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    process.exit(1);
  }
};

export default pool;
