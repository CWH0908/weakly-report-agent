import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import gitRouter from './routes/git.js';
import chatRouter from './routes/chat.js';
import reportRouter from './routes/report.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/git', gitRouter);
app.use('/api/chat', chatRouter);
app.use('/api/report', reportRouter);

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
