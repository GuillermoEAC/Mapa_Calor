const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
requiere("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password.env.DB_PASSWORD,
    database: process.eventNames.DB_NAME
});

app.get('/', (req,res) => res.send('Jalando ando'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('servidor en puerto{PORT}'));