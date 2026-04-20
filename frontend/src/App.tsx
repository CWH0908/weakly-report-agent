import React, { useState, useCallback } from 'react';
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { Sender } from '@ant-design/x';
import { useSnapshot } from 'valtio';
import { chatStore, chatActions } from './stores/chatStore';
import { GitAnalysisResult } from './types';
import { sendConversation } from './services/sse';
import { analyzeGit, exportReport, downloadReport } from './services/api';

// 组件
import Header from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';
import ChatMessages from './components/ChatMessages';
import PathModal, { DateRange } from './components/PathModal';

// 样式
import './styles/global.scss';
import * as styles from './styles/App.module.scss';

const App: React.FC = () => {
  const snapshot = useSnapshot(chatStore);
  const [inputValue, setInputValue] = useState('');
  const [exporting, setExporting] = useState(false);
  const [pathModalOpen, setPathModalOpen] = useState(false);
  const [repoPath, setRepoPath] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  // 打开路径输入对话框
  const handleOpenPathModal = useCallback(() => {
    setPathModalOpen(true);
  }, []);

  // 分析项目
  const handleAnalyze = useCallback(async (dateRange: DateRange) => {
    if (!repoPath.trim()) {
      message.warning('请输入项目路径');
      return;
    }

    setAnalyzing(true);
    setPathModalOpen(false);

    const { since, until } = dateRange;

    chatActions.addUserMessage(`分析项目: ${repoPath}`);
    const messageId = chatActions.startAssistantMessage();
    chatActions.appendAssistantContent(messageId, `正在分析 **${repoPath}** ...\n\n`);

    try {
      const result = await analyzeGit({
        repoPath: repoPath.trim(),
        since,
        until,
      });

      if (result.success && result.data) {
        const gitData = result.data;
        chatActions.setGitData(gitData);
        chatActions.setGitConfig({
          repoPath: gitData.repoPath,
          since: gitData.dateRange.since,
          until: gitData.dateRange.until,
        });

        chatActions.appendAssistantContent(
          messageId,
          `✅ 分析完成！\n\n**项目**: ${gitData.repoName}\n**时间**: ${gitData.dateRange.since} ~ ${gitData.dateRange.until}\n**提交数**: ${gitData.summary.totalCommits}\n**代码变更**: +${gitData.summary.totalAdditions} / -${gitData.summary.totalDeletions}\n\n现在你可以说"生成周报"来创建周报。`
        );
      } else {
        chatActions.appendAssistantContent(messageId, `❌ 分析失败: ${result.error || '未知错误'}`);
      }
    } catch (err) {
      chatActions.appendAssistantContent(messageId, `❌ 分析失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      chatActions.finishAssistantMessage(messageId);
      setAnalyzing(false);
    }
  }, [repoPath]);

  // 发送消息
  const handleSend = useCallback(async (msg?: string) => {
    const text = msg || inputValue.trim();
    if (!text || snapshot.isStreaming) return;
    
    setInputValue('');

    try {
      await sendConversation(
        text,
        {
          repoPath: snapshot.gitConfig?.repoPath,
          gitData: snapshot.gitData ?? undefined,
          messages: snapshot.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
        {
          onAction: (action) => {
            if (action === 'select_folder') {
              handleOpenPathModal();
            }
          },
          onGitData: (gitData: GitAnalysisResult) => {
            chatActions.setGitData(gitData);
            chatActions.setGitConfig({
              repoPath: gitData.repoPath,
              since: gitData.dateRange.since,
              until: gitData.dateRange.until,
            });
          },
        }
      );
    } catch (err) {
      // error已在store中处理
    }
  }, [inputValue, snapshot.isStreaming, snapshot.gitConfig, snapshot.gitData, snapshot.messages, handleOpenPathModal]);

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
        message.success('导出成功');
      }
    } finally {
      setExporting(false);
    }
  }, [snapshot.messages]);

  // 清空对话
  const handleClear = useCallback(() => {
    chatActions.reset();
  }, []);

  const hasMessages = snapshot.messages.length > 0;
  const canExport = !!snapshot.messages.find((m) => m.role === 'assistant' && !m.isStreaming);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#0ea5e9',
          colorInfo: '#0ea5e9',
          borderRadius: 12,
          fontFamily: "'Plus Jakarta Sans', 'Noto Sans SC', system-ui, sans-serif",
          colorBgContainer: '#ffffff',
          colorText: '#0f172a',
          colorTextSecondary: '#475569',
        },
      }}
    >
      <div className={styles.container}>
        {/* 动态背景 */}
        <div className={styles.bgGradient} />
        <div className={styles.bgOrbs}>
          <div className={`${styles.orb} ${styles.orb1}`} />
          <div className={`${styles.orb} ${styles.orb2}`} />
          <div className={`${styles.orb} ${styles.orb3}`} />
        </div>
        <div className={styles.bgGrid} />

        {/* 路径输入对话框 */}
        <PathModal
          open={pathModalOpen}
          value={repoPath}
          onChange={setRepoPath}
          onOk={handleAnalyze}
          onCancel={() => setPathModalOpen(false)}
          loading={analyzing}
        />

        {/* 头部 */}
        <Header
          projectName={snapshot.gitData?.repoName}
          onSelectProject={handleOpenPathModal}
          onExport={handleExport}
          onClear={handleClear}
          isAnalyzing={analyzing}
          isExporting={exporting}
          isStreaming={snapshot.isStreaming}
          canExport={canExport}
          canClear={hasMessages}
        />

        {/* 主内容区 */}
        <main className={styles.main}>
          <div className={styles.chatContainer}>
            {hasMessages ? (
              <ChatMessages />
            ) : (
              <WelcomeScreen
                onSelectProject={handleOpenPathModal}
                onHelp={() => handleSend('帮助')}
              />
            )}
          </div>
        </main>

        {/* 底部输入区 */}
        <footer className={styles.footer}>
          <div className={styles.inputWrapper}>
            <div className={styles.chatSender}>
              <Sender
                value={inputValue}
                onChange={setInputValue}
                onSubmit={() => handleSend()}
                loading={snapshot.isStreaming}
                placeholder='输入指令...'
              />
            </div>
          </div>
        </footer>
      </div>
    </ConfigProvider>
  );
};

export default App;
