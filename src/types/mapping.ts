/**
 * 映射配置类型定义
 */

export interface MappingConfig {
  // Hostname 级别映射: [webvpn_hostname, source_hostname]
  // 例如: ["www--cnki--net.lo.elib.pro", "www.cnki.net"]
  hostnameMappings: Array<[string, string]>;

  // 完整 URL 路径映射: [webvpn_url, source_url]
  // 例如: ["https://www--cnki--net.lo.elib.pro/path1", "https://www.cnki.net/path2"]
  urlMappings: Array<[string, string]>;
}

export interface MappingEntry {
  webvpn: string;
  source: string;
}

export const DEFAULT_MAPPING_CONFIG: MappingConfig = {
  hostnameMappings: [],
  urlMappings: [],
};
