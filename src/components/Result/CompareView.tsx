import React, { useState } from 'react';
import { Card, Collapse, Tag, Typography, Button, Space } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  ExpandOutlined,
  ShrinkOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import type { EntryCompareResult, HeaderDiff } from '../../types';
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
  // 对于 webvpn_only 或 source_only，也使用3列表格，缺失侧显示 undefined
  if (entry.status === 'webvpn_only' || entry.status === 'source_only') {
    const isWebvpnOnly = entry.status === 'webvpn_only';
    const harEntry = isWebvpnOnly ? entry.webvpnEntry : entry.sourceEntry;

    if (!harEntry) {
      return <Text type="secondary">无详细信息</Text>;
    }

    // 构建单边的 HeaderDiff（将所有 headers 作为 extra 或 missing）
    const requestHeaderDiff: HeaderDiff = {
      matched: [],
      different: [],
      missing: isWebvpnOnly ? [] : harEntry.request.headers,
      extra: isWebvpnOnly ? harEntry.request.headers : [],
    };

    const responseHeaderDiff: HeaderDiff = {
      matched: [],
      different: [],
      missing: isWebvpnOnly ? [] : harEntry.response.headers,
      extra: isWebvpnOnly ? harEntry.response.headers : [],
    };

    // 构建基本信息行
    const basicInfoRows = [
      {
        key: 'method',
        name: '请求方法',
        webvpnValue: isWebvpnOnly ? entry.method : undefined,
        sourceValue: isWebvpnOnly ? undefined : entry.method,
      },
      {
        key: 'url',
        name: '请求 URL',
        webvpnValue: isWebvpnOnly ? harEntry.request.url : undefined,
        sourceValue: isWebvpnOnly ? undefined : harEntry.request.url,
      },
    ];

    const statusCodeRows = [
      {
        key: 'status',
        name: '响应状态码',
        webvpnValue: isWebvpnOnly ? `${harEntry.response.status} ${harEntry.response.statusText}` : undefined,
        sourceValue: isWebvpnOnly ? undefined : `${harEntry.response.status} ${harEntry.response.statusText}`,
      },
    ];

    return (
      <Space direction="vertical" size="middle" className="w-full">
        {/* 请求 Headers（含 Method 和 URL） */}
        <HeaderTable
          key={`req-header-${collapseKey}`}
          diff={requestHeaderDiff}
          title="请求信息"
          defaultCollapsed={collapsed}
          extraRows={basicInfoRows}
        />

        {/* 请求 Body */}
        {harEntry.request.postData?.text && (
          <BodyDiffView
            key={`req-body-${collapseKey}`}
            diff={{
              status: isWebvpnOnly ? 'webvpn_only' : 'source_only',
              mimeType: harEntry.request.postData.mimeType,
              webvpnSize: isWebvpnOnly ? harEntry.request.postData.text.length : 0,
              sourceSize: isWebvpnOnly ? 0 : harEntry.request.postData.text.length,
              webvpnText: isWebvpnOnly ? harEntry.request.postData.text : undefined,
              sourceText: isWebvpnOnly ? undefined : harEntry.request.postData.text,
            }}
            defaultCollapsed={collapsed}
          />
        )}

        {/* 响应 Headers（含状态码） */}
        <HeaderTable
          key={`resp-header-${collapseKey}`}
          diff={responseHeaderDiff}
          title="响应信息"
          defaultCollapsed={collapsed}
          extraRows={statusCodeRows}
        />

        {/* 响应 Body */}
        {harEntry.response.content.text && (
          <BodyDiffView
            key={`resp-body-${collapseKey}`}
            diff={{
              status: isWebvpnOnly ? 'webvpn_only' : 'source_only',
              mimeType: harEntry.response.content.mimeType,
              webvpnSize: isWebvpnOnly ? harEntry.response.content.text.length : 0,
              sourceSize: isWebvpnOnly ? 0 : harEntry.response.content.text.length,
              webvpnText: isWebvpnOnly ? harEntry.response.content.text : undefined,
              sourceText: isWebvpnOnly ? undefined : harEntry.response.content.text,
            }}
            defaultCollapsed={collapsed}
          />
        )}
      </Space>
    );
  }

  // 对于正常的对比结果，显示对比视图
  const basicInfoRows = [
    {
      key: 'method',
      name: '请求方法',
      webvpnValue: entry.method,
      sourceValue: entry.method,
    },
    {
      key: 'url-webvpn',
      name: 'WebVPN URL',
      webvpnValue: entry.originalWebvpnUrl || entry.url,
      sourceValue: undefined,
    },
    {
      key: 'url-source',
      name: '源站 URL',
      webvpnValue: undefined,
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
    <Space direction="vertical" size="middle" className="w-full">
      {/* 请求 Headers（含 Method 和 URL） */}
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

      {/* 响应 Headers（含状态码） */}
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
  );
};
