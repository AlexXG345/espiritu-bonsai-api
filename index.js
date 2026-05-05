const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a la base de datos
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306
});

db.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

// RUTAS 

// Obtener los bonsáis con las etiquetas
app.get('/api/bonsais', (req, res) => {
  const query = `
    SELECT 
      b.*,
      GROUP_CONCAT(
        JSON_OBJECT('nombre', e.nombre, 'tipo', e.tipo)
      ) AS etiquetas
    FROM Bonsai b
    LEFT JOIN Bonsai_Etiqueta be ON b.id = be.bonsaiId
    LEFT JOIN Etiqueta e ON e.id = be.etiquetaId
    GROUP BY b.id
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const bonsais = results.map(b => ({
      ...b,
      etiquetas: b.etiquetas
        ? b.etiquetas.split('},{').map(s => {
            try { return JSON.parse(s.startsWith('{') ? s : '{' + s);
            } catch { return null; }
          }).filter(Boolean)
        : []
    }));
    res.json(bonsais);
  });
});

// Obtener un bonsái por id
app.get('/api/bonsais/:id', (req, res) => {
  const query = `
    SELECT b.*,
      GROUP_CONCAT(
        JSON_OBJECT('nombre', e.nombre, 'tipo', e.tipo)
      ) AS etiquetas
    FROM Bonsai b
    LEFT JOIN Bonsai_Etiqueta be ON b.id = be.bonsaiId
    LEFT JOIN Etiqueta e ON e.id = be.etiquetaId
    WHERE b.id = ?
    GROUP BY b.id
  `;
  db.query(query, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Bonsái no encontrado' });
    res.json(results[0]);
  });
});

// SERVIDOR 
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});