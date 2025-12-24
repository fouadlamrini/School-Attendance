import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import classesRoutes from './routes/classes';
import { initializeDB } from './data-source';

dotenv.config(); // Charger les variables d'environnement en premier

const app = express();
app.use(express.json()); // Middleware pour parser le JSON

// Initialiser la DB avant de démarrer le serveur
initializeDB()
  .then(() => {
    console.log('Database initialized');

    // Routes
    app.use('/auth', authRoutes);
    app.use('/classes', classesRoutes);

    // Test route
    app.get('/', (_req: Request, res: Response) => {
      res.send('API is running');
    });

    // Démarrage serveur
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database', err);
    process.exit(1); // Quitter si la DB ne démarre pas
  });
