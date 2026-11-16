/**
 * 외부 이미지(CHUNITHM-NET 등) CORS 차단 우회를 위한 프록시 헬퍼 함수
 */
export function getProxyUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http")) {
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&cors=1`;
  }
  return url;
}

