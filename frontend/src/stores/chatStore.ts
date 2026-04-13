import { proxy } from 'valtio';
import { ChatState, ChatMessage, GitConfig, GitAnalysisResult } from '../types';

// 初始状态
export const chatStore = proxy<ChatState>({
  messages: [],
  isStreaming: false,
  gitConfig: null,
  gitData: null,
  error: null,
});

// 生成唯一ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 获取当前日期范围（本周）
function getDefaultDateRange(): { since: string; until: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    since: monday.toISOString().split('T')[0],
    until: sunday.toISOString().split('T')[0],
  };
}

// Actions
export const chatActions = {
  // 添加用户消息
  addUserMessage: (content: string) => {
    const message: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
    };
    chatStore.messages.push(message);
    chatStore.error = null;
  },

  // 添加AI消息（开始流式）
  startAssistantMessage: () => {
    const message: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      isStreaming: true,
    };
    chatStore.messages.push(message);
    chatStore.isStreaming = true;
    return message.id;
  },

  // 更新AI消息内容（流式）
  appendAssistantContent: (messageId: string, chunk: string) => {
    const message = chatStore.messages.find(m => m.id === messageId);
    if (message) {
      message.content += chunk;
    }
  },

  // 结束AI消息流式
  finishAssistantMessage: (messageId: string) => {
    const message = chatStore.messages.find(m => m.id === messageId);
    if (message) {
      message.isStreaming = false;
    }
    chatStore.isStreaming = false;
  },

  // 设置错误
  setError: (error: string) => {
    chatStore.error = error;
    chatStore.isStreaming = false;
  },

  // 清除错误
  clearError: () => {
    chatStore.error = null;
  },

  // 更新Git配置
  setGitConfig: (config: GitConfig) => {
    chatStore.gitConfig = config;
  },

  // 更新Git分析数据
  setGitData: (data: GitAnalysisResult) => {
    chatStore.gitData = data;
  },

  // 清空消息
  clearMessages: () => {
    chatStore.messages = [];
    chatStore.error = null;
  },

  // 重置状态
  reset: () => {
    chatStore.messages = [];
    chatStore.isStreaming = false;
    chatStore.gitConfig = null;
    chatStore.gitData = null;
    chatStore.error = null;
  },

  // 初始化默认配置
  initDefaultConfig: (repoPath: string = '') => {
    const { since, until } = getDefaultDateRange();
    chatStore.gitConfig = {
      repoPath,
      since,
      until,
    };
  },
};
