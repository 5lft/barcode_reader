const { Pool } = require('pg');
require('dotenv').config();

// RDS 연결 설정을 담은 객체 생성
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  // AWS RDS 연결을 위해 SSL 설정이 필수인 경우가 많습니다.
  ssl: {
    rejectUnauthorized: false
  },
  // 연결 효율을 위한 설정 (옵션)
  max: 10,               // 동시에 유지할 최대 연결 수
  idleTimeoutMillis: 30000, // 연결이 사용되지 않을 때 폐기될 시간
});

// 외부 파일(app.js 등)에서 db.query()를 사용할 수 있도록 내보내기
module.exports = {
  /**
   * @param {string} text - 실행할 SQL 쿼리문
   * @param {Array} params - 쿼리문에 들어갈 파라미터 배열
   */
  query: (text, params) => {
    console.log('🚀 쿼리 실행:', text); // 디버깅용 로그
    return pool.query(text, params);
  },
};