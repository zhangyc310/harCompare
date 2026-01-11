import React from 'react';
import { Card, Statistic, Row, Col, Progress, Typography } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import type { CompareSummary } from '../../types';

const { Text } = Typography;

interface SummaryProps {
  summary: CompareSummary;
}

export const Summary: React.FC<SummaryProps> = ({ summary }) => {
  const totalMatched = summary.matched;
  const matchRate = summary.total.source > 0
    ? Math.round((totalMatched / summary.total.source) * 100)
    : 0;

  const identicalRate = totalMatched > 0
    ? Math.round((summary.identical / totalMatched) * 100)
    : 0;

  return (
    <Card className="mb-4">
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card size="small" className="text-center bg-blue-50">
            <Statistic
              title="WebVPN 请求"
              value={summary.total.webvpn}
              prefix={<SwapOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" className="text-center bg-blue-50">
            <Statistic
              title="源站请求"
              value={summary.total.source}
              prefix={<SwapOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" className="text-center">
            <Statistic
              title="匹配率"
              value={matchRate}
              suffix="%"
              valueStyle={{ color: matchRate >= 80 ? '#3f8600' : '#cf1322' }}
            />
            <Progress
              percent={matchRate}
              showInfo={false}
              size="small"
              status={matchRate >= 80 ? 'success' : 'exception'}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" className="text-center">
            <Statistic
              title="一致率"
              value={identicalRate}
              suffix="%"
              valueStyle={{ color: identicalRate >= 80 ? '#3f8600' : '#faad14' }}
            />
            <Progress
              percent={identicalRate}
              showInfo={false}
              size="small"
              status={identicalRate >= 80 ? 'success' : 'normal'}
              strokeColor={identicalRate >= 80 ? undefined : '#faad14'}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-4">
        <Col span={6}>
          <div className="flex items-center gap-2">
            <CheckCircleOutlined className="text-green-500 text-lg" />
            <div>
              <Text type="secondary">完全一致</Text>
              <div className="text-lg font-semibold text-green-600">{summary.identical}</div>
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="flex items-center gap-2">
            <WarningOutlined className="text-orange-500 text-lg" />
            <div>
              <Text type="secondary">有差异</Text>
              <div className="text-lg font-semibold text-orange-500">{summary.withDifferences}</div>
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="flex items-center gap-2">
            <CloseCircleOutlined className="text-blue-500 text-lg" />
            <div>
              <Text type="secondary">仅 WebVPN</Text>
              <div className="text-lg font-semibold text-blue-500">{summary.webvpnOnly}</div>
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="flex items-center gap-2">
            <CloseCircleOutlined className="text-red-500 text-lg" />
            <div>
              <Text type="secondary">仅源站</Text>
              <div className="text-lg font-semibold text-red-500">{summary.sourceOnly}</div>
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  );
};
