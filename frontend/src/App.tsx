import React, { useState } from 'react';
import { Layout, Card, theme, Typography, Divider, Alert, Space } from 'antd';
import { RobotOutlined, GithubOutlined } from '@ant-design/icons';
import { useSnapshot } from 'valtio';
import { chatStore, chatActions } from './stores/chatStore';
import GitConfigForm from './components/GitConfigForm/index';
import WeeklyReportChat from './components/WeeklyReportChat/index';
import { GitAnalysisResult } from './types';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const App: React.FC = () => {
  const { token } = theme.useToken();
  const snapshot = useSnapshot(chatStore);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);

  const handleAnalysisComplete = (data: GitAnalysisResult) => {
    setAnalysisSuccess(true);
    // 清空之前的对话记录
    chatActions.clearMessages();
  };

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgContainer }}>
      {/* 头部 */}
      <Header
        style={{
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
        }}
      >
        <Space align="center">
          <RobotOutlined style={{ fontSize: '24px', color: token.colorPrimary }} />
          <Title level={4} style={{ margin: 0 }}>
            周报AI助手
          </Title>
        </Space>
        <Text type="secondary" style={{ marginLeft: 'auto' }}>
          基于Git记录自动生成周报
        </Text>
      </Header>

      <Layout>
        {/* 左侧配置面板 */}
        <Sider
          width={360}
          style={{
            background: token.colorBgContainer,
            borderRight: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <GitConfigForm onAnalysisComplete={handleAnalysisComplete} />

          {snapshot.gitData && (
            <>
              <Divider style={{ margin: '0' }} />
              <div style={{ padding: '16px' }}>
                <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '12px' }}>
                  分析结果
                </Text>
                <Alert
                  message={snapshot.gitData.repoName}
                  description={
                    <Space direction="vertical" size={0}>
                      <Text>提交数: {snapshot.gitData.summary.totalCommits}</Text>
                      <Text>
                        代码变更: +{snapshot.gitData.summary.totalAdditions} / -
                        {snapshot.gitData.summary.totalDeletions}
                      </Text>
                      <Text>文件变更: {snapshot.gitData.summary.filesChanged.length} 个</Text>
                    </Space>
                  }
                  type="info"
                  showIcon
                />
              </div>
            </>
          )}
        </Sider>

        {/* 右侧对话区域 */}
        <Content style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
          {snapshot.gitData ? (
            <WeeklyReportChat gitData={snapshot.gitData} />
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '48px',
              }}
            >
              <RobotOutlined style={{ fontSize: '64px', color: token.colorBorder }} />
              <Title level={4} style={{ marginTop: '24px', color: token.colorTextSecondary }}>
                欢迎使用周报AI助手
              </Title>
              <Text type="secondary" style={{ textAlign: 'center', maxWidth: '400px' }}>
                请在左侧配置Git项目路径和时间范围，点击"分析Git记录"开始生成周报
              </Text>
              <div style={{ marginTop: '24px' }}>
                <Alert
                  message="使用说明"
                  description={
                    <ol style={{ paddingLeft: '16px', margin: 0 }}>
                      <li>输入本地Git项目的路径</li>
                      <li>选择需要分析的时间范围</li>
                      <li>点击"分析Git记录"按钮</li>
                      <li>AI将自动生成周报初稿</li>
                      <li>通过对话方式精修周报内容</li>
                      <li>导出Markdown格式周报</li>
                    </ol>
                  }
                  type="info"
                  style={{ maxWidth: '400px' }}
                />
              </div>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
