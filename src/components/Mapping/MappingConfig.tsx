import React from 'react';
import { Card, Input, Button, Space, Typography, Tooltip, Collapse } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SwapRightOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import type { MappingConfig as MappingConfigType } from '../../types';

const { Text } = Typography;

interface MappingConfigProps {
  config: MappingConfigType;
  onChange: (config: MappingConfigType) => void;
}

export const MappingConfig: React.FC<MappingConfigProps> = ({ config, onChange }) => {
  // Hostname 映射操作
  const addHostnameMapping = () => {
    onChange({
      ...config,
      hostnameMappings: [...config.hostnameMappings, ['', '']],
    });
  };

  const updateHostnameMapping = (index: number, field: 0 | 1, value: string) => {
    const newMappings = [...config.hostnameMappings];
    newMappings[index] = [...newMappings[index]] as [string, string];
    newMappings[index][field] = value;
    onChange({ ...config, hostnameMappings: newMappings });
  };

  const removeHostnameMapping = (index: number) => {
    const newMappings = config.hostnameMappings.filter((_, i) => i !== index);
    onChange({ ...config, hostnameMappings: newMappings });
  };

  // URL 映射操作
  const addUrlMapping = () => {
    onChange({
      ...config,
      urlMappings: [...config.urlMappings, ['', '']],
    });
  };

  const updateUrlMapping = (index: number, field: 0 | 1, value: string) => {
    const newMappings = [...config.urlMappings];
    newMappings[index] = [...newMappings[index]] as [string, string];
    newMappings[index][field] = value;
    onChange({ ...config, urlMappings: newMappings });
  };

  const removeUrlMapping = (index: number) => {
    const newMappings = config.urlMappings.filter((_, i) => i !== index);
    onChange({ ...config, urlMappings: newMappings });
  };

  const items = [
    {
      key: 'hostname',
      label: (
        <Space>
          <Text strong>Hostname 映射</Text>
          <Text type="secondary">({config.hostnameMappings.length})</Text>
          <Tooltip title="将 WebVPN 的 hostname 映射到源站 hostname。例如: www--cnki--net.lo.elib.pro → www.cnki.net">
            <QuestionCircleOutlined />
          </Tooltip>
        </Space>
      ),
      children: (
        <div className="space-y-2">
          {config.hostnameMappings.map((mapping, index) => (
            <Space key={index} className="w-full" align="center">
              <Input
                placeholder="WebVPN hostname"
                value={mapping[0]}
                onChange={(e) => updateHostnameMapping(index, 0, e.target.value)}
                style={{ width: 280 }}
              />
              <SwapRightOutlined className="text-gray-400" />
              <Input
                placeholder="源站 hostname"
                value={mapping[1]}
                onChange={(e) => updateHostnameMapping(index, 1, e.target.value)}
                style={{ width: 200 }}
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeHostnameMapping(index)}
              />
            </Space>
          ))}
          <Button type="dashed" icon={<PlusOutlined />} onClick={addHostnameMapping} block>
            添加 Hostname 映射
          </Button>
        </div>
      ),
    },
    {
      key: 'url',
      label: (
        <Space>
          <Text strong>URL 路径映射</Text>
          <Text type="secondary">({config.urlMappings.length})</Text>
          <Tooltip title="将 WebVPN 的完整 URL 路径映射到源站 URL。用于处理路径发生变化的情况。优先级高于 Hostname 映射。">
            <QuestionCircleOutlined />
          </Tooltip>
        </Space>
      ),
      children: (
        <div className="space-y-2">
          {config.urlMappings.map((mapping, index) => (
            <Space key={index} className="w-full" align="center">
              <Input
                placeholder="WebVPN URL"
                value={mapping[0]}
                onChange={(e) => updateUrlMapping(index, 0, e.target.value)}
                style={{ width: 320 }}
              />
              <SwapRightOutlined className="text-gray-400" />
              <Input
                placeholder="源站 URL"
                value={mapping[1]}
                onChange={(e) => updateUrlMapping(index, 1, e.target.value)}
                style={{ width: 280 }}
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeUrlMapping(index)}
              />
            </Space>
          ))}
          <Button type="dashed" icon={<PlusOutlined />} onClick={addUrlMapping} block>
            添加 URL 映射
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card size="small" className="mb-4">
      <Collapse
        items={items}
        defaultActiveKey={['hostname']}
        ghost
        size="small"
      />
    </Card>
  );
};
