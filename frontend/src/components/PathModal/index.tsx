import React from 'react';
import { Modal, Input } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import * as styles from './PathModal.module.scss';

interface PathModalProps {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onOk: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const PathModal: React.FC<PathModalProps> = ({
  open,
  value,
  onChange,
  onOk,
  onCancel,
  loading,
}) => {
  return (
    <Modal
      title={null}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="开始分析"
      cancelText="取消"
      confirmLoading={loading}
      centered
      width={440}
      destroyOnClose
    >
      <div className={styles.modalHeader}>
        <div className={styles.modalIcon}>
          <FolderOpenOutlined />
        </div>
        <h3 className={styles.modalTitle}>选择Git项目</h3>
        <p className={styles.modalDesc}>输入本地Git仓库的完整路径</p>
      </div>
      <Input
        placeholder="例如: D:\project\my-repo"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPressEnter={onOk}
        prefix={<FolderOpenOutlined />}
        size="large"
        className={styles.input}
        autoFocus
      />
    </Modal>
  );
};

export default PathModal;
