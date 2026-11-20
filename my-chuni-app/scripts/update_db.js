const fs = require('fs');
const path = require('path');

const API_URL = 'https://chunimaru.fuwamofu.net/api/songdb/intl';
const DB_PATH = path.join(__dirname, '..', 'data', 'chunimaru_db.json');

async function updateSongDB() {
  console.log('🔄 최신 CHUNITHM International 악곡 DB 다운로드 중...');
  console.log(`URL: ${API_URL}`);

  try {
    const response = await fetch(API_URL, {
      headers: {
        'Accept-Encoding': 'gzip',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP 오류: ${response.status} ${response.statusText}`);
    }

    const newData = await response.json();

    if (!newData || !newData.songs || !Array.isArray(newData.songs)) {
      throw new Error('유효하지 않은 DB 응답 형식입니다.');
    }

    // 기존 데이터 읽기
    let oldSongCount = 0;
    let oldVersion = 'Unknown';
    if (fs.existsSync(DB_PATH)) {
      try {
        const oldData = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        oldSongCount = oldData.songCount || (oldData.songs ? oldData.songs.length : 0);
        oldVersion = oldData.gameVersion || 'Unknown';
      } catch (e) {}
    }

    // 파일 저장
    fs.writeFileSync(DB_PATH, JSON.stringify(newData, null, 2), 'utf-8');

    console.log('\n✅ DB 업데이트 성공!');
    console.log('--------------------------------------------------');
    console.log(`게임 버전:   ${oldVersion} ➔ ${newData.gameVersion}`);
    console.log(`총 곡 수:    ${oldSongCount}곡 ➔ ${newData.songCount}곡 (+${newData.songCount - oldSongCount}곡 추가)`);
    console.log(`총 채보 수:  ${newData.chartCount}개`);
    console.log(`데이터 생성: ${newData.generatedAt}`);
    console.log('--------------------------------------------------');
  } catch (error) {
    console.error('❌ DB 업데이트 중 오류 발생:', error.message);
    process.exit(1);
  }
}

updateSongDB();
