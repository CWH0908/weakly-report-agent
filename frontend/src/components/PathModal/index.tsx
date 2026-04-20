import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Input, Spin, Empty, DatePicker, Space, Button } from 'antd';
import { 
  FolderOpenOutlined, 
  FolderOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
  CheckCircleFilled,
  CalendarOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { listDirectory, DirItem } from '../../services/api';
import * as styles from './PathModal.module.scss';

// 日期范围
export interface DateRange {
  since: string;
  until: string;
}

interface PathModalProps {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onOk: (dateRange: DateRange) => void;
  onCancel: () => void;
  loading?: boolean;
}

// 计算本周一和周日
function getThisWeek(): [Dayjs, Dayjs] {
  const now = dayjs();
  const dayOfWeek = now.day();
  const monday = now.subtract(dayOfWeek === 0 ? 6 : dayOfWeek - 1, 'day');
  const sunday = monday.add(6, 'day');
  return [monday, sunday];
}

// 计算上周
function getLastWeek(): [Dayjs, Dayjs] {
  const [thisMonday] = getThisWeek();
  const lastMonday = thisMonday.subtract(7, 'day');
  const lastSunday = lastMonday.add(6, 'day');
  return [lastMonday, lastSunday];
}

// 计算上上周
function getWeekBeforeLast(): [Dayjs, Dayjs] {
  const [thisMonday] = getThisWeek();
  const monday = thisMonday.subtract(14, 'day');
  const sunday = monday.add(6, 'day');
  return [monday, sunday];
}

const PathModal: React.FC<PathModalProps> = ({
  open,
  value,
  onChange,
  onOk,
  onCancel,
  loading,
}) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [items, setItems] = useState<DirItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  
  // 时间范围状态
  const [since, setSince] = useState<Dayjs | null>(null);
  const [until, setUntil] = useState<Dayjs | null>(null);

  // 加载目录
  const loadDirectory = useCallback(async (path?: string) => {
    setListLoading(true);
    try {
      const res = await listDirectory(path);
      if (res.success) {
        setCurrentPath(res.path);
        setParentPath(res.parent);
        setItems(res.items);
      }
    } finally {
      setListLoading(false);
    }
  }, []);

  // 打开弹窗时初始化
  useEffect(() => {
    if (open) {
      // 初始化为本周
      const [monday, sunday] = getThisWeek();
      setSince(monday);
      setUntil(sunday);
      
      // 加载目录
      if (value) {
        const parentDir = value.replace(/[/\\][^/\\]+$/, '') || value;
        loadDirectory(parentDir);
      } else {
        loadDirectory();
      }
    }
  }, [open, loadDirectory]);

  // 点击文件夹
  const handleFolderClick = (item: DirItem) => {
    if (item.isGitRepo) {
      onChange(item.path);
    } else {
      loadDirectory(item.path);
    }
  };

  // 双击进入目录
  const handleFolderDoubleClick = (item: DirItem) => {
    loadDirectory(item.path);
  };

  // 返回上级
  const handleGoUp = () => {
    if (parentPath) {
      loadDirectory(parentPath);
    } else {
      loadDirectory();
    }
  };

  // 返回根目录
  const handleGoRoot = () => {
    loadDirectory();
  };

  // 确定按钮
  const handleOk = () => {
    if (!value || !since || !until) return;
    onOk({
      since: since.format('YYYY-MM-DD'),
      until: until.format('YYYY-MM-DD'),
    });
  };

  // 快捷时间按钮
  const setThisWeek = () => {
    const [monday, sunday] = getThisWeek();
    setSince(monday);
    setUntil(sunday);
  };

  const setLastWeek = () => {
    const [monday, sunday] = getLastWeek();
    setSince(monday);
    setUntil(sunday);
  };

  return (
    <Modal
      title={null}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="开始分析"
      cancelText="取消"
      confirmLoading={loading}
      okButtonProps={{ disabled: !value || !since || !until }}
      centered
      width={520}
      destroyOnClose
    >
      <div className={styles.modalHeader}>
        <div className={styles.modalIcon}>
          <FolderOpenOutlined />
        </div>
        <h3 className={styles.modalTitle}>选择Git项目</h3>
        <p className={styles.modalDesc}>浏览并选择本地Git仓库</p>
      </div>

      {/* 当前路径和导航 */}
      <div className={styles.pathBar}>
        <button 
          className={styles.navBtn} 
          onClick={handleGoRoot}
          title="回到根目录"
        >
          <HomeOutlined />
        </button>
        <button 
          className={styles.navBtn} 
          onClick={handleGoUp}
          disabled={!parentPath && !currentPath}
          title="返回上级"
        >
          <ArrowLeftOutlined />
        </button>
        <div className={styles.currentPath}>
          {currentPath || '我的电脑'}
        </div>
      </div>

      {/* 文件夹列表 */}
      <div className={styles.folderList}>
        {listLoading ? (
          <div className={styles.loadingWrapper}>
            <Spin />
          </div>
        ) : items.length === 0 ? (
          <Empty description="没有子文件夹" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          items.map((item) => (
            <div
              key={item.path}
              className={`${styles.folderItem} ${item.isGitRepo ? styles.gitRepo : ''} ${value === item.path ? styles.selected : ''}`}
              onClick={() => handleFolderClick(item)}
              onDoubleClick={() => handleFolderDoubleClick(item)}
            >
              <FolderOutlined className={styles.folderIcon} />
              <span className={styles.folderName}>{item.name}</span>
              {item.isGitRepo && (
                <span className={styles.gitBadge}>
                  <CheckCircleFilled /> Git
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* 手动输入 */}
      <div className={styles.manualInput}>
        <Input
          placeholder="或直接输入路径: D:\project\my-repo"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          prefix={<FolderOpenOutlined />}
          size="middle"
        />
      </div>

      {/* 时间范围选择 */}
      <div className={styles.dateSection}>
        <div className={styles.dateSectionTitle}>
          <CalendarOutlined /> 时间范围
        </div>
        <div className={styles.quickDates}>
          <Button size="small" onClick={setThisWeek}>本周</Button>
          <Button size="small" onClick={setLastWeek}>上周</Button>
        </div>
        <Space className={styles.datePickers}>
          <DatePicker
            value={since}
            onChange={setSince}
            placeholder="开始日期"
            size="middle"
          />
          <span className={styles.dateSeparator}>至</span>
          <DatePicker
            value={until}
            onChange={setUntil}
            placeholder="结束日期"
            size="middle"
          />
        </Space>
      </div>
    </Modal>
  );
};

export default PathModal;
