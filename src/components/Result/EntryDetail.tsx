import React from 'react';
import { Card, Tabs, Tag, Typography, Empty, Badge, Descriptions } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { EntryCompareResult } from '../../types';
import { HeaderDiffView } from '../Diff/HeaderDiff';
import { CookieDiffView } from '../Diff/CookieDiff';
import { BodyDiffView } from '../Diff/BodyDiff';
import { UrlDiff } from '../Diff/UrlDiff';

const { Text, Title } = Typography;

interface EntryDetailProps {
  entry: EntryCompareResult | null;
}

export const EntryDetail: React.FC<EntryDetailProps> = ({ entry }) => {
  if (!entry) {
    return (
      <Card className="h-full">
        <Empty description="选择一个请求查看详情" />
      </Card>
    );
  }

  const reqHeaderHasDiff =
    entry.request.headerDiff.different.length > 0 ||
    entry.request.headerDiff.missing.length > 0 ||
    entry.request.headerDiff.extra.length > 0;

  const reqCookieHasDiff =
    entry.request.cookieDiff.different.length > 0 ||
    entry.request.cookieDiff.missing.length > 0 ||
    entry.request.cookieDiff.extra.length > 0;

  const reqBodyHasDiff = entry.request.bodyDiff.status === 'different';

  const respHeaderHasDiff =
    entry.response.headerDiff.different.length > 0 ||
    entry.response.headerDiff.missing.length > 0 ||
    entry.response.headerDiff.extra.length > 0;

  const respCookieHasDiff =
    entry.response.cookieDiff.different.length > 0 ||
    entry.response.cookieDiff.missing.length > 0 ||
    entry.response.cookieDiff.extra.length > 0;

  const respBodyHasDiff = entry.response.bodyDiff.status === 'different';

  const tabItems = [
    {
      key: 'request',
      label: (
        <Badge dot={reqHeaderHasDiff || reqCookieHasDiff || reqBodyHasDiff} offset={[6, 0]}>
          请求
        </Badge>
      ),
      children: (
        <Tabs
          size="small"
          items={[
            {
              key: 'req-headers',
              label: (
                <span>
                  Headers
                  {reqHeaderHasDiff && <WarningOutlined className="ml-1 text-orange-500" />}
                </span>
              ),
              children: <HeaderDiffView diff={entry.request.headerDiff} />,
            },
            {
              key: 'req-cookies',
              label: (
                <span>
                  Cookies
                  {reqCookieHasDiff && <WarningOutlined className="ml-1 text-orange-500" />}
                </span>
              ),
              children: <CookieDiffView diff={entry.request.cookieDiff} />,
            },
            {
              key: 'req-body',
              label: (
                <span>
                  Body
                  {reqBodyHasDiff && <WarningOutlined className="ml-1 text-orange-500" />}
                </span>
              ),
              children: <BodyDiffView diff={entry.request.bodyDiff} />,
            },
          ]}
        />
      ),
    },
    {
      key: 'response',
      label: (
        <Badge
          dot={!entry.response.statusCode.isIdentical || respHeaderHasDiff || respCookieHasDiff || respBodyHasDiff}
          offset={[6, 0]}
        >
          响应
        </Badge>
      ),
      children: (
        <>
          {/* 状态码对比 */}
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <Text strong>状态码: </Text>
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

          <Tabs
            size="small"
            items={[
              {
                key: 'resp-headers',
                label: (
                  <span>
                    Headers
                    {respHeaderHasDiff && <WarningOutlined className="ml-1 text-orange-500" />}
                  </span>
                ),
                children: <HeaderDiffView diff={entry.response.headerDiff} />,
              },
              {
                key: 'resp-cookies',
                label: (
                  <span>
                    Set-Cookie
                    {respCookieHasDiff && <WarningOutlined className="ml-1 text-orange-500" />}
                  </span>
                ),
                children: <CookieDiffView diff={entry.response.cookieDiff} />,
              },
              {
                key: 'resp-body',
                label: (
                  <span>
                    Body
                    {respBodyHasDiff && <WarningOutlined className="ml-1 text-orange-500" />}
                  </span>
                ),
                children: <BodyDiffView diff={entry.response.bodyDiff} />,
              },
            ]}
          />
        </>
      ),
    },
  ];

  return (
    <Card className="h-full overflow-auto" size="small">
      {/* 基本信息 */}
      <div className="mb-4">
        <Title level={5} className="mb-2">
          {entry.method} {entry.url}
        </Title>

        {/* URL 参数对比 */}
        {entry.originalWebvpnUrl && entry.originalSourceUrl ? (
          <div className="p-4 bg-gray-50 rounded border">
            <UrlDiff
              webvpnUrl={entry.originalWebvpnUrl}
              sourceUrl={entry.originalSourceUrl}
              label="URL 参数对比"
            />
          </div>
        ) : (
          <Descriptions size="small" column={1} bordered>
            {entry.originalWebvpnUrl && (
              <Descriptions.Item label="WebVPN URL">
                <Text copyable className="text-xs break-all">
                  {entry.originalWebvpnUrl}
                </Text>
              </Descriptions.Item>
            )}
            {entry.originalSourceUrl && (
              <Descriptions.Item label="源站 URL">
                <Text copyable className="text-xs break-all">
                  {entry.originalSourceUrl}
                </Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </div>

      {/* 详情标签页 */}
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
        <Tabs items={tabItems} />
      )}
    </Card>
  );
};
