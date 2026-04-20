import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import gitRouter from './routes/git.js';
import chatRouter from './routes/chat.js';
import reportRouter from './routes/report.js';
import fsRouter from './routes/fs.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());

// compression 中间件 - 但对 SSE 流禁用压缩（否则会缓冲）
app.use(compression({
  filter: (req, res) => {
    // 对 text/event-stream 禁用压缩，避免缓冲导致流式失效
    if (req.headers.accept === 'text/event-stream' || 
        res.getHeader('Content-Type') === 'text/event-stream') {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// 明确使用 UTF-8 解析 JSON
app.use(express.json({ 
  limit: '10mb',
  type: ['application/json', 'application/json; charset=utf-8']
}));

// URL encoded body 也使用 UTF-8
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 路由
app.use('/api/git', gitRouter);
app.use('/api/chat', chatRouter);
app.use('/api/report', reportRouter);
app.use('/api/fs', fsRouter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('=== 全局错误处理 ===');
  console.error('URL:', req.url);
  console.error('Method:', req.method);
  console.error('Error:', err.message || err);
  console.error('Stack:', err.stack);
  res.status(500).json({
    success: false,
    error: err.message || '服务器内部错误',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 后端服务运行在 http://localhost:${PORT}`);
});
