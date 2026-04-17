import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Bubble, Sender, Welcome } from '@ant-design/x';
import { Button, Space, Alert, Typography, theme, Flex } from 'antd';
import {
  FileTextOutlined,
  DownloadOutlined,
  ClearOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useSnapshot } from 'valtio';
import { chatStore, chatActions } from '../../stores/chatStore';
import MarkdownContent from '../ReportPreview/index';
import { GitAnalysisResult } from '../../types';
import { generateWeeklyReport, continueChat } from '../../services/sse';
import { exportReport, downloadReport } from '../../services/api';

const { Text } = Typography;

interface WeeklyReportChatProps {
  gitData: GitAnalysisResult;
}

const WeeklyReportChat: React.FC<WeeklyReportChatProps> = ({ gitData }) => {
  const { token } = theme.useToken();
  const snapshot = useSnapshot(chatStore);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [snapshot.messages]);

  // 首次生成周报
  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      await generateWeeklyReport(gitData);
    } finally {
      setGenerating(false);
    }
  }, [gitData]);

  // 发送消息
  const handleSend = useCallback(async (message: string) => {
    if (!message.trim() || snapshot.isStreaming) return;
    setInputValue('');
    try {
      await continueChat(message);
    } catch (err) {
      // error已在store中处理
    }
  }, [snapshot.isStreaming]);

  // 导出周报
  const handleExport = useCallback(async () => {
    const lastAssistantMessage = [...snapshot.messages]
      .reverse()
      .find((m) => m.role === 'assistant' && !m.isStreaming);

    if (!lastAssistantMessage) return;

    setExporting(true);
    try {
      const result = await exportReport(lastAssistantMessage.content);
      if (result.success && result.downloadUrl) {
        downloadReport(result.downloadUrl);
      }
    } finally {
      setExporting(false);
    }
  }, [snapshot.messages]);

  // 清空对话
  const handleClear = useCallback(() => {
    chatActions.clearMessages();
  }, []);

  // 如果没有消息，显示欢迎 + 生成按钮
  if (snapshot.messages.length === 0) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px',
        }}
      >
        <Welcome
          icon={<FileTextOutlined style={{ fontSize: '32px', color: token.colorPrimary }} />}
          title="Git分析完成"
          description={`共发现 ${gitData.commits.length} 个提交，点击下方按钮生成周报`}
        />

        {snapshot.error && (
          <Alert
            message={snapshot.error}
            type="error"
            showIcon
            style={{ marginBottom: '16px', marginTop: '16px', maxWidth: '400px' }}
          />
        )}

        <Button
          type="primary"
          size="large"
          loading={generating}
          onClick={handleGenerate}
          style={{ marginTop: '24px' }}
        >
          {generating ? '生成中...' : '生成周报'}
        </Button>
      </div>
    );
  }

  // 构建Bubble.List数据
  const bubbleItems = snapshot.messages.map((m) => ({
    key: m.id,
    role: m.role as string,
    content: m.content,
    loading: m.isStreaming && m.content === '',
  }));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 工具栏 */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Text strong>AI对话</Text>
        <Space>
          <Button
            icon={<DownloadOutlined />}
            size="small"
            loading={exporting}
            onClick={handleExport}
            disabled={
              !snapshot.messages.find(
                (m) => m.role === 'assistant' && !m.isStreaming
              )
            }
          >
            导出
          </Button>
          <Button
            icon={<ClearOutlined />}
            size="small"
            onClick={handleClear}
            disabled={snapshot.isStreaming}
          >
            清空
          </Button>
        </Space>
      </div>

      {/* 消息列表 */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
        }}
      >
        <Bubble.List
          items={bubbleItems}
          roles={{
            assistant: {
              placement: 'start',
              avatar: { icon: <RobotOutlined />, style: { background: token.colorPrimary } },
              messageRender: (content: string) => <MarkdownContent content={content} />,
              typing: { step: 5, interval: 20 },
            },
            user: {
              placement: 'end',
              avatar: { icon: <UserOutlined />, style: { background: token.colorInfo } },
            },
          }}
          style={{ maxHeight: '100%' }}
        />
        
        {/* 错误提示 */}
        {snapshot.error && (
          <Alert
            message="请求失败"
            description={snapshot.error}
            type="error"
            showIcon
            closable
            onClose={() => chatActions.clearError()}
            style={{ marginTop: '16px' }}
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div
        style={{
          padding: '16px',
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          flexShrink: 0,
        }}
      >
        <Sender
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSend}
          loading={snapshot.isStreaming}
          placeholder='输入指令精修周报，例如："补充技术细节"、"简化内容"...'
        />
      </div>
    </div>
  );
};

export default WeeklyReportChat;
