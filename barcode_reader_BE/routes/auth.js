const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// 회원가입
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