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
   * 匹配策略：Method + Host + Path 相同，选择查询参数最相似的
   */
  match(webvpnEntries: HarEntry[], sourceEntries: HarEntry[]): MatchResult {
    const matched: MatchResult['matched'] = [];
    const unmatchedWebvpn: HarEntry[] = [];
    const usedSourceIndices = new Set<number>();

    // 为源站 entries 建立索引 (method + host + path -> entries)
    const sourceIndex = this.buildIndex(sourceEntries);

    // 遍历 WebVPN entries，尝试匹配
    for (const webvpnEntry of webvpnEntries) {
      const normalizedUrl = this.normalizer.normalizeUrl(webvpnEntry.request.url);
      const method = webvpnEntry.request.method.toUpperCase();
      const key = this.getMatchKey(method, normalizedUrl);

      const candidates = sourceIndex.get(key) || [];
      let bestMatch: { index: number; similarity: number } | null = null;

      // 在候选项中找到参数最相似且未使用的匹配
      for (const candidate of candidates) {
        if (!usedSourceIndices.has(candidate.index)) {
          const similarity = this.calculateUrlSimilarity(
            normalizedUrl,
            candidate.entry.request.url
          );

          if (bestMatch === null || similarity > bestMatch.similarity) {
            bestMatch = { index: candidate.index, similarity };
          }
        }
      }

      if (bestMatch !== null) {
        matched.push({
          webvpnEntry,
          sourceEntry: sourceEntries[bestMatch.index],
          normalizedUrl,
        });
        usedSourceIndices.add(bestMatch.index);
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
   * 生成匹配键：method + hostname + pathname
   * 不包括查询参数，只匹配基础路径
   */
  private getMatchKey(method: string, url: string): string {
    try {
      const parsed = new URL(url);
      // 只使用 method + hostname + pathname，不包含查询参数
      return `${method}|${parsed.hostname}${parsed.pathname}`;
    } catch {
      // 如果 URL 解析失败，直接使用原始值
      return `${method}|${url}`;
    }
  }

  /**
   * 计算两个 URL 的查询参数相似度
   * 返回 0-1 之间的相似度分数，1 表示完全相同
   */
  private calculateUrlSimilarity(url1: string, url2: string): number {
    try {
      const parsed1 = new URL(url1);
      const parsed2 = new URL(url2);

      // 获取查询参数
      const params1 = new URLSearchParams(parsed1.search);
      const params2 = new URLSearchParams(parsed2.search);

      // 如果两个 URL 都没有参数，视为完全匹配
      if (params1.size === 0 && params2.size === 0) {
        return 1.0;
      }

      // 如果只有一个有参数，相似度较低
      if (params1.size === 0 || params2.size === 0) {
        return 0.1;
      }

      // 计算共同参数数量（key 和 value 都相同）
      let commonParams = 0;
      for (const [key, value] of params1.entries()) {
        if (params2.get(key) === value) {
          commonParams++;
        }
      }

      // 相似度 = 共同参数数 / 参数总数的平均值
      const totalParams = (params1.size + params2.size) / 2;
      return commonParams / totalParams;
    } catch {
      // URL 解析失败，使用简单的字符串比较
      return url1 === url2 ? 1.0 : 0.0;
    }
  }
}
