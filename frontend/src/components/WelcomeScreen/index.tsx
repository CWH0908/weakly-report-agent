import React from 'react';
import { FolderOpenOutlined, ThunderboltOutlined, BranchesOutlined } from '@ant-design/icons';
import * as styles from './WelcomeScreen.module.scss';

interface WelcomeScreenProps {
  onSelectProject: () => void;
  onHelp: () => void;
}

// 代码字符串 - 更长更真实
const codeStrings = [
  'git commit -m "feat"',
  'push origin main',
  'merge feature/dev',
  'const data = {}',
  'npm run build',
  'export default',
  'fix: resolve bug',
  'async function()',
  'import { useState }',
  'git pull --rebase',
  'checkout -b feat',
  'return response',
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectProject, onHelp }) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          {/* 代码流瀑布 */}
          <div className={styles.codeRain}>
            {/* 亮色列 */}
            <div className={`${styles.codeColumn} ${styles.colBright} ${styles.col1}`}>{codeStrings[0]}</div>
            <div className={`${styles.codeColumn} ${styles.colBright} ${styles.col5}`}>{codeStrings[4]}</div>
            <div className={`${styles.codeColumn} ${styles.colBright} ${styles.col9}`}>{codeStrings[8]}</div>
            
            {/* 中等亮度列 */}
            <div className={`${styles.codeColumn} ${styles.colMedium} ${styles.col2}`}>{codeStrings[1]}</div>
            <div className={`${styles.codeColumn} ${styles.colMedium} ${styles.col4}`}>{codeStrings[3]}</div>
            <div className={`${styles.codeColumn} ${styles.colMedium} ${styles.col7}`}>{codeStrings[6]}</div>
            <div className={`${styles.codeColumn} ${styles.colMedium} ${styles.col10}`}>{codeStrings[9]}</div>
            
            {/* 较暗背景列 */}
            <div className={`${styles.codeColumn} ${styles.colDim} ${styles.col3}`}>{codeStrings[2]}</div>
            <div className={`${styles.codeColumn} ${styles.colDim} ${styles.col6}`}>{codeStrings[5]}</div>
            <div className={`${styles.codeColumn} ${styles.colDim} ${styles.col8}`}>{codeStrings[7]}</div>
            <div className={`${styles.codeColumn} ${styles.colDim} ${styles.col11}`}>{codeStrings[10]}</div>
            <div className={`${styles.codeColumn} ${styles.colDim} ${styles.col12}`}>{codeStrings[11]}</div>
          </div>
          
          {/* 主图标 */}
          <div className={styles.icon}>
            <BranchesOutlined />
          </div>
        </div>
        
        <h2 className={styles.title}>
          <span className={styles.gradientText}>智能周报助手</span>
        </h2>
        
        <p className={styles.desc}>
          自然语言对话，基于Git提交记录生成周报
        </p>
        
        <div className={styles.quickActions}>
          <button className={styles.quickBtn} onClick={onSelectProject}>
            <FolderOpenOutlined />
            <span>选择项目</span>
          </button>
          <button className={styles.quickBtn} onClick={onHelp}>
            <ThunderboltOutlined />
            <span>快速帮助</span>
          </button>
        </div>
        
        <div className={styles.tipsCard}>
          <div className={styles.tipsHeader}>
            <ThunderboltOutlined />
            <span>试试这样说</span>
          </div>
          <ul className={styles.tipsList}>
            <li className={styles.tipsItem}>"分析 D:\project\my-repo 的本周提交"</li>
            <li className={styles.tipsItem}>"生成周报" / "生成上周周报"</li>
            <li className={styles.tipsItem}>"补充技术细节" / "让内容更简洁"</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
