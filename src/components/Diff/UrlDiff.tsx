import React from 'react';
import { Typography, Tag, Space } from 'antd';
import { CheckCircleOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface UrlDiffProps {
  webvpnUrl: string;
  sourceUrl: string;
  label?: string;
}

interface ParamDiff {
  key: string;
  webvpnValue: string | null;
  sourceValue: string | null;
  status: 'same' | 'different' | 'webvpn_only' | 'source_only';
}

/**
 * URL 参数对比组件
 * 用不同颜色显示参数差异
 */
export const UrlDiff: React.FC<UrlDiffProps> = ({ webvpnUrl, sourceUrl, label }) => {
  const parseUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      const params = new URLSearchParams(parsed.search);
      const base = `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
      return { base, params, hash: parsed.hash };
    } catch {
      return { base: url, params: new URLSearchParams(), hash: '' };
    }
  };

  const webvpnParsed = parseUrl(webvpnUrl);
  const sourceParsed = parseUrl(sourceUrl);

  // 比较参数差异
  const paramDiffs: ParamDiff[] = [];
  const processedKeys = new Set<string>();

  // 检查 WebVPN 参数
  for (const [key, value] of webvpnParsed.params.entries()) {
    processedKeys.add(key);
    const sourceValue = sourceParsed.params.get(key);

    if (sourceValue === null) {
      paramDiffs.push({ key, webvpnValue: value, sourceValue: null, status: 'webvpn_only' });
    } else if (sourceValue === value) {
      paramDiffs.push({ key, webvpnValue: value, sourceValue, status: 'same' });
    } else {
      paramDiffs.push({ key, webvpnValue: value, sourceValue, status: 'different' });
    }
  }

  // 检查源站独有参数
  for (const [key, value] of sourceParsed.params.entries()) {
    if (!processedKeys.has(key)) {
      paramDiffs.push({ key, webvpnValue: null, sourceValue: value, status: 'source_only' });
    }
  }

  const hasParams = paramDiffs.length > 0;
  const hasDiff = paramDiffs.some((p) => p.status !== 'same');

  return (
    <div className="url-diff">
      {label && (
        <Text strong className="block mb-2">
          {label}
        </Text>
      )}

      {/* 基础路径 */}
      <div className="mb-2">
        <Text type="secondary" className="text-xs">
          基础路径:
        </Text>
        <div className="mt-1">
          <Text code className="text-xs break-all">
            {webvpnParsed.base}
          </Text>
        </div>
      </div>

      {/* 查询参数对比 */}
      {hasParams ? (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2">
            <Text type="secondary" className="text-xs">
              查询参数:
            </Text>
            {hasDiff ? (
              <Tag icon={<WarningOutlined />} color="warning" className="text-xs">
                有差异
              </Tag>
            ) : (
              <Tag icon={<CheckCircleOutlined />} color="success" className="text-xs">
                完全一致
              </Tag>
            )}
          </div>

          <Space direction="vertical" size="small" className="w-full">
            {paramDiffs.map((diff, index) => (
              <div key={`${diff.key}-${index}`} className="param-diff-item">
                {diff.status === 'same' && (
                  <div className="flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded">
                    <CheckCircleOutlined className="text-green-600 mt-1" />
                    <div className="flex-1 min-w-0">
                      <Text strong className="text-xs">
                        {diff.key}
                      </Text>
                      <Text className="text-xs ml-2">= {diff.webvpnValue}</Text>
                    </div>
                  </div>
                )}

                {diff.status === 'different' && (
                  <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
                    <WarningOutlined className="text-red-600 mt-1" />
                    <div className="flex-1 min-w-0">
                      <Text strong className="text-xs">
                        {diff.key}
                      </Text>
                      <div className="mt-1 space-y-1">
                        <div>
                          <Tag color="blue" className="text-xs">
                            WebVPN
                          </Tag>
                          <Text code className="text-xs break-all">
                            {diff.webvpnValue}
                          </Text>
                        </div>
                        <div>
                          <Tag color="orange" className="text-xs">
                            源站
                          </Tag>
                          <Text code className="text-xs break-all">
                            {diff.sourceValue}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {diff.status === 'webvpn_only' && (
                  <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
                    <InfoCircleOutlined className="text-blue-600 mt-1" />
                    <div className="flex-1 min-w-0">
                      <Tag color="blue" className="text-xs mr-2">
                        仅WebVPN
                      </Tag>
                      <Text strong className="text-xs">
                        {diff.key}
                      </Text>
                      <Text className="text-xs ml-2">= {diff.webvpnValue}</Text>
                    </div>
                  </div>
                )}

                {diff.status === 'source_only' && (
                  <div className="flex items-start gap-2 p-2 bg-orange-50 border border-orange-200 rounded">
                    <InfoCircleOutlined className="text-orange-600 mt-1" />
                    <div className="flex-1 min-w-0">
                      <Tag color="orange" className="text-xs mr-2">
                        仅源站
                      </Tag>
                      <Text strong className="text-xs">
                        {diff.key}
                      </Text>
                      <Text className="text-xs ml-2">= {diff.sourceValue}</Text>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </Space>
        </div>
      ) : (
        <div className="mt-2">
          <Text type="secondary" className="text-xs">
            无查询参数
          </Text>
        </div>
      )}

      {/* Hash */}
      {(webvpnParsed.hash || sourceParsed.hash) && (
        <div className="mt-3">
          <Text type="secondary" className="text-xs">
            Hash:
          </Text>
          <div className="mt-1">
            {webvpnParsed.hash === sourceParsed.hash ? (
              <Text code className="text-xs">
                {webvpnParsed.hash || '(无)'}
              </Text>
            ) : (
              <Space direction="vertical" size="small">
                <div>
                  <Tag color="blue" className="text-xs">
                    WebVPN
                  </Tag>
                  <Text code className="text-xs">
                    {webvpnParsed.hash || '(无)'}
                  </Text>
                </div>
                <div>
                  <Tag color="orange" className="text-xs">
                    源站
                  </Tag>
                  <Text code className="text-xs">
                    {sourceParsed.hash || '(无)'}
                  </Text>
                </div>
              </Space>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
