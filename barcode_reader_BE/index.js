const express = require('express');
const cors = require('cors');
const db = require('./db');
const { swaggerUi, specs } = require('./swagger');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));

app.use('/api', swaggerUi.serve, swaggerUi.setup(specs));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`서버 실행 중: ${PORT}`));