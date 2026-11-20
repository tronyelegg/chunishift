/**
 * sdvx.in 및 チュウニズム譜面保管所 (YouTube) 채보 연동 유틸리티
 */

export const SDVX_BASE_URL = "https://sdvx.in/chunithm.php";
export const YOUTUBE_HUMEN_CHANNEL = "https://www.youtube.com/@chunithm_humen";

/**
 * sdvx.in CHUNITHM 채보 검색 링크 생성
 *
 * sdvx.in/chunithm.php 페이지 내에 클라이언트 사이드 JS 검색 필드(input#searchTitle)가 있으므로,
 * URL 해시에 곡명을 넣어 전달합니다. sdvx.in 자체는 해시를 읽지 않지만,
 * 사용자가 페이지에 도착하면 곡명이 클립보드에 복사된 상태이므로 바로 붙여넣기 할 수 있습니다.
 * → SongDetailModal에서 "곡명 복사 후 sdvx.in 열기" 플로우로 처리합니다.
 */
export function getSdvxChartUrl(_title?: string): string {
  // sdvx.in은 URL 파라미터 기반 검색을 지원하지 않으므로 메인 페이지로 이동
  return SDVX_BASE_URL;
}

/**
 * YouTube @chunithm_humen 채널 내부 검색 링크
 *
 * 채널 페이지 내 검색 탭(/@chunithm_humen/search?query=...)을 활용하여
 * @chunithm_humen 채널의 영상만 정확하게 검색합니다.
 * 쿼리에 @chunithm_humen 핸들을 포함하지 않고 곡명(+난이도)만 전달합니다.
 */
export function getYoutubeHumenVideoUrl(title: string, diff?: string): string {
  const cleanTitle = title.replace(/[［］【】「」]/g, " ").trim();
  const diffParam = diff ? ` ${diff}` : "";
  return `https://www.youtube.com/@chunithm_humen/search?query=${encodeURIComponent(cleanTitle + diffParam)}`;
}

/**
 * YouTube @chunithm_humen 채널 내부 검색 링크 (난이도 없이 곡명만)
 */
export function getYoutubeChannelSearchUrl(title: string): string {
  const cleanTitle = title.replace(/[［］【】「」]/g, " ").trim();
  return `https://www.youtube.com/@chunithm_humen/search?query=${encodeURIComponent(cleanTitle)}`;
}
