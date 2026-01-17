import React from 'react';
import { Table, Tag, Typography, Empty, Collapse } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import type { HeaderDiff } from '../../types';

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
      width: isWebvpnOnly ? '60%' : isSourceOnly ? '40%' : undefined,
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
      width: isSourceOnly ? '60%' : isWebvpnOnly ? '40%' : undefined,
      render: (value: string | undefined) => {
        if (value === undefined) {
          return <Text type="secondary" italic>-</Text>;
        }
        return <Text className="break-all text-xs">{value}</Text>;
      },
    },
  ];

  return (
    <Collapse
      size="small"
      items={[
        {
          key: 'headers',
          label: (
            <span>
              {hasDifferences ? (
                <>
                  <WarningOutlined className="text-orange-500 mr-2" />
                  {title}
                  <Tag color="warning" className="ml-2">
                    {diff.different.length + diff.missing.length + diff.extra.length} 处差异
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
        },
      ]}
      defaultActiveKey={defaultCollapsed ? [] : hasDifferences ? ['headers'] : []}
    />
  );
};
