import React, { useState } from 'react';
import { Card, Collapse, Tag, Typography, Button, Space, Divider, Table } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ExpandOutlined,
  ShrinkOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import type { EntryCompareResult, HarHeader } from '../../types';
import { HeaderTable } from '../Diff/HeaderTable';
import { BodyDiffView } from '../Diff/BodyDiff';

const { Text } = Typography;

interface CompareViewProps {
  entries: EntryCompareResult[];
}

export const CompareView: React.FC<CompareViewProps> = ({ entries }) => {
  const [collapsed, setCollapsed] = useState(true); // 默认折叠
  const [collapseKey, setCollapseKey] = useState(0); // 用于强制重新渲染

  // 切换展开/折叠
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
    setCollapseKey((prev) => prev + 1);
  };

  // 构建折叠面板项
  const collapseItems = entries.map((entry) => {
    const hasDiff = entry.status === 'different';
    const isWebvpnOnly = entry.status === 'webvpn_only';
    const isSourceOnly = entry.status === 'source_only';

    // 状态图标和颜色
    let statusIcon = <CheckCircleOutlined className="text-green-500" />;
    let statusText = '一致';
    let statusColor = 'success';

    if (hasDiff) {
      statusIcon = <WarningOutlined className="text-orange-500" />;
      statusText = '有差异';
      statusColor = 'warning';
    } else if (isWebvpnOnly) {
      statusIcon = <QuestionCircleOutlined className="text-blue-500" />;
      statusText = '仅WebVPN';
      statusColor = 'processing';
    } else if (isSourceOnly) {
      statusIcon = <QuestionCircleOutlined className="text-red-500" />;
      statusText = '仅源站';
      statusColor = 'error';
    }

    return {
      key: entry.id,
      label: (
        <div className="flex items-center justify-between w-full">
          <Space>
            {statusIcon}
            <Tag color="blue">{entry.method}</Tag>
            <Text ellipsis className="max-w-md">
              {entry.url}
            </Text>
          </Space>
          <Tag color={statusColor}>{statusText}</Tag>
        </div>
      ),
      children: <EntryDetailContent entry={entry} collapseKey={collapseKey} collapsed={collapsed} />,
    };
  });

  return (
    <Card
      title="对比详情"
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
      <Collapse
        items={collapseItems}
        defaultActiveKey={collapsed ? [] : entries.map((e) => e.id)}
        size="small"
      />
    </Card>
  );
};

// 单个请求的详情内容
interface EntryDetailContentProps {
  entry: EntryCompareResult;
  collapseKey: number;
  collapsed: boolean;
}

const EntryDetailContent: React.FC<EntryDetailContentProps> = ({ entry, collapseKey, collapsed }) => {
  // 对于 webvpn_only 或 source_only，显示完整的请求/响应信息
  if (entry.status === 'webvpn_only' || entry.status === 'source_only') {
    const harEntry = entry.status === 'webvpn_only' ? entry.webvpnEntry : entry.sourceEntry;

    if (!harEntry) {
      return <Text type="secondary">无详细信息</Text>;
    }

    return (
      <Space direction="vertical" size="middle" className="w-full">
        {/* URL 信息 */}
        <div>
          <Space>
            <Tag color={entry.status === 'webvpn_only' ? 'blue' : 'green'}>{entry.method}</Tag>
            <Text strong>{entry.status === 'webvpn_only' ? 'WebVPN' : '源站'}:</Text>
          </Space>
          <div className="mt-1 ml-2">
            <Text copyable className="text-xs break-all text-gray-600">
              {harEntry.request.url}
            </Text>
          </div>
        </div>

        <Divider className="my-2" />

        {/* 请求 Headers */}
        <SingleSideHeaderTable
          headers={harEntry.request.headers}
          title="请求 Headers"
          defaultCollapsed={collapsed}
          keyPrefix={`${entry.id}-req-header-${collapseKey}`}
        />

        {/* 请求 Body */}
        {harEntry.request.postData?.text && (
          <SingleSideBodyView
            body={harEntry.request.postData.text}
            mimeType={harEntry.request.postData.mimeType}
            title="请求 Body"
            defaultCollapsed={collapsed}
            keyPrefix={`${entry.id}-req-body-${collapseKey}`}
          />
        )}

        <Divider className="my-2" />

        {/* 响应状态码 */}
        <div className="p-3 bg-gray-50 rounded">
          <Text strong>响应状态码: </Text>
          <Tag color="blue">{harEntry.response.status}</Tag>
          <Text type="secondary">{harEntry.response.statusText}</Text>
        </div>

        {/* 响应 Headers */}
        <SingleSideHeaderTable
          headers={harEntry.response.headers}
          title="响应 Headers"
          defaultCollapsed={collapsed}
          keyPrefix={`${entry.id}-resp-header-${collapseKey}`}
        />

        {/* 响应 Body */}
        {harEntry.response.content.text && (
          <SingleSideBodyView
            body={harEntry.response.content.text}
            mimeType={harEntry.response.content.mimeType}
            title="响应 Body"
            defaultCollapsed={collapsed}
            keyPrefix={`${entry.id}-resp-body-${collapseKey}`}
          />
        )}
      </Space>
    );
  }

  // 对于正常的对比结果，显示对比视图
  return (
    <Space direction="vertical" size="middle" className="w-full">
      {/* WebVPN URL */}
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

      {/* 源站 URL */}
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

      {/* 请求 Headers */}
      <HeaderTable
        key={`req-header-${collapseKey}`}
        diff={entry.request.headerDiff}
        title="请求 Headers"
        defaultCollapsed={collapsed}
      />

      {/* 请求 Body */}
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

      {/* 响应 Headers */}
      <HeaderTable
        key={`resp-header-${collapseKey}`}
        diff={entry.response.headerDiff}
        title="响应 Headers"
        defaultCollapsed={collapsed}
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
  );
};

// 单侧 Headers 表格（用于 webvpn_only/source_only）
interface SingleSideHeaderTableProps {
  headers: HarHeader[];
  title: string;
  defaultCollapsed: boolean;
  keyPrefix: string;
}

const SingleSideHeaderTable: React.FC<SingleSideHeaderTableProps> = ({
  headers,
  title,
  defaultCollapsed,
  keyPrefix,
}) => {
  return (
    <Collapse
      size="small"
      items={[
        {
          key: keyPrefix,
          label: (
            <span>
              <CheckCircleOutlined className="text-blue-500 mr-2" />
              {title}
              <Tag color="blue" className="ml-2">
                {headers.length} 个
              </Tag>
            </span>
          ),
          children: (
            <Table
              dataSource={headers}
              rowKey="name"
              size="small"
              pagination={false}
              columns={[
                {
                  title: 'Header 名称',
                  dataIndex: 'name',
                  width: 200,
                  render: (name) => <Text code>{name}</Text>,
                },
                {
                  title: '值',
                  dataIndex: 'value',
                  render: (value) => <Text className="break-all text-xs">{value}</Text>,
                },
              ]}
            />
          ),
        },
      ]}
      defaultActiveKey={defaultCollapsed ? [] : [keyPrefix]}
    />
  );
};

// 单侧 Body 视图（用于 webvpn_only/source_only）
interface SingleSideBodyViewProps {
  body: string;
  mimeType?: string;
  title: string;
  defaultCollapsed: boolean;
  keyPrefix: string;
}

const SingleSideBodyView: React.FC<SingleSideBodyViewProps> = ({
  body,
  mimeType,
  title,
  defaultCollapsed,
  keyPrefix,
}) => {
  // 格式化 JSON
  const formatJson = (text: string): string => {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  };

  const isJson = mimeType?.includes('json') || false;
  const displayBody = isJson ? formatJson(body) : body;
  const bodySize = body.length;

  return (
    <Collapse
      size="small"
      items={[
        {
          key: keyPrefix,
          label: (
            <span>
              <CheckCircleOutlined className="text-blue-500 mr-2" />
              {title}
              <Tag color="blue" className="ml-2">
                {bodySize} bytes{mimeType && ` | ${mimeType}`}
              </Tag>
            </span>
          ),
          children: (
            <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-96">
              {displayBody}
            </pre>
          ),
        },
      ]}
      defaultActiveKey={defaultCollapsed ? [] : [keyPrefix]}
    />
  );
};
