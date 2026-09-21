const fs = require('fs');
const path = require('path');

// 1. 상수 DB 파일 경로 설정 (data 폴더 안의 chunirec_db.json)
const dbPath = path.join(__dirname, 'data', 'chunirec_db.json');
const rawData = fs.readFileSync(dbPath, 'utf-8');
const db = JSON.parse(rawData);

const result = [];
const difficultyKeys = ['BAS', 'ADV', 'EXP', 'MAS', 'ULT'];

// 2. 전체 곡 데이터를 순회하며 조건 검사
db.forEach(song => {
  difficultyKeys.forEach(diff => {
    const diffData = song.data[diff];
    
    // 데이터가 존재하고, 표기 레벨이 10 이상이며, 상수가 0인 경우
    if (diffData && diffData.level >= 10 && diffData.const === 0) {
      result.push({
        title: song.meta.title,
        difficulty: diff,
        level: diffData.level
      });
    }
  });
});

// 3. 결과 출력 및 새 파일로 저장
console.log(`🚨 레벨 10 이상 중 상수가 0인 곡: 총 ${result.length}개 발견`);

// 터미널에 앞부분 10개만 미리보기 출력
console.log(result.slice(0, 10));
if (result.length > 10) console.log("... (이하 생략)");

// 전체 결과를 보기 편하게 'missing_constants.json' 파일로 따로 저장
const outputPath = path.join(__dirname, 'missing_constants.json');
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
console.log(`\n✅ 상세 목록이 ${outputPath} 에 저장되었습니다.`);