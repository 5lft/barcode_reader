const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

// JWT 인증 미들웨어
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: '토큰 없음' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: '토큰 만료 또는 유효하지 않음' });
  }
};

// 제품 목록 조회
router.get('/', auth, async (req, res) => {
  const result = await db.query('SELECT * FROM products ORDER BY created_at DESC');
  res.json(result.rows);
});

// 제품 등록
router.post('/', auth, async (req, res) => {
  const { barcode, product_name, manufacturer, photo_url } = req.body;
  try {
    await db.query(
      `INSERT INTO products (barcode, product_name, manufacturer, photo_url, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [barcode, product_name, manufacturer, photo_url, req.user.userId]
    );
    res.json({ success: true, message: '제품 등록 완료' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 바코드로 제품 조회
router.get('/barcode/:barcode', auth, async (req, res) => {
  const result = await db.query('SELECT * FROM products WHERE barcode = $1', [req.params.barcode]);
  if (result.rows.length === 0) return res.status(404).json({ message: '제품 없음' });
  res.json(result.rows[0]);
});

// 제품 수정
router.put('/:id', auth, async (req, res) => {
  const { product_name, manufacturer, photo_url } = req.body;
  await db.query(
    `UPDATE products SET product_name=$1, manufacturer=$2, photo_url=$3 WHERE id=$4`,
    [product_name, manufacturer, photo_url, req.params.id]
  );
  res.json({ success: true });
});

// 제품 삭제
router.delete('/:id', auth, async (req, res) => {
  await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;