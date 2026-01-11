import React, { useCallback } from 'react';
import { Upload, message, Typography, Space } from 'antd';
import { InboxOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { HarFile } from '../../types';

const { Dragger } = Upload;
const { Text, Title } = Typography;

interface HarUploaderProps {
  title: string;
  description?: string;
  onUpload: (har: HarFile, filename: string) => void;
  harFile: HarFile | null;
  filename: string | null;
}

export const HarUploader: React.FC<HarUploaderProps> = ({
  title,
  description,
  onUpload,
  harFile,
  filename,
}) => {
  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const har = JSON.parse(content) as HarFile;

          // 验证 HAR 格式
          if (!har.log || !Array.isArray(har.log.entries)) {
            message.error('无效的 HAR 文件格式');
            return;
          }

          onUpload(har, file.name);
          message.success(`成功加载 ${file.name}`);
        } catch (err) {
          message.error('解析 HAR 文件失败，请确保文件格式正确');
          console.error('HAR parse error:', err);
        }
      };
      reader.readAsText(file);
      return false; // 阻止默认上传行为
    },
    [onUpload]
  );

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.har',
    showUploadList: false,
    beforeUpload: handleFile,
  };

  return (
    <div className="flex-1 p-4">
      <Title level={5} className="mb-3 text-center">
        {title}
      </Title>
      {description && (
        <Text type="secondary" className="block text-center mb-3">
          {description}
        </Text>
      )}

      {harFile ? (
        <div className="border-2 border-solid border-green-400 rounded-lg p-6 bg-green-50 text-center">
          <Space direction="vertical" size="small">
            <CheckCircleOutlined className="text-4xl text-green-500" />
            <Text strong>{filename}</Text>
            <Text type="secondary">{harFile.log.entries.length} 个请求</Text>
            <Dragger {...uploadProps} className="mt-2 bg-white">
              <Text type="secondary" className="text-sm">
                点击或拖拽替换文件
              </Text>
            </Dragger>
          </Space>
        </div>
      ) : (
        <Dragger
          {...uploadProps}
          className="upload-dragger"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined className="text-5xl text-blue-400" />
          </p>
          <p className="ant-upload-text">点击或拖拽 HAR 文件到此区域</p>
          <p className="ant-upload-hint">
            <FileTextOutlined /> 支持 .har 格式文件
          </p>
        </Dragger>
      )}
    </div>
  );
};
