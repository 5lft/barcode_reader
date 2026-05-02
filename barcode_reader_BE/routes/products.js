const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

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

/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: 제품 목록 조회
 *     description: products 테이블의 전체 데이터를 최신순으로 반환합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   barcode:
 *                     type: string
 *                   product_name:
 *                     type: string
 *                   manufacturer:
 *                     type: string
 *                   photo_url:
 *                     type: string
 *                   created_by:
 *                     type: integer
 *                   created_at:
 *                     type: string
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: 서버 에러
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @openapi
 * /api/products:
 *   post:
 *     summary: 제품 등록
 *     description: 새로운 제품을 등록합니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - barcode
 *               - product_name
 *             properties:
 *               barcode:
 *                 type: string
 *                 example: "8801234567890"
 *               product_name:
 *                 type: string
 *                 example: "삼성 갤럭시 S24"
 *               manufacturer:
 *                 type: string
 *                 example: "삼성전자"
 *               photo_url:
 *                 type: string
 *                 example: "https://example.com/image.jpg"
 *     responses:
 *       200:
 *         description: 제품 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "제품 등록 완료"
 *       400:
 *         description: 잘못된 요청 (중복 바코드 등)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: 서버 에러
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
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

/**
 * @openapi
 * /api/products/barcode/{barcode}:
 *   get:
 *     summary: 바코드로 제품 조회
 *     description: 바코드 문자열로 특정 제품을 조회합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: barcode
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 제품의 바코드
 *         example: "8801234567890"
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 barcode:
 *                   type: string
 *                 product_name:
 *                   type: string
 *                 manufacturer:
 *                   type: string
 *                 photo_url:
 *                   type: string
 *                 created_by:
 *                   type: integer
 *                 created_at:
 *                   type: string
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: 해당 바코드의 제품 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "제품 없음"
 *       500:
 *         description: 서버 에러
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get('/barcode/:barcode', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products WHERE barcode = $1', [req.params.barcode]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: '제품 없음' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     summary: 제품 수정
 *     description: 제품 ID로 특정 제품 정보를 수정합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 수정할 제품의 ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_name:
 *                 type: string
 *                 example: "삼성 갤럭시 S24 Ultra"
 *               manufacturer:
 *                 type: string
 *                 example: "삼성전자"
 *               photo_url:
 *                 type: string
 *                 example: "https://example.com/image_updated.jpg"
 *     responses:
 *       200:
 *         description: 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: 해당 ID의 제품 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "제품 없음"
 *       500:
 *         description: 서버 에러
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.put('/:id', auth, async (req, res) => {
  const { product_name, manufacturer, photo_url } = req.body;
  try {
    const result = await db.query(
      `UPDATE products SET product_name=$1, manufacturer=$2, photo_url=$3 WHERE id=$4`,
      [product_name, manufacturer, photo_url, req.params.id]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ message: '제품 없음' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     summary: 제품 삭제
 *     description: 제품 ID로 특정 제품을 삭제합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 삭제할 제품의 ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: 해당 ID의 제품 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "제품 없음"
 *       500:
 *         description: 서버 에러
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0)
      return res.status(404).json({ message: '제품 없음' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;