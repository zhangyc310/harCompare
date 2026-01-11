import React, { useState, useMemo } from 'react';
import { Card, Input, Select, Tag, Typography, Empty, Badge } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { EntryCompareResult, DiffStatus } from '../../types';

const { Text } = Typography;
const { Search } = Input;

interface EntryListProps {
  entries: EntryCompareResult[];
  selectedId: string | null;
  onSelect: (entry: EntryCompareResult) => void;
}

const statusConfig: Record<DiffStatus, { color: string; icon: React.ReactNode; label: string }> = {
  identical: {
    color: 'success',
    icon: <CheckCircleOutlined />,
    label: '一致',
  },
  different: {
    color: 'warning',
    icon: <WarningOutlined />,
    label: '有差异',
  },
  webvpn_only: {
    color: 'processing',
    icon: <QuestionCircleOutlined />,
    label: '仅WebVPN',
  },
  source_only: {
    color: 'error',
    icon: <QuestionCircleOutlined />,
    label: '仅源站',
  },
};

const methodColors: Record<string, string> = {
  GET: 'blue',
  POST: 'green',
  PUT: 'orange',
  DELETE: 'red',
  PATCH: 'purple',
  OPTIONS: 'default',
  HEAD: 'default',
};

export const EntryList: React.FC<EntryListProps> = ({ entries, selectedId, onSelect }) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<DiffStatus | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // 过滤后的 entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // 搜索过滤
      if (searchText && !entry.url.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }
      // 状态过滤
      if (statusFilter !== 'all' && entry.status !== statusFilter) {
        return false;
      }
      // 方法过滤
      if (methodFilter !== 'all' && entry.method.toUpperCase() !== methodFilter) {
        return false;
      }
      return true;
    });
  }, [entries, searchText, statusFilter, methodFilter]);

  // 获取所有 HTTP 方法
  const methods = useMemo(() => {
    const methodSet = new Set(entries.map((e) => e.method.toUpperCase()));
    return Array.from(methodSet).sort();
  }, [entries]);

  // 计算是否有差异项
  const getDiffBadgeCount = (entry: EntryCompareResult): number => {
    if (entry.status !== 'different') return 0;

    let count = 0;
    if (!entry.response.statusCode.isIdentical) count++;
    if (entry.request.headerDiff.different.length > 0 ||
        entry.request.headerDiff.missing.length > 0 ||
        entry.request.headerDiff.extra.length > 0) count++;
    if (entry.request.cookieDiff.different.length > 0 ||
        entry.request.cookieDiff.missing.length > 0 ||
        entry.request.cookieDiff.extra.length > 0) count++;
    if (entry.request.bodyDiff.status === 'different') count++;
    if (entry.response.headerDiff.different.length > 0 ||
        entry.response.headerDiff.missing.length > 0 ||
        entry.response.headerDiff.extra.length > 0) count++;
    if (entry.response.cookieDiff.different.length > 0 ||
        entry.response.cookieDiff.missing.length > 0 ||
        entry.response.cookieDiff.extra.length > 0) count++;
    if (entry.response.bodyDiff.status === 'different') count++;
    return count;
  };

  return (
    <Card
      title="请求列表"
      className="h-full"
      size="small"
      extra={<Text type="secondary">{filteredEntries.length} / {entries.length}</Text>}
    >
      {/* 过滤器 */}
      <div className="flex gap-2 mb-3">
        <Search
          placeholder="搜索 URL"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
          allowClear
          size="small"
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 120 }}
          size="small"
          options={[
            { value: 'all', label: '全部状态' },
            { value: 'identical', label: '一致' },
            { value: 'different', label: '有差异' },
            { value: 'webvpn_only', label: '仅WebVPN' },
            { value: 'source_only', label: '仅源站' },
          ]}
        />
        <Select
          value={methodFilter}
          onChange={setMethodFilter}
          style={{ width: 100 }}
          size="small"
          options={[
            { value: 'all', label: '全部方法' },
            ...methods.map((m) => ({ value: m, label: m })),
          ]}
        />
      </div>

      {/* 列表 */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 500px)' }}>
        {filteredEntries.length === 0 ? (
          <Empty description="没有匹配的请求" />
        ) : (
          filteredEntries.map((entry) => {
            const config = statusConfig[entry.status];
            const diffCount = getDiffBadgeCount(entry);
            const isSelected = entry.id === selectedId;

            return (
              <div
                key={entry.id}
                className={`entry-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelect(entry)}
              >
                <div className="flex items-center gap-2">
                  <Tag color={methodColors[entry.method.toUpperCase()] || 'default'}>
                    {entry.method}
                  </Tag>
                  <Badge count={diffCount} size="small" offset={[0, 0]}>
                    <Tag color={config.color} icon={config.icon}>
                      {config.label}
                    </Tag>
                  </Badge>
                </div>
                <div className="mt-1">
                  <Text
                    ellipsis={{ tooltip: entry.url }}
                    className="text-sm"
                    style={{ maxWidth: '100%', display: 'block' }}
                  >
                    {entry.url}
                  </Text>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
