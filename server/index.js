import app from './server.js';
import { fileURLToPath } from 'url';

const PORT = process.env.PORT || 5000;
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` Wedding Photo Gallery Server Running (via index.js)`);
    console.log(` Port:    http://localhost:${PORT}`);
    console.log(` Health:  http://localhost:${PORT}/api/health`);
    console.log(` Admin:   http://localhost:${PORT}/api/admin/events`);
    console.log(` Env:     ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
  });
}

export default app;
