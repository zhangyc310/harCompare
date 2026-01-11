import React from 'react';
import { Table, Tag, Typography, Empty, Tooltip, Collapse } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  PlusOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import type { HeaderDiff } from '../../types';

const { Text } = Typography;

interface HeaderDiffViewProps {
  diff: HeaderDiff;
}

export const HeaderDiffView: React.FC<HeaderDiffViewProps> = ({ diff }) => {
  const hasDifferences =
    diff.different.length > 0 || diff.missing.length > 0 || diff.extra.length > 0;

  if (!hasDifferences && diff.matched.length === 0) {
    return <Empty description="无 Header 数据" />;
  }

  const collapseItems = [];

  // 有差异的 headers
  if (diff.different.length > 0) {
    collapseItems.push({
      key: 'different',
      label: (
        <span>
          <WarningOutlined className="text-orange-500 mr-2" />
          值不同 ({diff.different.length})
        </span>
      ),
      children: (
        <Table
          dataSource={diff.different}
          rowKey="name"
          size="small"
          pagination={false}
          columns={[
            {
              title: 'Header',
              dataIndex: 'name',
              width: 150,
              render: (name) => <Text code>{name}</Text>,
            },
            {
              title: 'WebVPN',
              dataIndex: 'webvpnValue',
              render: (value, record) => (
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
              ),
            },
            {
              title: '源站',
              dataIndex: 'sourceValue',
              render: (value) => <Text className="break-all text-xs">{value}</Text>,
            },
            {
              title: '状态',
              width: 100,
              render: (_, record) =>
                record.isIdenticalAfterNormalization ? (
                  <Tag color="success">OK</Tag>
                ) : (
                  <Tag color="error">不一致</Tag>
                ),
            },
          ]}
        />
      ),
    });
  }

  // WebVPN 缺失的 headers
  if (diff.missing.length > 0) {
    collapseItems.push({
      key: 'missing',
      label: (
        <span>
          <MinusOutlined className="text-red-500 mr-2" />
          WebVPN 缺失 ({diff.missing.length})
        </span>
      ),
      children: (
        <Table
          dataSource={diff.missing}
          rowKey="name"
          size="small"
          pagination={false}
          columns={[
            {
              title: 'Header',
              dataIndex: 'name',
              width: 150,
              render: (name) => <Text code>{name}</Text>,
            },
            {
              title: '源站值',
              dataIndex: 'value',
              render: (value) => <Text className="break-all text-xs">{value}</Text>,
            },
          ]}
        />
      ),
    });
  }

  // WebVPN 多出的 headers
  if (diff.extra.length > 0) {
    collapseItems.push({
      key: 'extra',
      label: (
        <span>
          <PlusOutlined className="text-blue-500 mr-2" />
          WebVPN 多出 ({diff.extra.length})
        </span>
      ),
      children: (
        <Table
          dataSource={diff.extra}
          rowKey="name"
          size="small"
          pagination={false}
          columns={[
            {
              title: 'Header',
              dataIndex: 'name',
              width: 150,
              render: (name) => <Text code>{name}</Text>,
            },
            {
              title: 'WebVPN 值',
              dataIndex: 'value',
              render: (value) => <Text className="break-all text-xs">{value}</Text>,
            },
          ]}
        />
      ),
    });
  }

  // 一致的 headers
  if (diff.matched.length > 0) {
    collapseItems.push({
      key: 'matched',
      label: (
        <span>
          <CheckCircleOutlined className="text-green-500 mr-2" />
          一致 ({diff.matched.length})
        </span>
      ),
      children: (
        <Table
          dataSource={diff.matched}
          rowKey="name"
          size="small"
          pagination={false}
          columns={[
            {
              title: 'Header',
              dataIndex: 'name',
              width: 150,
              render: (name) => <Text code>{name}</Text>,
            },
            {
              title: '值',
              dataIndex: 'value',
              render: (value) => (
                <Tooltip title={value}>
                  <Text ellipsis className="text-xs" style={{ maxWidth: 400 }}>
                    {value}
                  </Text>
                </Tooltip>
              ),
            },
          ]}
        />
      ),
    });
  }

  return (
    <Collapse
      items={collapseItems}
      defaultActiveKey={hasDifferences ? ['different', 'missing', 'extra'] : ['matched']}
      size="small"
    />
  );
};
