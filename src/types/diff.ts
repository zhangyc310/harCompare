/**
 * 差异对比结果类型定义
 */

import type { HarEntry, HarHeader, HarCookie } from './har';

// 差异状态
export type DiffStatus = 'identical' | 'different' | 'webvpn_only' | 'source_only';

// 解析后的 Cookie 项（用于 cookie/set-cookie header 解析）
export interface ParsedCookieItem {
  name: string;
  value: string;
  normalizedName: string;  // 规范化后的名称
}

// Cookie Header 的对比结果
export interface CookieHeaderDiff {
  matched: Array<{
    normalizedName: string;
    webvpnName: string;
    sourceName: string;
    webvpnValue: string;
    sourceValue: string;
  }>;
  missing: ParsedCookieItem[];    // WebVPN 缺失的
  extra: ParsedCookieItem[];      // WebVPN 多出的
  different: Array<{
    normalizedName: string;
    webvpnName: string;
    sourceName: string;
    webvpnValue: string;
    sourceValue: string;
  }>;
}

// Header 差异
export interface HeaderDiff {
  matched: HarHeader[];           // 完全一致的 header
  missing: HarHeader[];           // WebVPN 缺失的 (源站有)
  extra: HarHeader[];             // WebVPN 多出的 (源站没有)
  different: HeaderDiffItem[];    // 值不同的 header
  // Cookie 相关 header 的解析对比结果
  cookieHeaderDiff?: CookieHeaderDiff;     // Cookie header 的对比结果
  setCookieHeaderDiff?: CookieHeaderDiff;  // Set-Cookie header 的对比结果
}

export interface HeaderDiffItem {
  name: string;
  webvpnValue: string;
  sourceValue: string;
  normalizedWebvpnValue: string;  // 规范化后的 WebVPN 值
  isIdenticalAfterNormalization: boolean;
}

// Cookie 差异
export interface CookieDiff {
  matched: CookieMatchItem[];     // 匹配的 cookie
  missing: HarCookie[];           // WebVPN 缺失的
  extra: HarCookie[];             // WebVPN 多出的
  different: CookieDiffItem[];    // 值不同的
}

export interface CookieMatchItem {
  normalizedName: string;
  webvpnCookie: HarCookie;
  sourceCookie: HarCookie;
}

export interface CookieDiffItem {
  normalizedName: string;
  webvpnName: string;
  sourceName: string;
  webvpnValue: string;
  sourceValue: string;
}

// Body 差异
export interface BodyDiff {
  status: 'identical' | 'different' | 'both_empty' | 'webvpn_only' | 'source_only';
  mimeType?: string;
  webvpnSize: number;
  sourceSize: number;
  // 文本差异详情
  isIdenticalAfterNormalization?: boolean;
  webvpnText?: string;
  sourceText?: string;
  normalizedWebvpnText?: string;
}

// 单个请求条目的对比结果
export interface EntryCompareResult {
  id: string;                     // 唯一标识
  method: string;
  url: string;                    // 规范化后的 URL
  originalWebvpnUrl?: string;     // 原始 WebVPN URL
  originalSourceUrl?: string;     // 原始源站 URL
  status: DiffStatus;

  webvpnEntry?: HarEntry;
  sourceEntry?: HarEntry;

  request: {
    headerDiff: HeaderDiff;
    cookieDiff: CookieDiff;
    bodyDiff: BodyDiff;
  };

  response: {
    statusCode: {
      webvpn?: number;
      source?: number;
      isIdentical: boolean;
    };
    headerDiff: HeaderDiff;
    cookieDiff: CookieDiff;
    bodyDiff: BodyDiff;
  };
}

// 完整对比报告
export interface CompareResult {
  summary: CompareSummary;
  entries: EntryCompareResult[];
  unmatchedWebvpn: HarEntry[];
  unmatchedSource: HarEntry[];
}

export interface CompareSummary {
  total: {
    webvpn: number;
    source: number;
  };
  matched: number;
  webvpnOnly: number;
  sourceOnly: number;
  identical: number;
  withDifferences: number;
}
