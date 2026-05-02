const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// 회원가입
/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: 회원가입
 *     description: 새로운 사용자를 등록합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               login_id:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               company_name:
 *                 type: string
 *               company_code:
 *                 type: string
 *     responses:
 *       200:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: 잘못된 요청 (예: 중복된 login_id)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
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
router.post('/register', async (req, res) => {
  const { login_id, password, name, phone, company_name, company_code } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.query(
      `INSERT INTO users (login_id, password, name, phone, company_name, company_code)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [login_id, hashed, name, phone, company_name, company_code]
    );
    res.json({ success: true, message: '회원가입 완료' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 로그인
/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: 로그인
 *     description: 사용자 로그인 후 JWT 토큰을 반환합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               login_id:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     company:
 *                       type: string
 *       401:
 *         description: 인증 실패 (존재하지 않는 아이디 또는 비밀번호 불일치)
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
router.post('/login', async (req, res) => {
  const { login_id, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE login_id = $1', [login_id]);
    if (result.rows.length === 0)
      return res.status(401).json({ message: '존재하지 않는 아이디' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: '비밀번호 불일치' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { name: user.name, company: user.company_name } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;