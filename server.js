const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-jwt-muy-seguro-y-largo';

// --- Configuración de Base de Datos PostgreSQL ---
const pool = new Pool({
    // La variable DATABASE_URL se configurará en Render o localmente con la URL de Neon
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('⚠️ Advertencia: No se pudo conectar a PostgreSQL. ¿Configuraste DATABASE_URL?');
    } else {
        console.log('📦 Conectado a la Base de Datos PostgreSQL en la nube');
        initDB();
        release();
    }
});

// Inicializar tablas y usuario por defecto
async function initDB() {
    try {
        // Tabla de Usuarios ("user" es palabra reservada en Postgres, se recomienda comillas)
        await pool.query(`CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            "user" VARCHAR(255) UNIQUE NOT NULL,
            pass VARCHAR(255) NOT NULL,
            nombreFormateado VARCHAR(255),
            rol VARCHAR(50)
        )`);

        // Tabla de Equipos
        await pool.query(`CREATE TABLE IF NOT EXISTS equipos (
            id_interno INTEGER PRIMARY KEY,
            tipo VARCHAR(255),
            marca VARCHAR(255),
            modelo VARCHAR(255),
            serie VARCHAR(255),
            tecnico VARCHAR(255),
            estado_f VARCHAR(255),
            estado_l VARCHAR(255),
            asignado VARCHAR(255)
        )`);

        // Tabla de Historial
        await pool.query(`CREATE TABLE IF NOT EXISTS historial (
            id SERIAL PRIMARY KEY,
            fecha VARCHAR(255),
            usuario VARCHAR(255),
            equipo INTEGER,
            accion VARCHAR(255),
            estado VARCHAR(255),
            color VARCHAR(50)
        )`);

        // Crear usuario administrador por defecto si no existe ninguno
        const { rows } = await pool.query('SELECT COUNT(*) as count FROM usuarios');
        if (parseInt(rows[0].count) === 0) {
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync("admin123", salt);
            
            await pool.query(`INSERT INTO usuarios ("user", pass, nombreformateado, rol) VALUES ($1, $2, $3, $4)`, 
                ['admin', hash, 'Administrador del Sistema', 'admin']
            );
            console.log('✅ Usuario administrador creado por defecto.');
        }
    } catch (err) {
        console.error('Error inicializando la BD:', err);
    }
}

// --- Middlewares ---
app.use(cors()); 
app.use(express.json()); 
app.use(express.static(__dirname));

// --- Middleware de Autenticación JWT ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// =====================================================================
// 🚀 RUTAS DE LA API
// =====================================================================
const apiRouter = express.Router();

// --- Autenticación ---
apiRouter.post('/login', async (req, res) => {
    const { user, pass } = req.body;
    
    try {
        const { rows } = await pool.query('SELECT * FROM usuarios WHERE "user" = $1', [user]);
        if (rows.length === 0) return res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos" });

        const dbUser = rows[0];
        const isValid = bcrypt.compareSync(pass, dbUser.pass);
        
        if (isValid) {
            const userPayload = { user: dbUser.user, nombreFormateado: dbUser.nombreformateado || dbUser.nombreFormateado, rol: dbUser.rol };
            const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '8h' });
            res.json({ success: true, token, user: userPayload });
        } else {
            res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Error interno del servidor", error: err.message });
    }
});

// Requiere token a partir de aquí
apiRouter.use(authenticateToken);

// --- Técnicos (Usuarios) ---
apiRouter.get('/tecnicos', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT nombreformateado FROM usuarios');
        res.json(rows.map(r => r.nombreformateado || r.nombreFormateado));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

apiRouter.post('/tecnicos', async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ success: false, message: "Acción no permitida." });
    
    const { user, pass, nombreFormateado, rol } = req.body;
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(pass, salt);

    try {
        const result = await pool.query(
            `INSERT INTO usuarios ("user", pass, nombreformateado, rol) VALUES ($1, $2, $3, $4) RETURNING id`,
            [user, hash, nombreFormateado, rol || 'tecnico']
        );
        res.json({ success: true, id: result.rows[0].id });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ success: false, message: "El usuario ya existe" }); // UNIQUE_VIOLATION in PG
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- Equipos ---
apiRouter.get('/equipos', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM equipos');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

apiRouter.post('/equipos', async (req, res) => {
    const { tipo, marca, modelo, serie, tecnico, estado_f, estado_l, asignado } = req.body;
    
    try {
        const maxRow = await pool.query('SELECT MAX(id_interno) as "maxId" FROM equipos');
        let nextId = (maxRow.rows[0].maxId || 0) + 1;
        
        await pool.query(`INSERT INTO equipos (id_interno, tipo, marca, modelo, serie, tecnico, estado_f, estado_l, asignado)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [nextId, tipo, marca, modelo, serie, tecnico, estado_f, estado_l, asignado]
        );
        res.status(201).json({ success: true, id_interno: nextId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

apiRouter.put('/equipos/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { tipo, marca, modelo, serie, tecnico, estado_f, estado_l, asignado } = req.body;

    try {
        const result = await pool.query(`UPDATE equipos SET tipo = $1, marca = $2, modelo = $3, serie = $4, tecnico = $5, estado_f = $6, estado_l = $7, asignado = $8 
            WHERE id_interno = $9`,
            [tipo, marca, modelo, serie, tecnico, estado_f, estado_l, asignado, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ success: false, message: "Equipo no encontrado" });
        res.json({ success: true, id_interno: id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

apiRouter.post('/equipos/delete-many', async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ success: false, message: "Acción no permitida." });

    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: "Se requiere un array de IDs." });
    }

    try {
        // Postgres using ANY para IN clause: = ANY($1::int[])
        const result = await pool.query(`DELETE FROM equipos WHERE id_interno = ANY($1::int[])`, [ids]);
        res.json({ success: true, deleted: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Historial ---
apiRouter.get('/historial', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM historial ORDER BY id DESC LIMIT 50');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

apiRouter.post('/historial', async (req, res) => {
    const { fecha, usuario, equipo, accion, estado, color } = req.body;
    try {
        const result = await pool.query(`INSERT INTO historial (fecha, usuario, equipo, accion, estado, color) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [fecha, usuario, equipo, accion, estado, color]
        );
        res.status(201).json({ success: true, id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Montar router API
app.use('/api', apiRouter);

// Ruta final para servir el frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Iniciar Servidor ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en el puerto ${PORT}`);
});