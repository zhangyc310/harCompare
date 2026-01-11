/**
 * URL/Cookie 规范化处理器
 * 将 WebVPN 格式转换为源站格式
 */

import type { MappingConfig } from '../types';

export class Normalizer {
  private hostnameMappings: Map<string, string>;
  private urlMappings: Array<[string, string]>;

  constructor(config: MappingConfig) {
    // 构建 hostname 映射表
    this.hostnameMappings = new Map(
      config.hostnameMappings.map(([webvpn, source]) => [webvpn.toLowerCase(), source.toLowerCase()])
    );
    // URL 映射按长度降序排列，确保更长的路径优先匹配
    this.urlMappings = [...config.urlMappings].sort((a, b) => b[0].length - a[0].length);
  }

  /**
   * 规范化 URL
   * 1. 先检查完整 URL 映射（前缀匹配）
   * 2. 再检查 hostname 映射
   */
  normalizeUrl(url: string): string {
    if (!url) return url;

    // 1. URL 映射检查 (前缀匹配)
    for (const [webvpnUrl, sourceUrl] of this.urlMappings) {
      if (url.startsWith(webvpnUrl)) {
        return url.replace(webvpnUrl, sourceUrl);
      }
      // 也检查不带协议的情况
      const webvpnWithoutProtocol = webvpnUrl.replace(/^https?:\/\//, '');
      const urlWithoutProtocol = url.replace(/^https?:\/\//, '');
      if (urlWithoutProtocol.startsWith(webvpnWithoutProtocol)) {
        const sourceWithoutProtocol = sourceUrl.replace(/^https?:\/\//, '');
        return url.replace(webvpnWithoutProtocol, sourceWithoutProtocol);
      }
    }

    // 2. Hostname 映射检查
    try {
      const parsed = new URL(url);
      const lowercaseHost = parsed.hostname.toLowerCase();
      if (this.hostnameMappings.has(lowercaseHost)) {
        parsed.hostname = this.hostnameMappings.get(lowercaseHost)!;
        return parsed.toString();
      }
    } catch {
      // 如果不是有效 URL，尝试作为相对路径或 hostname 处理
      const lowercaseUrl = url.toLowerCase();
      for (const [webvpnHost, sourceHost] of this.hostnameMappings) {
        if (lowercaseUrl.includes(webvpnHost)) {
          return url.replace(new RegExp(webvpnHost, 'gi'), sourceHost);
        }
      }
    }

    return url;
  }

  /**
   * 规范化 hostname
   */
  normalizeHostname(hostname: string): string {
    if (!hostname) return hostname;
    const lowercaseHost = hostname.toLowerCase();
    return this.hostnameMappings.get(lowercaseHost) || hostname;
  }

  /**
   * 规范化文本内容中的所有 URL
   * 用于 body 内容处理
   */
  normalizeText(text: string): string {
    if (!text) return text;

    let result = text;

    // 1. 先处理 URL 映射
    for (const [webvpnUrl, sourceUrl] of this.urlMappings) {
      result = result.split(webvpnUrl).join(sourceUrl);
      // 处理可能的 URL 编码情况
      const encodedWebvpn = encodeURIComponent(webvpnUrl);
      const encodedSource = encodeURIComponent(sourceUrl);
      result = result.split(encodedWebvpn).join(encodedSource);
    }

    // 2. 处理 hostname 映射
    for (const [webvpnHost, sourceHost] of this.hostnameMappings) {
      // 替换所有出现的 hostname
      result = result.split(webvpnHost).join(sourceHost);
      // 处理可能的 URL 编码情况
      const encodedWebvpn = encodeURIComponent(webvpnHost);
      const encodedSource = encodeURIComponent(sourceHost);
      result = result.split(encodedWebvpn).join(encodedSource);
    }

    return result;
  }

  /**
   * 规范化 Cookie 名称
   * abc_-_cnki.net → abc
   */
  normalizeCookieName(name: string): string {
    if (!name) return name;
    const separatorIndex = name.indexOf('_-_');
    if (separatorIndex !== -1) {
      return name.substring(0, separatorIndex);
    }
    return name;
  }

  /**
   * 判断两个 URL 是否等价（规范化后相同）
   */
  isEquivalentUrl(url1: string, url2: string): boolean {
    const normalized1 = this.normalizeUrl(url1);
    const normalized2 = this.normalizeUrl(url2);
    return normalized1 === normalized2;
  }

  /**
   * 获取 URL 的路径部分（不含 hostname）
   */
  getUrlPath(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.pathname + parsed.search;
    } catch {
      return url;
    }
  }
}
