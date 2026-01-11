/**
 * HAR Entry 匹配器
 * 将 WebVPN HAR 和源站 HAR 中的请求条目进行匹配
 */

import type { HarEntry } from '../types';
import { Normalizer } from './Normalizer';

export interface MatchResult {
  matched: Array<{
    webvpnEntry: HarEntry;
    sourceEntry: HarEntry;
    normalizedUrl: string;
  }>;
  unmatchedWebvpn: HarEntry[];
  unmatchedSource: HarEntry[];
}

export class EntryMatcher {
  constructor(private normalizer: Normalizer) {}

  /**
   * 匹配两个 HAR 文件中的请求条目
   * 匹配策略：Method + 规范化后的 URL
   */
  match(webvpnEntries: HarEntry[], sourceEntries: HarEntry[]): MatchResult {
    const matched: MatchResult['matched'] = [];
    const unmatchedWebvpn: HarEntry[] = [];
    const usedSourceIndices = new Set<number>();

    // 为源站 entries 建立索引 (method + path -> entries)
    const sourceIndex = this.buildIndex(sourceEntries);

    // 遍历 WebVPN entries，尝试匹配
    for (const webvpnEntry of webvpnEntries) {
      const normalizedUrl = this.normalizer.normalizeUrl(webvpnEntry.request.url);
      const method = webvpnEntry.request.method.toUpperCase();
      const key = this.getMatchKey(method, normalizedUrl);

      const candidates = sourceIndex.get(key) || [];
      let matchedSourceIndex = -1;

      // 找到第一个未使用的匹配
      for (const candidate of candidates) {
        if (!usedSourceIndices.has(candidate.index)) {
          matchedSourceIndex = candidate.index;
          break;
        }
      }

      if (matchedSourceIndex !== -1) {
        matched.push({
          webvpnEntry,
          sourceEntry: sourceEntries[matchedSourceIndex],
          normalizedUrl,
        });
        usedSourceIndices.add(matchedSourceIndex);
      } else {
        unmatchedWebvpn.push(webvpnEntry);
      }
    }

    // 收集未匹配的源站 entries
    const unmatchedSource = sourceEntries.filter(
      (_, index) => !usedSourceIndices.has(index)
    );

    return { matched, unmatchedWebvpn, unmatchedSource };
  }

  /**
   * 构建源站 entries 的索引
   */
  private buildIndex(entries: HarEntry[]): Map<string, Array<{ entry: HarEntry; index: number }>> {
    const index = new Map<string, Array<{ entry: HarEntry; index: number }>>();

    entries.forEach((entry, i) => {
      const method = entry.request.method.toUpperCase();
      const url = entry.request.url;
      const key = this.getMatchKey(method, url);

      if (!index.has(key)) {
        index.set(key, []);
      }
      index.get(key)!.push({ entry, index: i });
    });

    return index;
  }

  /**
   * 生成匹配键：method + url_path
   * 忽略 query 参数的顺序
   */
  private getMatchKey(method: string, url: string): string {
    try {
      const parsed = new URL(url);
      // 对 query 参数排序以忽略顺序差异
      const params = new URLSearchParams(parsed.search);
      const sortedParams = new URLSearchParams([...params.entries()].sort());
      return `${method}|${parsed.hostname}${parsed.pathname}?${sortedParams.toString()}`;
    } catch {
      // 如果 URL 解析失败，直接使用原始值
      return `${method}|${url}`;
    }
  }
}
