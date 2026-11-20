/**
 * sdvx.in 및 チュウニズム譜面保管所 (YouTube) 채보 연동 유틸리티
 */

export const SDVX_BASE_URL = "https://sdvx.in/chunithm.php";
export const YOUTUBE_HUMEN_CHANNEL = "https://www.youtube.com/@chunithm_humen";

/**
 * sdvx.in CHUNITHM 채보 검색 링크 생성
 * sdvx.in 도메인 내에서 해당 곡명의 채보 시트를 직접 검색할 수 있는 구글 맞춤 쿼리 링크
 */
export function getSdvxChartUrl(title: string, diff?: string): string {
  // 특수 기호 정제 (검색 방해 요소 제거)
  const cleanTitle = title.replace(/[［］【】「」]/g, " ").trim();
  const diffParam = diff ? ` ${diff}` : "";
  return `https://www.google.com/search?q=site:sdvx.in/chunithm+${encodeURIComponent(cleanTitle + diffParam)}`;
}

/**
 * YouTube @chunithm_humen (チュウニズム譜面保管所) 채보 영상 다이렉트 검색 링크 생성
 * 모바일 및 데스크톱 환경 모두에서 가장 신뢰도 높은 유튜브 결과 반환
 */
export function getYoutubeHumenVideoUrl(title: string, diff?: string): string {
  const cleanTitle = title.replace(/[［］【】「」]/g, " ").trim();
  const diffParam = diff ? ` ${diff}` : "";
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`@chunithm_humen ${cleanTitle}${diffParam}`)}`;
}

/**
 * YouTube @chunithm_humen 채널 내부 검색 링크 (데스크톱 최적화)
 */
export function getYoutubeChannelSearchUrl(title: string): string {
  const cleanTitle = title.replace(/[［］【】「」]/g, " ").trim();
  return `https://www.youtube.com/@chunithm_humen/search?query=${encodeURIComponent(cleanTitle)}`;
}
