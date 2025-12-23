import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from './entities/User';
import { Class } from './entities/Class';
import { Student } from './entities/Student';
import { Subject } from './entities/Subject';
import { Session } from './entities/Session';
import { Attendance } from './entities/Attendance';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT) || 5432,
  username: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  synchronize: true, // seulement pour dev
  logging: false,
  entities: [User, Class, Student, Subject, Session, Attendance],
  migrations: [],
  subscribers: [],
});

export const initializeDB = async () => {
  try {
    await AppDataSource.initialize();
    console.log('PostgreSQL connected via TypeORM');
  } catch (err) {
    console.error('Error during Data Source initialization', err);
    process.exit(1);
  }
};
