import express from 'express';
import dotenv from 'dotenv';
import { initializeDB } from './data-source';
import authRoutes from './routes/auth';
import classesRoutes from './routes/classes';
import studentsRoutes from './routes/students';
import subjectsRoutes from './routes/subjects';
import sessionsRoutes from './routes/sessions';
import attendanceRoutes from './routes/attendance';
import statsRoutes from './routes/stats';

dotenv.config();

const app = express();
app.use(express.json());

// Initialiser la DB et démarrer le serveur
initializeDB()
  .then(() => {
    console.log('Database initialized');

    // Routes
    app.use('/auth', authRoutes);
    app.use('/classes', classesRoutes);
    app.use('/students', studentsRoutes);
    app.use('/subjects', subjectsRoutes);
    app.use('/sessions', sessionsRoutes);
    app.use('/attendance', attendanceRoutes);
    app.use('/stats', statsRoutes);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to initialize database', err);
    process.exit(1);
  });
