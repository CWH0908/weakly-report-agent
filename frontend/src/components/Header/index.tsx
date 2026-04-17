import React from 'react';
import {
  RobotOutlined,
  DownloadOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import * as styles from './Header.module.scss';

interface HeaderProps {
  projectName?: string;
  onSelectProject: () => void;
  onExport: () => void;
  onClear: () => void;
  isAnalyzing?: boolean;
  isExporting?: boolean;
  isStreaming?: boolean;
  canExport?: boolean;
  canClear?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  projectName,
  onSelectProject,
  onExport,
  onClear,
  isAnalyzing,
  isExporting,
  isStreaming,
  canClear,
  canExport,
}) => {
  // 点击 logo 返回首页（清空对话）
  const handleLogoClick = () => {
    if (canClear && !isStreaming) {
      onClear();
    }
  };

  return (
    <header className={styles.header}>
      <div 
        className={`${styles.brand} ${canClear && !isStreaming ? styles.brandClickable : ''}`}
        onClick={handleLogoClick}
        title={canClear ? '返回首页' : undefined}
      >
        <div className={styles.brandIcon}>
          <RobotOutlined />
        </div>
        <div className={styles.brandText}>
          <h1 className={styles.brandTitle}>周报助手</h1>
          <span className={styles.brandBadge}>AI Powered</span>
        </div>
      </div>

      <div className={styles.actions}>
        {projectName && (
          <div className={styles.projectTag} title={`当前项目: ${projectName}`}>
            <span className={styles.tagDot} />
            <span>{projectName}</span>
          </div>
        )}
        
        <button
          className={styles.actionBtn}
          onClick={onSelectProject}
          disabled={isStreaming || isAnalyzing}
          title="选择项目文件夹"
        >
          <FolderOpenOutlined />
          <span className={styles.btnText}>项目</span>
        </button>
        
        <button
          className={styles.actionBtn}
          onClick={onExport}
          disabled={!canExport || isExporting}
          title="导出周报为 Markdown 文档"
        >
          <DownloadOutlined />
          <span className={styles.btnText}>导出</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
