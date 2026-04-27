const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Warehouse Management API',
      version: '1.0.0',
      description: 'RDS PostgreSQL과 연동된 바코드 리더 시스템 API 문서입니다.',
    },
    servers: [
      {
        url: 'http://localhost:3000', // 환경 변수의 PORT와 맞추세요
      },
    ],
  },
  apis: ['./index.js'], // API 주석이 작성될 파일 위치
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };