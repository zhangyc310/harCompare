import React, { useState } from 'react';
import { Card, Tag, Typography, Empty, Button, Space, Divider } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExpandOutlined,
  ShrinkOutlined,
} from '@ant-design/icons';
import type { EntryCompareResult } from '../../types';
import { HeaderTable } from '../Diff/HeaderTable';
import { BodyDiffView } from '../Diff/BodyDiff';

const { Text } = Typography;

interface EntryDetailProps {
  entry: EntryCompareResult | null;
}

export const EntryDetail: React.FC<EntryDetailProps> = ({ entry }) => {
  const [collapsed, setCollapsed] = useState(true); // 默认折叠
  const [collapseKey, setCollapseKey] = useState(0); // 用于强制重新渲染

  // 切换展开/折叠
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
    setCollapseKey((prev) => prev + 1); // 改变key强制重新渲染所有组件
  };

  if (!entry) {
    return (
      <Card className="h-full">
        <Empty description="选择一个请求查看详情" />
      </Card>
    );
  }

  return (
    <Card
      className="h-full overflow-auto"
      size="small"
      extra={
        <Button
          type="text"
          size="small"
          icon={collapsed ? <ExpandOutlined /> : <ShrinkOutlined />}
          onClick={toggleCollapse}
        >
          {collapsed ? '全部展开' : '全部折叠'}
        </Button>
      }
    >
      {/* 第一行：GET webvpn网址 */}
      <div className="mb-2">
        <Space>
          <Tag color="blue">{entry.method}</Tag>
          <Text strong>WebVPN:</Text>
        </Space>
        <div className="mt-1 ml-2">
          <Text copyable className="text-xs break-all text-gray-600">
            {entry.originalWebvpnUrl || entry.url}
          </Text>
        </div>
      </div>

      {/* 第二行：GET 源站网址 */}
      <div className="mb-4">
        <Space>
          <Tag color="green">{entry.method}</Tag>
          <Text strong>源站:</Text>
        </Space>
        <div className="mt-1 ml-2">
          <Text copyable className="text-xs break-all text-gray-600">
            {entry.originalSourceUrl || entry.url}
          </Text>
        </div>
      </div>

      <Divider className="my-4" />

      {/* 只在 webvpn_only 或 source_only 时显示提示 */}
      {entry.status === 'webvpn_only' || entry.status === 'source_only' ? (
        <div className="text-center py-8">
          <Tag
            color={entry.status === 'webvpn_only' ? 'processing' : 'error'}
            className="text-base px-4 py-2"
          >
            {entry.status === 'webvpn_only' ? '此请求仅存在于 WebVPN' : '此请求仅存在于源站'}
          </Tag>
        </div>
      ) : (
        <Space direction="vertical" size="middle" className="w-full">
          {/* 第三行：req headers 对比表格 */}
          <HeaderTable
            key={`req-header-${collapseKey}`}
            diff={entry.request.headerDiff}
            title="请求 Headers"
            defaultCollapsed={collapsed}
          />

          {/* 第四行：req body 对比 */}
          <div>
            <BodyDiffView
              key={`req-body-${collapseKey}`}
              diff={entry.request.bodyDiff}
              defaultCollapsed={collapsed}
            />
          </div>

          <Divider className="my-2" />

          {/* 响应状态码 */}
          <div className="p-3 bg-gray-50 rounded">
            <Text strong>响应状态码: </Text>
            {entry.response.statusCode.isIdentical ? (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                {entry.response.statusCode.webvpn} (一致)
              </Tag>
            ) : (
              <>
                <Tag color="blue">WebVPN: {entry.response.statusCode.webvpn ?? 'N/A'}</Tag>
                <Tag color="orange">源站: {entry.response.statusCode.source ?? 'N/A'}</Tag>
                <Tag color="error" icon={<CloseCircleOutlined />}>
                  不一致
                </Tag>
              </>
            )}
          </div>

          {/* 第五行：resp headers 对比表格 */}
          <HeaderTable
            key={`resp-header-${collapseKey}`}
            diff={entry.response.headerDiff}
            title="响应 Headers"
            defaultCollapsed={collapsed}
          />

          {/* 第六行：resp body 对比 */}
          <div>
            <BodyDiffView
              key={`resp-body-${collapseKey}`}
              diff={entry.response.bodyDiff}
              defaultCollapsed={collapsed}
            />
          </div>
        </Space>
      )}
    </Card>
  );
};
