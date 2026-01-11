import React from 'react';
import { Table, Typography, Empty, Collapse } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  PlusOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import type { CookieDiff } from '../../types';

const { Text } = Typography;

interface CookieDiffViewProps {
  diff: CookieDiff;
}

export const CookieDiffView: React.FC<CookieDiffViewProps> = ({ diff }) => {
  const hasDifferences =
    diff.different.length > 0 || diff.missing.length > 0 || diff.extra.length > 0;

  if (!hasDifferences && diff.matched.length === 0) {
    return <Empty description="无 Cookie 数据" />;
  }

  const collapseItems = [];

  // 值不同的 cookies
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
          rowKey="normalizedName"
          size="small"
          pagination={false}
          columns={[
            {
              title: 'Cookie 名称',
              dataIndex: 'normalizedName',
              width: 150,
              render: (name, record) => (
                <div>
                  <Text code>{name}</Text>
                  {record.webvpnName !== record.sourceName && (
                    <div className="text-xs text-gray-400 mt-1">
                      WebVPN: {record.webvpnName}
                    </div>
                  )}
                </div>
              ),
            },
            {
              title: 'WebVPN 值',
              dataIndex: 'webvpnValue',
              render: (value) => (
                <Text className="break-all text-xs" style={{ maxWidth: 200 }}>
                  {value.length > 100 ? value.substring(0, 100) + '...' : value}
                </Text>
              ),
            },
            {
              title: '源站值',
              dataIndex: 'sourceValue',
              render: (value) => (
                <Text className="break-all text-xs" style={{ maxWidth: 200 }}>
                  {value.length > 100 ? value.substring(0, 100) + '...' : value}
                </Text>
              ),
            },
          ]}
        />
      ),
    });
  }

  // WebVPN 缺失的 cookies
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
              title: 'Cookie 名称',
              dataIndex: 'name',
              width: 150,
              render: (name) => <Text code>{name}</Text>,
            },
            {
              title: '源站值',
              dataIndex: 'value',
              render: (value) => (
                <Text className="break-all text-xs">
                  {value.length > 150 ? value.substring(0, 150) + '...' : value}
                </Text>
              ),
            },
          ]}
        />
      ),
    });
  }

  // WebVPN 多出的 cookies
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
              title: 'Cookie 名称',
              dataIndex: 'name',
              width: 150,
              render: (name) => <Text code>{name}</Text>,
            },
            {
              title: 'WebVPN 值',
              dataIndex: 'value',
              render: (value) => (
                <Text className="break-all text-xs">
                  {value.length > 150 ? value.substring(0, 150) + '...' : value}
                </Text>
              ),
            },
          ]}
        />
      ),
    });
  }

  // 一致的 cookies
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
          rowKey="normalizedName"
          size="small"
          pagination={false}
          columns={[
            {
              title: 'Cookie 名称',
              dataIndex: 'normalizedName',
              width: 150,
              render: (name, record) => (
                <div>
                  <Text code>{name}</Text>
                  {record.webvpnCookie.name !== record.sourceCookie.name && (
                    <div className="text-xs text-gray-400 mt-1">
                      WebVPN: {record.webvpnCookie.name}
                    </div>
                  )}
                </div>
              ),
            },
            {
              title: '值',
              render: (_, record) => (
                <Text className="break-all text-xs">
                  {record.webvpnCookie.value.length > 100
                    ? record.webvpnCookie.value.substring(0, 100) + '...'
                    : record.webvpnCookie.value}
                </Text>
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
