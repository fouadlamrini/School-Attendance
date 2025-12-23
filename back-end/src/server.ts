import express, { Request, Response } from 'express';
import { connectDB } from './config/db';

const app = express();
const PORT = 3000;

app.use(express.json());

// Test route
app.get('/', (req: Request, res: Response) => {
  res.send('Hello, EdTech backend with TypeScript!');
});

// Connecter à PostgreSQL avant de démarrer le serveur
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
