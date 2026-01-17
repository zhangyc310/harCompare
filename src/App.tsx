import React, { useState, useCallback, useEffect } from 'react';
import { Layout, Button, Typography, Divider, message, Drawer, FloatButton } from 'antd';
import { SwapOutlined, GithubOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { HarFile, MappingConfig, CompareResult, EntryCompareResult } from './types';
import { DEFAULT_MAPPING_CONFIG } from './types';
import { Comparator } from './core';
import { HarUploader } from './components/Upload';
import { MappingConfig as MappingConfigPanel } from './components/Mapping';
import { Summary, EntryList } from './components/Result';
import { CompareView } from './components/Result/CompareView';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// localStorage key
const STORAGE_KEY_MAPPING = 'har-compare-mapping-config';

const App: React.FC = () => {
  // 上传的 HAR 文件
  const [webvpnHar, setWebvpnHar] = useState<HarFile | null>(null);
  const [webvpnFilename, setWebvpnFilename] = useState<string | null>(null);
  const [sourceHar, setSourceHar] = useState<HarFile | null>(null);
  const [sourceFilename, setSourceFilename] = useState<string | null>(null);

  // 映射配置 - 从 localStorage 加载
  const [mappingConfig, setMappingConfig] = useState<MappingConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MAPPING);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Failed to load mapping config from localStorage:', err);
    }
    return DEFAULT_MAPPING_CONFIG;
  });

  // 对比结果
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<EntryCompareResult | null>(null);

  // 是否正在对比
  const [isComparing, setIsComparing] = useState(false);

  // 抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);

  // 保存配置到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MAPPING, JSON.stringify(mappingConfig));
    } catch (err) {
      console.error('Failed to save mapping config to localStorage:', err);
    }
  }, [mappingConfig]);

  // 处理 WebVPN HAR 上传
  const handleWebvpnUpload = useCallback((har: HarFile, filename: string) => {
    setWebvpnHar(har);
    setWebvpnFilename(filename);
    setCompareResult(null);
    setSelectedEntry(null);
  }, []);

  // 处理源站 HAR 上传
  const handleSourceUpload = useCallback((har: HarFile, filename: string) => {
    setSourceHar(har);
    setSourceFilename(filename);
    setCompareResult(null);
    setSelectedEntry(null);
  }, []);

  // 执行对比
  const handleCompare = useCallback(() => {
    if (!webvpnHar || !sourceHar) {
      message.warning('请先上传两个 HAR 文件');
      return;
    }

    // 验证映射配置
    const validHostnameMappings = mappingConfig.hostnameMappings.filter(
      ([webvpn, source]) => webvpn.trim() && source.trim()
    );
    const validUrlMappings = mappingConfig.urlMappings.filter(
      ([webvpn, source]) => webvpn.trim() && source.trim()
    );

    if (validHostnameMappings.length === 0 && validUrlMappings.length === 0) {
      message.warning('请至少配置一个映射规则');
      return;
    }

    setIsComparing(true);

    try {
      const comparator = new Comparator({
        hostnameMappings: validHostnameMappings,
        urlMappings: validUrlMappings,
      });

      const result = comparator.compare(webvpnHar, sourceHar);
      setCompareResult(result);
      setSelectedEntry(null);
      message.success('对比完成');
    } catch (err) {
      console.error('Compare error:', err);
      message.error('对比过程中发生错误');
    } finally {
      setIsComparing(false);
    }
  }, [webvpnHar, sourceHar, mappingConfig]);

  // 选择 entry
  const handleSelectEntry = useCallback((entry: EntryCompareResult) => {
    setSelectedEntry(entry);
    setDrawerVisible(false); // 选择后关闭抽屉
  }, []);

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white shadow-sm flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <SwapOutlined className="text-2xl text-blue-500" />
          <Title level={4} className="mb-0">
            HAR Compare
          </Title>
          <Text type="secondary">WebVPN 分析工具</Text>
        </div>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-700"
        >
          <GithubOutlined className="text-xl" />
        </a>
      </Header>

      <Content className="p-6">
        {/* 映射配置 */}
        <MappingConfigPanel config={mappingConfig} onChange={setMappingConfig} />

        {/* 上传区域 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex">
            <HarUploader
              title="WebVPN HAR"
              description="上传通过 WebVPN 访问时录制的 HAR 文件"
              onUpload={handleWebvpnUpload}
              harFile={webvpnHar}
              filename={webvpnFilename}
            />
            <Divider type="vertical" className="h-auto mx-4" />
            <HarUploader
              title="源站 HAR"
              description="上传直接访问源站时录制的 HAR 文件"
              onUpload={handleSourceUpload}
              harFile={sourceHar}
              filename={sourceFilename}
            />
          </div>

          {/* 对比按钮 */}
          <div className="text-center mt-4">
            <Button
              type="primary"
              size="large"
              icon={<SwapOutlined />}
              onClick={handleCompare}
              loading={isComparing}
              disabled={!webvpnHar || !sourceHar}
            >
              开始对比
            </Button>
          </div>
        </div>

        {/* 对比结果 */}
        {compareResult && (
          <>
            <Summary summary={compareResult.summary} />

            {/* 对比视图 - 所有请求折叠列表 */}
            <CompareView entries={compareResult.entries} />
          </>
        )}

        {/* 浮动按钮 - 打开请求列表 */}
        {compareResult && (
          <FloatButton
            icon={<UnorderedListOutlined />}
            type="primary"
            tooltip="请求列表"
            onClick={() => setDrawerVisible(true)}
          />
        )}

        {/* 请求列表抽屉 */}
        <Drawer
          title="请求列表"
          placement="left"
          width={400}
          open={drawerVisible}
          onClose={() => setDrawerVisible(false)}
        >
          {compareResult && (
            <EntryList
              entries={compareResult.entries}
              selectedId={selectedEntry?.id || null}
              onSelect={handleSelectEntry}
            />
          )}
        </Drawer>
      </Content>
    </Layout>
  );
};

export default App;
