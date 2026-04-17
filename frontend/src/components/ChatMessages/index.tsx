import React, { useRef, useEffect, useState, useCallback } from 'react';
import { subscribe } from 'valtio';
import { RobotOutlined } from '@ant-design/icons';
import { Alert } from 'antd';
import { chatStore, chatActions } from '../../stores/chatStore';
import MarkdownContent from '../ReportPreview/index';
import * as styles from './ChatMessages.module.scss';

// 使用真实风格的头像
const UserAvatar = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.avatarImg}>
    <rect width="40" height="40" fill="url(#userGrad)" />
    <circle cx="20" cy="15" r="7" fill="rgba(255,255,255,0.9)" />
    <ellipse cx="20" cy="35" rx="12" ry="10" fill="rgba(255,255,255,0.9)" />
    <defs>
      <linearGradient id="userGrad" x1="0" y1="0" x2="40" y2="40">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
  </svg>
);

// 打字机效果组件 - 简化版
const TypewriterText: React.FC<{ 
  content: string; 
  isStreaming: boolean;
  onUpdate?: () => void;
}> = ({ content, isStreaming, onUpdate }) => {
  const [displayLength, setDisplayLength] = useState(0);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef(0);

  // 打字机动画循环
  useEffect(() => {
    // 不在流式状态时，显示全部
    if (!isStreaming) {
      setDisplayLength(content.length);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = (timestamp: number) => {
      // 每 20ms 更新一次
      if (timestamp - lastTimeRef.current > 20) {
        lastTimeRef.current = timestamp;
        
        setDisplayLength(prev => {
          if (prev < content.length) {
            // 每次增加 3-8 个字符
            const step = Math.min(8, Math.max(3, Math.floor(Math.random() * 6) + 3));
            const next = Math.min(prev + step, content.length);
            onUpdate?.();
            return next;
          }
          return prev;
        });
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [content, isStreaming, onUpdate]);

  const displayContent = content.slice(0, displayLength);
  const showCursor = isStreaming;

  return (
    <>
      <div className={styles.markdownContent}>
        <MarkdownContent content={displayContent || '...'} />
      </div>
      {showCursor && <span className={styles.cursor}>|</span>}
    </>
  );
};

// 单条消息组件
const MessageItem: React.FC<{ 
  content: string; 
  isStreaming?: boolean; 
  role: string;
  onContentUpdate?: () => void;
}> = ({ content, isStreaming, role, onContentUpdate }) => {
  // 对于非流式消息，直接显示
  const shouldUseTypewriter = role === 'assistant' && isStreaming;

  return (
    <div
      className={`${styles.messageItem} ${
        role === 'user' ? styles.messageUser : ''
      }`}
    >
      <div className={`${styles.avatar} ${
        role === 'assistant' ? styles.avatarAssistant : styles.avatarUser
      }`}>
        {role === 'assistant' ? <RobotOutlined /> : <UserAvatar />}
      </div>

      <div
        className={`${styles.bubble} ${
          role === 'assistant' ? styles.bubbleAssistant : styles.bubbleUser
        }`}
      >
        {isStreaming && !content ? (
          <div className={styles.loadingDots}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
        ) : role === 'assistant' ? (
          shouldUseTypewriter ? (
            <TypewriterText 
              content={content} 
              isStreaming={true}
              onUpdate={onContentUpdate}
            />
          ) : (
            <div className={styles.markdownContent}>
              <MarkdownContent content={content} />
            </div>
          )
        ) : (
          content
        )}
      </div>
    </div>
  );
};

const ChatMessages: React.FC = () => {
  const endRef = useRef<HTMLDivElement>(null);
  const [, setUpdateCount] = useState(0);
  
  useEffect(() => {
    const unsubscribe = subscribe(chatStore, () => {
      setUpdateCount(n => n + 1);
    });
    return unsubscribe;
  }, []);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const messages = chatStore.messages;
  const error = chatStore.error;

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  return (
    <div className={styles.container}>
      <div className={styles.messageList}>
        {messages.map((msg) => (
          <MessageItem 
            key={msg.id} 
            content={msg.content}
            isStreaming={msg.isStreaming}
            role={msg.role}
            onContentUpdate={scrollToBottom}
          />
        ))}
        
        {/* 错误提示 */}
        {error && (
          <div className={styles.errorAlert}>
            <Alert
              message="请求失败"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => chatActions.clearError()}
            />
          </div>
        )}
      </div>
      <div ref={endRef} />
    </div>
  );
};

export default ChatMessages;
