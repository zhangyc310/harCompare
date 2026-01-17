import React, { useState } from 'react';
import { Card, Tag, Empty, Button, Space } from 'antd';
import {
  ExpandOutlined,
  ShrinkOutlined,
} from '@ant-design/icons';
import type { EntryCompareResult } from '../../types';
import { HeaderTable } from '../Diff/HeaderTable';
import { BodyDiffView } from '../Diff/BodyDiff';

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

  // 构建基本信息行（Method 和 URL）
  const basicInfoRows = [
    {
      key: 'method',
      name: '请求方法',
      webvpnValue: entry.method,
      sourceValue: entry.method,
    },
    {
      key: 'url',
      name: 'URL',
      webvpnValue: entry.originalWebvpnUrl || entry.url,
      sourceValue: entry.originalSourceUrl || entry.url,
    },
  ];

  const statusCodeRows = [
    {
      key: 'status',
      name: '响应状态码',
      webvpnValue: entry.response.statusCode.webvpn ? `${entry.response.statusCode.webvpn}` : undefined,
      sourceValue: entry.response.statusCode.source ? `${entry.response.statusCode.source}` : undefined,
      status: entry.response.statusCode.isIdentical ? 'matched' as const : 'different' as const,
    },
  ];

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
          {/* 请求信息（含 Method 和 URL） */}
          <HeaderTable
            key={`req-header-${collapseKey}`}
            diff={entry.request.headerDiff}
            title="请求信息"
            defaultCollapsed={collapsed}
            extraRows={basicInfoRows}
          />

          {/* 请求 Body */}
          <div>
            <BodyDiffView
              key={`req-body-${collapseKey}`}
              diff={entry.request.bodyDiff}
              defaultCollapsed={collapsed}
            />
          </div>

          {/* 响应信息（含状态码） */}
          <HeaderTable
            key={`resp-header-${collapseKey}`}
            diff={entry.response.headerDiff}
            title="响应信息"
            defaultCollapsed={collapsed}
            extraRows={statusCodeRows}
          />

          {/* 响应 Body */}
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
