/**
 * HAR 对比器
 * 比较 WebVPN 和源站的 HAR 文件
 */

import type {
  HarFile,
  HarEntry,
  HarHeader,
  HarCookie,
  MappingConfig,
  CompareResult,
  CompareSummary,
  EntryCompareResult,
  HeaderDiff,
  CookieDiff,
  BodyDiff,
} from '../types';
import { Normalizer } from './Normalizer';
import { EntryMatcher } from './EntryMatcher';

export class Comparator {
  private normalizer: Normalizer;
  private matcher: EntryMatcher;

  // URL 相关的 header，需要规范化后再比较
  private readonly urlHeaders = new Set([
    'referer',
    'origin',
    'location',
    'content-location',
    'x-forwarded-host',
    'x-original-url',
  ]);

  constructor(mappingConfig: MappingConfig) {
    this.normalizer = new Normalizer(mappingConfig);
    this.matcher = new EntryMatcher(this.normalizer);
  }

  /**
   * 执行完整对比
   */
  compare(webvpnHar: HarFile, sourceHar: HarFile): CompareResult {
    const webvpnEntries = webvpnHar.log.entries;
    const sourceEntries = sourceHar.log.entries;

    // 1. 匹配 entries
    const matchResult = this.matcher.match(webvpnEntries, sourceEntries);

    // 2. 对比每对匹配的 entries
    const entries: EntryCompareResult[] = matchResult.matched.map(
      ({ webvpnEntry, sourceEntry, normalizedUrl }, index) =>
        this.compareEntries(webvpnEntry, sourceEntry, normalizedUrl, `entry-${index}`)
    );

    // 3. 为未匹配的 entries 创建结果
    matchResult.unmatchedWebvpn.forEach((entry, index) => {
      entries.push(this.createUnmatchedEntry(entry, 'webvpn_only', `webvpn-only-${index}`));
    });

    matchResult.unmatchedSource.forEach((entry, index) => {
      entries.push(this.createUnmatchedEntry(entry, 'source_only', `source-only-${index}`));
    });

    // 4. 计算摘要
    const summary = this.calculateSummary(entries, webvpnEntries.length, sourceEntries.length);

    return {
      summary,
      entries,
      unmatchedWebvpn: matchResult.unmatchedWebvpn,
      unmatchedSource: matchResult.unmatchedSource,
    };
  }

  /**
   * 对比两个 entry
   */
  private compareEntries(
    webvpnEntry: HarEntry,
    sourceEntry: HarEntry,
    normalizedUrl: string,
    id: string
  ): EntryCompareResult {
    const requestHeaderDiff = this.compareHeaders(
      webvpnEntry.request.headers,
      sourceEntry.request.headers
    );
    const requestCookieDiff = this.compareCookies(
      webvpnEntry.request.cookies,
      sourceEntry.request.cookies
    );
    const requestBodyDiff = this.compareBody(
      webvpnEntry.request.postData?.text,
      sourceEntry.request.postData?.text,
      webvpnEntry.request.postData?.mimeType
    );

    const responseHeaderDiff = this.compareHeaders(
      webvpnEntry.response.headers,
      sourceEntry.response.headers
    );
    const responseCookieDiff = this.compareCookies(
      webvpnEntry.response.cookies,
      sourceEntry.response.cookies
    );
    const responseBodyDiff = this.compareBody(
      webvpnEntry.response.content.text,
      sourceEntry.response.content.text,
      webvpnEntry.response.content.mimeType
    );

    const statusIdentical = webvpnEntry.response.status === sourceEntry.response.status;

    // 判断整体状态
    const hasDifferences =
      !statusIdentical ||
      requestHeaderDiff.different.length > 0 ||
      requestHeaderDiff.missing.length > 0 ||
      requestHeaderDiff.extra.length > 0 ||
      requestCookieDiff.different.length > 0 ||
      requestCookieDiff.missing.length > 0 ||
      requestCookieDiff.extra.length > 0 ||
      requestBodyDiff.status === 'different' ||
      responseHeaderDiff.different.length > 0 ||
      responseHeaderDiff.missing.length > 0 ||
      responseHeaderDiff.extra.length > 0 ||
      responseCookieDiff.different.length > 0 ||
      responseCookieDiff.missing.length > 0 ||
      responseCookieDiff.extra.length > 0 ||
      responseBodyDiff.status === 'different';

    return {
      id,
      method: webvpnEntry.request.method,
      url: normalizedUrl,
      originalWebvpnUrl: webvpnEntry.request.url,
      originalSourceUrl: sourceEntry.request.url,
      status: hasDifferences ? 'different' : 'identical',
      webvpnEntry,
      sourceEntry,
      request: {
        headerDiff: requestHeaderDiff,
        cookieDiff: requestCookieDiff,
        bodyDiff: requestBodyDiff,
      },
      response: {
        statusCode: {
          webvpn: webvpnEntry.response.status,
          source: sourceEntry.response.status,
          isIdentical: statusIdentical,
        },
        headerDiff: responseHeaderDiff,
        cookieDiff: responseCookieDiff,
        bodyDiff: responseBodyDiff,
      },
    };
  }

  /**
   * 创建未匹配 entry 的结果
   */
  private createUnmatchedEntry(
    entry: HarEntry,
    status: 'webvpn_only' | 'source_only',
    id: string
  ): EntryCompareResult {
    const emptyHeaderDiff: HeaderDiff = { matched: [], missing: [], extra: [], different: [] };
    const emptyCookieDiff: CookieDiff = { matched: [], missing: [], extra: [], different: [] };
    const emptyBodyDiff: BodyDiff = {
      status: 'both_empty',
      webvpnSize: 0,
      sourceSize: 0,
    };

    const url = status === 'webvpn_only'
      ? this.normalizer.normalizeUrl(entry.request.url)
      : entry.request.url;

    return {
      id,
      method: entry.request.method,
      url,
      originalWebvpnUrl: status === 'webvpn_only' ? entry.request.url : undefined,
      originalSourceUrl: status === 'source_only' ? entry.request.url : undefined,
      status,
      webvpnEntry: status === 'webvpn_only' ? entry : undefined,
      sourceEntry: status === 'source_only' ? entry : undefined,
      request: {
        headerDiff: emptyHeaderDiff,
        cookieDiff: emptyCookieDiff,
        bodyDiff: emptyBodyDiff,
      },
      response: {
        statusCode: {
          webvpn: status === 'webvpn_only' ? entry.response.status : undefined,
          source: status === 'source_only' ? entry.response.status : undefined,
          isIdentical: false,
        },
        headerDiff: emptyHeaderDiff,
        cookieDiff: emptyCookieDiff,
        bodyDiff: emptyBodyDiff,
      },
    };
  }

  /**
   * 对比 headers
   */
  private compareHeaders(webvpnHeaders: HarHeader[], sourceHeaders: HarHeader[]): HeaderDiff {
    const result: HeaderDiff = {
      matched: [],
      missing: [],
      extra: [],
      different: [],
    };

    // 忽略的 headers（动态值）
    const ignoredHeaders = new Set([
      'date',
      'x-request-id',
      'x-trace-id',
      'cf-ray',
      'x-amz-request-id',
    ]);

    // 构建源站 header map
    const sourceMap = new Map<string, HarHeader>();
    for (const h of sourceHeaders) {
      const name = h.name.toLowerCase();
      if (!ignoredHeaders.has(name)) {
        sourceMap.set(name, h);
      }
    }

    // 构建 webvpn header map
    const webvpnMap = new Map<string, HarHeader>();
    for (const h of webvpnHeaders) {
      const name = h.name.toLowerCase();
      if (!ignoredHeaders.has(name)) {
        webvpnMap.set(name, h);
      }
    }

    // 对比 webvpn headers
    for (const [name, webvpnHeader] of webvpnMap) {
      const sourceHeader = sourceMap.get(name);

      if (!sourceHeader) {
        result.extra.push(webvpnHeader);
        continue;
      }

      // 规范化 webvpn 值
      const normalizedValue = this.urlHeaders.has(name)
        ? this.normalizer.normalizeUrl(webvpnHeader.value)
        : this.normalizer.normalizeText(webvpnHeader.value);

      if (normalizedValue === sourceHeader.value) {
        result.matched.push(webvpnHeader);
      } else {
        result.different.push({
          name: webvpnHeader.name,
          webvpnValue: webvpnHeader.value,
          sourceValue: sourceHeader.value,
          normalizedWebvpnValue: normalizedValue,
          isIdenticalAfterNormalization: normalizedValue === sourceHeader.value,
        });
      }
    }

    // 找出源站有但 webvpn 没有的
    for (const [name, sourceHeader] of sourceMap) {
      if (!webvpnMap.has(name)) {
        result.missing.push(sourceHeader);
      }
    }

    return result;
  }

  /**
   * 对比 cookies
   */
  private compareCookies(webvpnCookies: HarCookie[], sourceCookies: HarCookie[]): CookieDiff {
    const result: CookieDiff = {
      matched: [],
      missing: [],
      extra: [],
      different: [],
    };

    // 构建源站 cookie map（按规范化名称）
    const sourceMap = new Map<string, HarCookie>();
    for (const c of sourceCookies) {
      sourceMap.set(c.name.toLowerCase(), c);
    }

    // 构建 webvpn cookie map（按规范化名称）
    const webvpnMap = new Map<string, { original: HarCookie; normalized: string }>();
    for (const c of webvpnCookies) {
      const normalizedName = this.normalizer.normalizeCookieName(c.name).toLowerCase();
      webvpnMap.set(normalizedName, { original: c, normalized: normalizedName });
    }

    // 对比
    for (const [normalizedName, { original: webvpnCookie }] of webvpnMap) {
      const sourceCookie = sourceMap.get(normalizedName);

      if (!sourceCookie) {
        result.extra.push(webvpnCookie);
        continue;
      }

      if (webvpnCookie.value === sourceCookie.value) {
        result.matched.push({
          normalizedName,
          webvpnCookie,
          sourceCookie,
        });
      } else {
        result.different.push({
          normalizedName,
          webvpnName: webvpnCookie.name,
          sourceName: sourceCookie.name,
          webvpnValue: webvpnCookie.value,
          sourceValue: sourceCookie.value,
        });
      }
    }

    // 找出源站有但 webvpn 没有的
    for (const [name, sourceCookie] of sourceMap) {
      const normalizedSourceName = name.toLowerCase();
      const hasInWebvpn = [...webvpnMap.keys()].some(
        (k) => k === normalizedSourceName
      );
      if (!hasInWebvpn) {
        result.missing.push(sourceCookie);
      }
    }

    return result;
  }

  /**
   * 对比 body
   */
  private compareBody(
    webvpnBody: string | undefined,
    sourceBody: string | undefined,
    mimeType?: string
  ): BodyDiff {
    const webvpnSize = webvpnBody?.length || 0;
    const sourceSize = sourceBody?.length || 0;

    if (!webvpnBody && !sourceBody) {
      return {
        status: 'both_empty',
        mimeType,
        webvpnSize: 0,
        sourceSize: 0,
      };
    }

    if (!webvpnBody) {
      return {
        status: 'source_only',
        mimeType,
        webvpnSize: 0,
        sourceSize,
        sourceText: sourceBody,
      };
    }

    if (!sourceBody) {
      return {
        status: 'webvpn_only',
        mimeType,
        webvpnSize,
        sourceSize: 0,
        webvpnText: webvpnBody,
      };
    }

    // 规范化 webvpn body
    const normalizedWebvpnBody = this.normalizer.normalizeText(webvpnBody);
    const isIdenticalAfterNormalization = normalizedWebvpnBody === sourceBody;

    if (webvpnBody === sourceBody) {
      return {
        status: 'identical',
        mimeType,
        webvpnSize,
        sourceSize,
      };
    }

    return {
      status: 'different',
      mimeType,
      webvpnSize,
      sourceSize,
      isIdenticalAfterNormalization,
      webvpnText: webvpnBody,
      sourceText: sourceBody,
      normalizedWebvpnText: normalizedWebvpnBody,
    };
  }

  /**
   * 计算摘要统计
   */
  private calculateSummary(
    entries: EntryCompareResult[],
    webvpnTotal: number,
    sourceTotal: number
  ): CompareSummary {
    let matched = 0;
    let identical = 0;
    let withDifferences = 0;
    let webvpnOnly = 0;
    let sourceOnly = 0;

    for (const entry of entries) {
      switch (entry.status) {
        case 'identical':
          matched++;
          identical++;
          break;
        case 'different':
          matched++;
          withDifferences++;
          break;
        case 'webvpn_only':
          webvpnOnly++;
          break;
        case 'source_only':
          sourceOnly++;
          break;
      }
    }

    return {
      total: {
        webvpn: webvpnTotal,
        source: sourceTotal,
      },
      matched,
      webvpnOnly,
      sourceOnly,
      identical,
      withDifferences,
    };
  }
}
