import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Button, Alert, Space, Typography } from 'antd';
import { FolderOpenOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { GitConfig, GitAnalysisResult } from '../../types';
import { chatActions } from '../../stores/chatStore';
import { analyzeGit } from '../../services/api';

const { Text } = Typography;

interface GitConfigFormProps {
  onAnalysisComplete?: (data: GitAnalysisResult) => void;
}

const GitConfigForm: React.FC<GitConfigFormProps> = ({ onAnalysisComplete }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化默认日期（本周）
  useEffect(() => {
    const now = dayjs();
    const dayOfWeek = now.day();
    const monday = now.subtract(dayOfWeek === 0 ? 6 : dayOfWeek - 1, 'day');
    const sunday = monday.add(6, 'day');

    form.setFieldsValue({
      since: monday,
      until: sunday,
    });
  }, [form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    setError(null);

    const config: GitConfig = {
      repoPath: values.repoPath,
      since: values.since.format('YYYY-MM-DD'),
      until: values.until.format('YYYY-MM-DD'),
      author: values.author || undefined,
    };

    try {
      const result = await analyzeGit(config);

      if (result.success && result.data) {
        chatActions.setGitConfig(config);
        chatActions.setGitData(result.data);
        onAnalysisComplete?.(result.data);
      } else {
        setError(result.error || '分析失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setLoading(false);
    }
  };

  const setThisWeek = () => {
    const now = dayjs();
    const dayOfWeek = now.day();
    const monday = now.subtract(dayOfWeek === 0 ? 6 : dayOfWeek - 1, 'day');
    const sunday = monday.add(6, 'day');

    form.setFieldsValue({
      since: monday,
      until: sunday,
    });
  };

  const setLastWeek = () => {
    const now = dayjs();
    const dayOfWeek = now.day();
    const thisMonday = now.subtract(dayOfWeek === 0 ? 6 : dayOfWeek - 1, 'day');
    const lastMonday = thisMonday.subtract(7, 'day');
    const lastSunday = lastMonday.add(6, 'day');

    form.setFieldsValue({
      since: lastMonday,
      until: lastSunday,
    });
  };

  return (
    <div style={{ padding: '16px' }}>
      <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '16px' }}>
        Git配置
      </Text>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: '16px' }}
        />
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="repoPath"
          label="项目路径"
          rules={[{ required: true, message: '请输入Git项目路径' }]}
        >
          <Input
            placeholder="例如: D:\\project\\my-repo"
            prefix={<FolderOpenOutlined />}
          />
        </Form.Item>

        <Form.Item label="时间范围" required>
          <Space>
            <Button size="small" onClick={setThisWeek}>
              本周
            </Button>
            <Button size="small" onClick={setLastWeek}>
              上周
            </Button>
          </Space>
        </Form.Item>

        <Space direction="horizontal" style={{ width: '100%' }}>
          <Form.Item
            name="since"
            label="开始日期"
            rules={[{ required: true, message: '请选择开始日期' }]}
            style={{ marginBottom: 0 }}
          >
            <DatePicker placeholder="开始日期" />
          </Form.Item>

          <Form.Item
            name="until"
            label="结束日期"
            rules={[{ required: true, message: '请选择结束日期' }]}
            style={{ marginBottom: 0 }}
          >
            <DatePicker placeholder="结束日期" />
          </Form.Item>
        </Space>

        <Form.Item
          name="author"
          label="作者筛选（可选）"
          style={{ marginTop: '16px' }}
        >
          <Input placeholder="例如: zhangsan，留空分析所有提交" />
        </Form.Item>

        <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<ReloadOutlined />}
            block
          >
            {loading ? '分析中...' : '分析Git记录'}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default GitConfigForm;
