import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { Student } from './entities/Student';
import { Class } from './entities/Class';
import { Subject } from './entities/Subject';
import { Session } from './entities/Session';
import { Attendance } from './entities/Attendance';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.PG_HOST || 'localhost',
  port: Number(process.env.PG_PORT) || 5432,
  username: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'password',
  database: process.env.PG_DATABASE || 'edtech_db',
  synchronize: true, // true pour dev, false en prod
  logging: false,
  entities: [User, Student, Class, Subject, Session, Attendance],
  migrations: [],
  subscribers: [],
});

// Optional: initialiser la connexion
export const initializeDB = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');
  } catch (err) {
    console.error('Error during Data Source initialization', err);
  }
};
