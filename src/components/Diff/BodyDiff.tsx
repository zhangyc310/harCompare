import React, { useMemo } from 'react';
import { Typography, Tag, Empty, Alert, Tabs, Segmented } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import type { BodyDiff } from '../../types';

const { Text } = Typography;

interface BodyDiffViewProps {
  diff: BodyDiff;
}

// 格式化 JSON
const formatJson = (text: string): string => {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
};

// 判断是否为 JSON
const isJson = (mimeType?: string): boolean => {
  return mimeType?.includes('json') || false;
};

export const BodyDiffView: React.FC<BodyDiffViewProps> = ({ diff }) => {
  const [viewMode, setViewMode] = React.useState<'split' | 'unified'>('split');

  // 处理文本内容
  const { webvpnText, sourceText, normalizedText } = useMemo(() => {
    const isJsonType = isJson(diff.mimeType);
    return {
      webvpnText: isJsonType && diff.webvpnText ? formatJson(diff.webvpnText) : diff.webvpnText || '',
      sourceText: isJsonType && diff.sourceText ? formatJson(diff.sourceText) : diff.sourceText || '',
      normalizedText: isJsonType && diff.normalizedWebvpnText
        ? formatJson(diff.normalizedWebvpnText)
        : diff.normalizedWebvpnText || '',
    };
  }, [diff]);

  // 状态展示
  if (diff.status === 'both_empty') {
    return <Empty description="无 Body 内容" />;
  }

  if (diff.status === 'identical') {
    return (
      <Alert
        type="success"
        icon={<CheckCircleOutlined />}
        message="Body 内容完全一致"
        description={
          <Text type="secondary">
            大小: {diff.webvpnSize} bytes
            {diff.mimeType && <span> | 类型: {diff.mimeType}</span>}
          </Text>
        }
      />
    );
  }

  if (diff.status === 'webvpn_only') {
    return (
      <div>
        <Alert
          type="warning"
          message="仅 WebVPN 有 Body 内容"
          description={`大小: ${diff.webvpnSize} bytes`}
          className="mb-3"
        />
        {diff.webvpnText && (
          <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-96">
            {webvpnText}
          </pre>
        )}
      </div>
    );
  }

  if (diff.status === 'source_only') {
    return (
      <div>
        <Alert
          type="warning"
          message="仅源站有 Body 内容"
          description={`大小: ${diff.sourceSize} bytes`}
          className="mb-3"
        />
        {diff.sourceText && (
          <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-96">
            {sourceText}
          </pre>
        )}
      </div>
    );
  }

  // 有差异的情况
  return (
    <div>
      {/* 状态提示 */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          {diff.isIdenticalAfterNormalization ? (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              规范化后一致
            </Tag>
          ) : (
            <Tag color="warning" icon={<WarningOutlined />}>
              规范化后仍有差异
            </Tag>
          )}
          <Text type="secondary" className="ml-2">
            <FileTextOutlined className="mr-1" />
            WebVPN: {diff.webvpnSize} bytes | 源站: {diff.sourceSize} bytes
            {diff.mimeType && <span> | {diff.mimeType}</span>}
          </Text>
        </div>
        <Segmented
          size="small"
          options={[
            { label: '分栏', value: 'split' },
            { label: '统一', value: 'unified' },
          ]}
          value={viewMode}
          onChange={(v) => setViewMode(v as 'split' | 'unified')}
        />
      </div>

      {/* Diff 展示 */}
      {webvpnText && sourceText ? (
        <Tabs
          size="small"
          items={[
            {
              key: 'original',
              label: 'WebVPN vs 源站',
              children: (
                <div className="border rounded overflow-auto" style={{ maxHeight: 500 }}>
                  <ReactDiffViewer
                    oldValue={sourceText}
                    newValue={webvpnText}
                    splitView={viewMode === 'split'}
                    leftTitle="源站"
                    rightTitle="WebVPN"
                    compareMethod={DiffMethod.WORDS}
                    styles={{
                      variables: {
                        light: {
                          diffViewerBackground: '#fff',
                          addedBackground: '#e6ffed',
                          removedBackground: '#ffeef0',
                          wordAddedBackground: '#acf2bd',
                          wordRemovedBackground: '#fdb8c0',
                        },
                      },
                      contentText: {
                        fontSize: '12px',
                        lineHeight: '1.4',
                      },
                    }}
                  />
                </div>
              ),
            },
            {
              key: 'normalized',
              label: '规范化 WebVPN vs 源站',
              children: (
                <div className="border rounded overflow-auto" style={{ maxHeight: 500 }}>
                  <ReactDiffViewer
                    oldValue={sourceText}
                    newValue={normalizedText}
                    splitView={viewMode === 'split'}
                    leftTitle="源站"
                    rightTitle="WebVPN (规范化后)"
                    compareMethod={DiffMethod.WORDS}
                    styles={{
                      variables: {
                        light: {
                          diffViewerBackground: '#fff',
                          addedBackground: '#e6ffed',
                          removedBackground: '#ffeef0',
                          wordAddedBackground: '#acf2bd',
                          wordRemovedBackground: '#fdb8c0',
                        },
                      },
                      contentText: {
                        fontSize: '12px',
                        lineHeight: '1.4',
                      },
                    }}
                  />
                </div>
              ),
            },
          ]}
        />
      ) : (
        <Alert type="info" message="Body 内容过大或无法显示" />
      )}
    </div>
  );
};
