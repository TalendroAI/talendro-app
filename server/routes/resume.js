import express from 'express';
const router = express.Router();

// NOTE: The primary resume parsing endpoint (POST /parse) is handled by parse.js
// which is mounted at /api and provides the full file-upload + OpenAI extraction flow.
// This file is reserved for future authenticated resume management endpoints
// (e.g., GET /api/resume/:id, PUT /api/resume/:id/update, etc.)

export default router;
