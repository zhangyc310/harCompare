import React from 'react';
import { Table, Tag, Typography, Empty, Collapse } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import type { HeaderDiff, CookieHeaderDiff } from '../../types';

const { Text } = Typography;

export interface ExtraRow {
  key: string;
  name: string;
  webvpnValue: string | undefined;
  sourceValue: string | undefined;
  status?: 'matched' | 'different' | 'missing' | 'extra';
}

interface HeaderTableProps {
  diff: HeaderDiff;
  title: string;
  defaultCollapsed?: boolean;
  extraRows?: ExtraRow[]; // 额外的行（如 Method、URL）
}

interface HeaderRow {
  key: string;
  name: string;
  webvpnValue: string | undefined;
  sourceValue: string | undefined;
  status: 'matched' | 'different' | 'missing' | 'extra';
  isIdenticalAfterNormalization?: boolean;
  isExtraRow?: boolean; // 标记是否为额外行
}

export const HeaderTable: React.FC<HeaderTableProps> = ({
  diff,
  title,
  defaultCollapsed = false,
  extraRows = [],
}) => {
  const hasDifferences =
    diff.different.length > 0 || diff.missing.length > 0 || diff.extra.length > 0;

  // 构建表格数据
  const tableData: HeaderRow[] = [];

  // 0. 添加额外行（Method、URL 等）
  extraRows.forEach((row) => {
    // 判断额外行的状态
    let status: 'matched' | 'different' | 'missing' | 'extra' = 'matched';
    if (row.status) {
      status = row.status;
    } else if (row.webvpnValue === undefined && row.sourceValue !== undefined) {
      status = 'missing';
    } else if (row.webvpnValue !== undefined && row.sourceValue === undefined) {
      status = 'extra';
    } else if (row.webvpnValue !== row.sourceValue) {
      status = 'different';
    }

    tableData.push({
      key: row.key,
      name: row.name,
      webvpnValue: row.webvpnValue,
      sourceValue: row.sourceValue,
      status,
      isExtraRow: true,
    });
  });

  // 1. 有差异的 headers
  diff.different.forEach((item) => {
    tableData.push({
      key: `diff-${item.name}`,
      name: item.name,
      webvpnValue: item.webvpnValue,
      sourceValue: item.sourceValue,
      status: 'different',
      isIdenticalAfterNormalization: item.isIdenticalAfterNormalization,
    });
  });

  // 2. WebVPN 缺失的 headers
  diff.missing.forEach((header) => {
    tableData.push({
      key: `missing-${header.name}`,
      name: header.name,
      webvpnValue: undefined,
      sourceValue: header.value,
      status: 'missing',
    });
  });

  // 3. WebVPN 多出的 headers
  diff.extra.forEach((header) => {
    tableData.push({
      key: `extra-${header.name}`,
      name: header.name,
      webvpnValue: header.value,
      sourceValue: undefined,
      status: 'extra',
    });
  });

  // 4. 一致的 headers
  diff.matched.forEach((header) => {
    tableData.push({
      key: `matched-${header.name}`,
      name: header.name,
      webvpnValue: header.value,
      sourceValue: header.value,
      status: 'matched',
    });
  });

  if (tableData.length === 0) {
    return (
      <Collapse
        size="small"
        items={[
          {
            key: 'headers',
            label: (
              <span>
                <CheckCircleOutlined className="text-gray-400 mr-2" />
                {title}
              </span>
            ),
            children: <Empty description="无 Header 数据" />,
          },
        ]}
        defaultActiveKey={[]}
      />
    );
  }

  // 检测是否是单侧显示（webvpn_only 或 source_only）
  const hasWebvpnValues = tableData.some(row => row.webvpnValue !== undefined);
  const hasSourceValues = tableData.some(row => row.sourceValue !== undefined);
  const isWebvpnOnly = hasWebvpnValues && !hasSourceValues;
  const isSourceOnly = !hasWebvpnValues && hasSourceValues;

  // 渲染 Cookie Header 对比子表格
  const renderCookieHeaderTable = (cookieDiff: CookieHeaderDiff, headerName: string) => {
    const hasCookieDiff = cookieDiff.different.length > 0 || cookieDiff.missing.length > 0 || cookieDiff.extra.length > 0;
    const totalCount = cookieDiff.matched.length + cookieDiff.different.length + cookieDiff.missing.length + cookieDiff.extra.length;

    if (totalCount === 0) return null;

    // 构建 cookie 表格数据
    interface CookieRow {
      key: string;
      name: string;
      webvpnName?: string;
      sourceName?: string;
      webvpnValue?: string;
      sourceValue?: string;
      status: 'matched' | 'different' | 'missing' | 'extra';
    }

    const cookieTableData: CookieRow[] = [];

    // 值不同的
    cookieDiff.different.forEach((item, idx) => {
      cookieTableData.push({
        key: `diff-${idx}`,
        name: item.normalizedName,
        webvpnName: item.webvpnName,
        sourceName: item.sourceName,
        webvpnValue: item.webvpnValue,
        sourceValue: item.sourceValue,
        status: 'different',
      });
    });

    // WebVPN 缺失的
    cookieDiff.missing.forEach((item, idx) => {
      cookieTableData.push({
        key: `missing-${idx}`,
        name: item.normalizedName,
        webvpnName: undefined,
        sourceName: item.name,
        webvpnValue: undefined,
        sourceValue: item.value,
        status: 'missing',
      });
    });

    // WebVPN 多出的
    cookieDiff.extra.forEach((item, idx) => {
      cookieTableData.push({
        key: `extra-${idx}`,
        name: item.normalizedName,
        webvpnName: item.name,
        sourceName: undefined,
        webvpnValue: item.value,
        sourceValue: undefined,
        status: 'extra',
      });
    });

    // 一致的
    cookieDiff.matched.forEach((item, idx) => {
      cookieTableData.push({
        key: `matched-${idx}`,
        name: item.normalizedName,
        webvpnName: item.webvpnName,
        sourceName: item.sourceName,
        webvpnValue: item.webvpnValue,
        sourceValue: item.sourceValue,
        status: 'matched',
      });
    });

    const cookieColumns = [
      {
        title: 'Cookie 名称',
        dataIndex: 'name',
        width: 180,
        render: (name: string, record: CookieRow) => (
          <div className="flex items-center gap-2">
            {record.status === 'matched' && <CheckCircleOutlined className="text-green-500" />}
            {record.status === 'different' && <WarningOutlined className="text-orange-500" />}
            {record.status === 'missing' && <MinusCircleOutlined className="text-red-500" />}
            {record.status === 'extra' && <PlusCircleOutlined className="text-blue-500" />}
            <div>
              <Text code>{name}</Text>
              {record.webvpnName && record.webvpnName !== name && (
                <div className="text-xs text-gray-400 mt-1">
                  WebVPN: {record.webvpnName}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        title: 'WebVPN 值',
        dataIndex: 'webvpnValue',
        render: (value: string | undefined) => {
          if (value === undefined) {
            return <Text type="secondary" italic>-</Text>;
          }
          return (
            <Text className="break-all text-xs">
              {value.length > 80 ? value.substring(0, 80) + '...' : value}
            </Text>
          );
        },
      },
      {
        title: '源站值',
        dataIndex: 'sourceValue',
        render: (value: string | undefined) => {
          if (value === undefined) {
            return <Text type="secondary" italic>-</Text>;
          }
          return (
            <Text className="break-all text-xs">
              {value.length > 80 ? value.substring(0, 80) + '...' : value}
            </Text>
          );
        },
      },
    ];

    return {
      key: headerName,
      label: (
        <span>
          {hasCookieDiff ? (
            <>
              <WarningOutlined className="text-orange-500 mr-2" />
              <Text code>{headerName}</Text>
              <Tag color="warning" className="ml-2">
                {cookieDiff.different.length + cookieDiff.missing.length + cookieDiff.extra.length} 处差异
              </Tag>
            </>
          ) : (
            <>
              <CheckCircleOutlined className="text-green-500 mr-2" />
              <Text code>{headerName}</Text>
              <Tag color="success" className="ml-2">{totalCount} 个一致</Tag>
            </>
          )}
        </span>
      ),
      children: (
        <Table
          dataSource={cookieTableData}
          columns={cookieColumns}
          size="small"
          pagination={false}
          rowClassName={(record) => {
            if (record.status === 'different') return 'bg-orange-50';
            if (record.status === 'missing') return 'bg-red-50';
            if (record.status === 'extra') return 'bg-blue-50';
            return '';
          }}
        />
      ),
    };
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      width: 200,
      render: (name: string, record: HeaderRow) => (
        <div className="flex items-center gap-2">
          {!record.isExtraRow && (
            <>
              {record.status === 'matched' && <CheckCircleOutlined className="text-green-500" />}
              {record.status === 'different' && <WarningOutlined className="text-orange-500" />}
              {record.status === 'missing' && <MinusCircleOutlined className="text-red-500" />}
              {record.status === 'extra' && <PlusCircleOutlined className="text-blue-500" />}
            </>
          )}
          <Text code={!record.isExtraRow} strong={record.isExtraRow}>
            {name}
          </Text>
        </div>
      ),
    },
    {
      title: 'WebVPN 值',
      dataIndex: 'webvpnValue',
      width: isWebvpnOnly ? 600 : isSourceOnly ? 400 : undefined,
      render: (value: string | undefined, record: HeaderRow) => {
        if (value === undefined) {
          return <Text type="secondary" italic>-</Text>;
        }
        return (
          <div>
            <Text className="break-all text-xs">{value}</Text>
            {record.isIdenticalAfterNormalization && (
              <div className="mt-1">
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  规范化后一致
                </Tag>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '源站值',
      dataIndex: 'sourceValue',
      width: isSourceOnly ? 600 : isWebvpnOnly ? 400 : undefined,
      render: (value: string | undefined) => {
        if (value === undefined) {
          return <Text type="secondary" italic>-</Text>;
        }
        return <Text className="break-all text-xs">{value}</Text>;
      },
    },
  ];

  // 计算 cookie header 的差异数量
  const cookieHeaderDiffCount = diff.cookieHeaderDiff
    ? diff.cookieHeaderDiff.different.length + diff.cookieHeaderDiff.missing.length + diff.cookieHeaderDiff.extra.length
    : 0;
  const setCookieHeaderDiffCount = diff.setCookieHeaderDiff
    ? diff.setCookieHeaderDiff.different.length + diff.setCookieHeaderDiff.missing.length + diff.setCookieHeaderDiff.extra.length
    : 0;

  // 总差异数（包含 cookie header）
  const totalDiffCount = diff.different.length + diff.missing.length + diff.extra.length + cookieHeaderDiffCount + setCookieHeaderDiffCount;
  const hasAnyDifferences = totalDiffCount > 0;

  // 构建 collapse items
  const collapseItems: Array<{
    key: string;
    label: React.ReactNode;
    children: React.ReactNode;
  }> = [];

  // 普通 headers 表格（如果有数据）
  if (tableData.length > 0) {
    collapseItems.push({
      key: 'headers',
      label: (
        <span>
          {hasDifferences ? (
            <>
              <WarningOutlined className="text-orange-500 mr-2" />
              Headers
              <Tag color="warning" className="ml-2">
                {diff.different.length + diff.missing.length + diff.extra.length} 处差异
              </Tag>
            </>
          ) : (
            <>
              <CheckCircleOutlined className="text-green-500 mr-2" />
              Headers
              <Tag color="success" className="ml-2">全部一致</Tag>
            </>
          )}
        </span>
      ),
      children: (
        <Table
          dataSource={tableData}
          columns={columns}
          size="small"
          pagination={false}
          rowClassName={(record) => {
            if (record.status === 'different') return 'bg-orange-50';
            if (record.status === 'missing') return 'bg-red-50';
            if (record.status === 'extra') return 'bg-blue-50';
            return '';
          }}
        />
      ),
    });
  }

  // Cookie header 子表格
  if (diff.cookieHeaderDiff) {
    const cookieItem = renderCookieHeaderTable(diff.cookieHeaderDiff, 'Cookie');
    if (cookieItem) {
      collapseItems.push(cookieItem);
    }
  }

  // Set-Cookie header 子表格
  if (diff.setCookieHeaderDiff) {
    const setCookieItem = renderCookieHeaderTable(diff.setCookieHeaderDiff, 'Set-Cookie');
    if (setCookieItem) {
      collapseItems.push(setCookieItem);
    }
  }

  // 如果没有任何数据，显示空状态
  if (collapseItems.length === 0) {
    return (
      <Collapse
        size="small"
        items={[
          {
            key: 'empty',
            label: (
              <span>
                <CheckCircleOutlined className="text-gray-400 mr-2" />
                {title}
              </span>
            ),
            children: <Empty description="无 Header 数据" />,
          },
        ]}
        defaultActiveKey={[]}
      />
    );
  }

  return (
    <Collapse
      size="small"
      items={[
        {
          key: 'main',
          label: (
            <span>
              {hasAnyDifferences ? (
                <>
                  <WarningOutlined className="text-orange-500 mr-2" />
                  {title}
                  <Tag color="warning" className="ml-2">
                    {totalDiffCount} 处差异
                  </Tag>
                </>
              ) : (
                <>
                  <CheckCircleOutlined className="text-green-500 mr-2" />
                  {title}
                  <Tag color="success" className="ml-2">全部一致</Tag>
                </>
              )}
            </span>
          ),
          children: (
            <Collapse
              size="small"
              items={collapseItems}
              defaultActiveKey={defaultCollapsed ? [] : collapseItems.map(item => item.key)}
            />
          ),
        },
      ]}
      defaultActiveKey={defaultCollapsed ? [] : ['main']}
    />
  );
};
