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

/**
 * @openapi
 * /api/warehouse:
 *   get:
 *     summary: 창고 인벤토리 전체 조회
 *     description: RDS의 inventory 테이블에서 전체 데이터를 가져옵니다.
 *     responses:
 *       200:
 *         description: 성공적으로 조회됨
 *       500:
 *         description: 서버 에러 (Relation does not exist 등)
 */
app.get('/api/warehouse', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.use('/api', swaggerUi.serve, swaggerUi.setup(specs));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`서버 실행 중: ${PORT}`));