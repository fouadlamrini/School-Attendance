import express, { Request, Response } from 'express';

const app = express();
const PORT = 3000;

// Middleware pour parser JSON
app.use(express.json());

// Route de test
app.get('/', (req: Request, res: Response) => {
  res.send('Hello, EdTech backend with TypeScript!');
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
