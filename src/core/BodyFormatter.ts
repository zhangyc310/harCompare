/**
 * Body 格式化工具
 * 支持 JSON、XML、URL-encoded 等格式的规范化和对比
 */

export class BodyFormatter {
  /**
   * 根据 MIME 类型格式化 body
   */
  format(body: string, mimeType?: string): string {
    if (!body || !mimeType) {
      return body;
    }

    try {
      // JSON 格式化
      if (this.isJson(mimeType)) {
        return this.formatJson(body);
      }

      // XML 格式化
      if (this.isXml(mimeType)) {
        return this.formatXml(body);
      }

      // URL-encoded 格式化
      if (this.isUrlEncoded(mimeType)) {
        return this.formatUrlEncoded(body);
      }

      // HTML 格式化（基础处理）
      if (this.isHtml(mimeType)) {
        return this.formatHtml(body);
      }

      return body;
    } catch (error) {
      // 格式化失败时返回原始内容
      return body;
    }
  }

  /**
   * JSON 深度对比（忽略字段顺序）
   */
  isJsonEqual(json1: string, json2: string): boolean {
    try {
      const obj1 = JSON.parse(json1);
      const obj2 = JSON.parse(json2);
      return this.deepEqual(obj1, obj2);
    } catch {
      return false;
    }
  }

  /**
   * 格式化 JSON（排序 key，统一缩进）
   */
  private formatJson(text: string): string {
    const parsed = JSON.parse(text);
    return JSON.stringify(this.sortObjectKeys(parsed), null, 2);
  }

  /**
   * 递归排序对象的 key
   */
  private sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }

    const sorted: any = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = this.sortObjectKeys(obj[key]);
    }
    return sorted;
  }

  /**
   * 格式化 XML（简单处理：移除空白，排序属性）
   */
  private formatXml(text: string): string {
    // 移除标签之间的多余空白
    let formatted = text.replace(/>\s+</g, '><');

    // 移除行首行尾空白
    formatted = formatted.trim();

    // 排序属性（基础实现）
    formatted = formatted.replace(/<(\w+)([^>]*)>/g, (match, tagName, attrs) => {
      if (!attrs.trim()) {
        return match;
      }

      // 提取属性
      const attrRegex = /(\w+)="([^"]*)"/g;
      const attributes: [string, string][] = [];
      let attrMatch;

      while ((attrMatch = attrRegex.exec(attrs)) !== null) {
        attributes.push([attrMatch[1], attrMatch[2]]);
      }

      // 排序属性
      attributes.sort((a, b) => a[0].localeCompare(b[0]));

      // 重新构建标签
      const sortedAttrs = attributes.map(([k, v]) => `${k}="${v}"`).join(' ');
      return `<${tagName} ${sortedAttrs}>`;
    });

    return formatted;
  }

  /**
   * 格式化 URL-encoded（解析参数并排序）
   */
  private formatUrlEncoded(text: string): string {
    const params = new URLSearchParams(text);

    // 提取并排序参数
    const entries = Array.from(params.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    // 重新构建
    return entries.map(([key, value]) => `${key}=${value}`).join('&');
  }

  /**
   * 格式化 HTML（基础处理：移除多余空白）
   */
  private formatHtml(text: string): string {
    // 移除注释
    let formatted = text.replace(/<!--[\s\S]*?-->/g, '');

    // 移除标签之间的多余空白
    formatted = formatted.replace(/>\s+</g, '><');

    // 移除行首行尾空白
    formatted = formatted.trim();

    return formatted;
  }

  /**
   * 深度对比两个对象
   */
  private deepEqual(obj1: any, obj2: any): boolean {
    // 基础类型比较
    if (obj1 === obj2) {
      return true;
    }

    // null 或 undefined 检查
    if (obj1 == null || obj2 == null) {
      return obj1 === obj2;
    }

    // 类型检查
    if (typeof obj1 !== typeof obj2) {
      return false;
    }

    // 非对象类型
    if (typeof obj1 !== 'object') {
      return obj1 === obj2;
    }

    // 数组检查
    const isArray1 = Array.isArray(obj1);
    const isArray2 = Array.isArray(obj2);

    if (isArray1 !== isArray2) {
      return false;
    }

    if (isArray1 && isArray2) {
      if (obj1.length !== obj2.length) {
        return false;
      }
      for (let i = 0; i < obj1.length; i++) {
        if (!this.deepEqual(obj1[i], obj2[i])) {
          return false;
        }
      }
      return true;
    }

    // 对象比较
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (!keys2.includes(key)) {
        return false;
      }
      if (!this.deepEqual(obj1[key], obj2[key])) {
        return false;
      }
    }

    return true;
  }

  /**
   * 检查是否为 JSON
   */
  private isJson(mimeType: string): boolean {
    return mimeType.includes('json');
  }

  /**
   * 检查是否为 XML
   */
  private isXml(mimeType: string): boolean {
    return mimeType.includes('xml');
  }

  /**
   * 检查是否为 URL-encoded
   */
  private isUrlEncoded(mimeType: string): boolean {
    return mimeType.includes('application/x-www-form-urlencoded');
  }

  /**
   * 检查是否为 HTML
   */
  private isHtml(mimeType: string): boolean {
    return mimeType.includes('html');
  }
}
