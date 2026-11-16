// ========================================================
// CHUNITHM SHIFT - 데이터 추출 & 동기화 스크립트
// ========================================================

async function fetchPageDoc(url) {
    return new DOMParser().parseFromString(await (await fetch(url)).text(), "text/html");
}

async function fetchMusicFormDoc(url, token) {
    return new DOMParser().parseFromString(await (await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `genre=99&token=${token}`
    })).text(), "text/html");
}

function switchNumToDiff(n) {
    switch (n) {
        case 0: return "Basic";
        case 1: return "Advanced";
        case 2: return "Expert";
        case 3: return "Master";
        case 4: return "Ultima";
        default: return "Unknown";
    }
}

function toISOStringWithTimezone(date) {
    const pad = (str) => (`0${str}`).slice(-2);
    const year = (date.getFullYear()).toString();
    const month = pad((date.getMonth() + 1).toString());
    const day = pad(date.getDate().toString());
    const hour = pad(date.getHours().toString());
    const min = pad(date.getMinutes().toString());
    const sec = pad(date.getSeconds().toString());
    const tz = -date.getTimezoneOffset();
    const sign = tz >= 0 ? '+' : '-';
    const tzHour = pad((tz / 60).toString());
    const tzMin = pad((tz % 60).toString());

    return `${year}-${month}-${day}T${hour}:${min}:${sec}${sign}${tzHour}:${tzMin}`;
}

async function main() {
    const sleep = waitTime => new Promise(resolve => setTimeout(resolve, waitTime));

    const VERSION = "2.1.0-shift";
    const difficulties = ["Basic", "Advanced", "Expert", "Master", "Ultima"];
    const engMode = location.hostname === "chunithm-net-eng.com";
    let baseUrl = engMode ? "https://chunithm-net-eng.com/" : "https://new.chunithm-net.com/chuni-mobile/html/";
    baseUrl += "mobile/";
    const homeUrl = `${baseUrl}home/`;
    const musicUrl = `${baseUrl}record/musicGenre/`;
    const sendUrl = `${musicUrl}send`;
    const ratingsUrlBase = `${homeUrl}playerData/`;
    const ratingsBestUrl = `${ratingsUrlBase}ratingDetailBest/`;
    const ratingsNewUrl = `${ratingsUrlBase}ratingDetailRecent/`;
    const playerData = {};

    // 1. 도메인 체크
    if (location.hostname !== "new.chunithm-net.com" && location.hostname !== "chunithm-net-eng.com") {
        alert("이 스크립트는 CHUNITHM-NET 페이지(new.chunithm-net.com 또는 chunithm-net-eng.com)에서만 실행할 수 있습니다.");
        return;
    }

    const homeDoc = await fetchPageDoc(homeUrl);
    if (homeDoc.querySelector(".player_honor_block") === null) {
        alert("CHUNITHM-NET에 로그인하고 Aime 카드를 선택한 후 다시 실행해 주세요.");
        return;
    }

    // 기존 UI 제거 (중복 실행 방지)
    const existingUi = document.getElementById("chunishift-modal");
    if (existingUi) existingUi.remove();

    // 2. 모던 UI 생성 (CHUNITHM SHIFT 디자인)
    const overlay = document.createElement("div");
    overlay.id = "chunishift-modal";
    overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 999999;
        background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
        color: #f4f4f5; -webkit-font-smoothing: antialiased;
    `;

    const card = document.createElement("div");
    card.style.cssText = `
        background: #18181b; border: 1px solid #27272a;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
        border-radius: 20px; width: min(92vw, 420px);
        padding: 24px; box-sizing: border-box; text-align: left;
        animation: csFadeIn 0.25s ease-out;
    `;

    // 인라인 애니메이션 스타일 삽입
    const styleTag = document.createElement("style");
    styleTag.textContent = `
        @keyframes csFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .cs-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .cs-btn:active { transform: translateY(0); }
    `;
    document.head.appendChild(styleTag);

    // 헤더 영역
    const header = document.createElement("div");
    header.style.cssText = "display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;";
    header.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #38bdf8; box-shadow: 0 0 10px #38bdf8;"></div>
            <span style="font-weight: 900; font-size: 1.15rem; letter-spacing: -0.02em; background: linear-gradient(135deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">CHUNITHM SHIFT</span>
        </div>
        <span style="font-size: 0.75rem; color: #71717a; background: #27272a; padding: 2px 8px; border-radius: 9999px; font-weight: 700;">v${VERSION}</span>
    `;
    card.appendChild(header);

    // 상태 안내 메시지 영역
    const statusText = document.createElement("div");
    statusText.style.cssText = "font-size: 0.92rem; font-weight: 600; color: #e4e4e7; margin-bottom: 12px;";
    statusText.textContent = "플레이어 정보를 수집하고 있습니다...";
    card.appendChild(statusText);

    // 프로그레스 바 영역
    const progressBarBg = document.createElement("div");
    progressBarBg.style.cssText = "width: 100%; height: 8px; background: #27272a; border-radius: 9999px; overflow: hidden; margin-bottom: 8px;";
    const progressBarFill = document.createElement("div");
    progressBarFill.style.cssText = "width: 5%; height: 100%; background: linear-gradient(90deg, #38bdf8, #6366f1); border-radius: 9999px; transition: width 0.3s ease;";
    progressBarBg.appendChild(progressBarFill);
    card.appendChild(progressBarBg);

    // 진행률 텍스트
    const progressDetail = document.createElement("div");
    progressDetail.style.cssText = "display: flex; justify-content: space-between; font-size: 0.75rem; color: #a1a1aa; font-weight: 600; margin-bottom: 20px;";
    progressDetail.innerHTML = `<span>준비 중...</span><span>0 / 8</span>`;
    card.appendChild(progressDetail);

    // 액션 컨테이너 (완료 후 버튼들이 표시될 자리)
    const actionContainer = document.createElement("div");
    actionContainer.style.cssText = "display: flex; flex-direction: column; gap: 10px;";
    card.appendChild(actionContainer);

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const fullProgressCount = 8;
    let progressCount = 1;

    const updateProgress = (stepName) => {
        statusText.textContent = stepName;
        const percent = Math.min(100, Math.round((progressCount / fullProgressCount) * 100));
        progressBarFill.style.width = `${percent}%`;
        progressDetail.innerHTML = `<span>${stepName}</span><span>${progressCount} / ${fullProgressCount}</span>`;
    };

    updateProgress("프로필 정보 수집 중...");
    await sleep(800);

    // ==========================================
    // 3. Player Data 추출
    // ==========================================
    const honors = homeDoc.querySelectorAll(".player_honor_text");
    let mainHonor = honors.length > 0 ? honors[0].textContent.trim() : "";
    let subHonor = honors.length > 1 ? honors[1].textContent.trim() : "";
    
    const name = homeDoc.querySelector(".player_name_in").textContent;
    const classEmblemImg = homeDoc.querySelector(".player_classemblem_top img");
    const classEmblem = classEmblemImg ? classEmblemImg.src : "";

    const ratingBlockImgs = homeDoc.querySelectorAll(".player_rating_num_block img");
    const ratingStr = [];
    for (let i = 0; i < ratingBlockImgs.length; i++) {
        const src = ratingBlockImgs[i].src;
        if (src.includes("comma")) {
            ratingStr.push(".");
            continue;
        }
        const match = src.match(/([0-9])\.png/);
        if (match) ratingStr.push(match[1]);
    }
    const rating = Number(ratingStr.join(""));
    let playerLevel = Number(homeDoc.querySelector(".player_lv").innerText);
    const playerReborn = homeDoc.querySelector(".player_reborn");
    if (playerReborn !== null) {
        playerLevel += Number(playerReborn.innerText) * 100;
    }
    const lastPlayed = homeDoc.querySelector(".player_lastplaydate_text").textContent;
    
    const charaImgEle = homeDoc.querySelector(".player_chara img");
    const characterImage = charaImgEle ? charaImgEle.src : null;

    const playerDataUrl = `${homeUrl}playerData/`;
    const playerDataDoc = await fetchPageDoc(playerDataUrl);
    const playCount = playerDataDoc.querySelector(".user_data_play_count .user_data_text")?.textContent.trim() || "0";
    const currentPlayCount = playerDataDoc.querySelector(".user_data_current_play_count .user_data_text")?.textContent.trim() || "0";

    playerData.appVersion = VERSION;
    playerData.honor = mainHonor;
    playerData.subHonor = subHonor;
    playerData.classEmblem = classEmblem;
    playerData.playCount = playCount;
    playerData.currentPlayCount = currentPlayCount;
    playerData.name = name;
    playerData.rating = rating;
    playerData.level = playerLevel;
    playerData.characterImage = characterImage;
    playerData.updatedAt = toISOStringWithTimezone(new Date());
    playerData.lastPlayed = toISOStringWithTimezone(new Date(lastPlayed));

    // ==========================================
    // 4. Music Data 수집
    // ==========================================
    const musicData = [];
    const preDoc = await fetchPageDoc(musicUrl);
    const token = preDoc.querySelector("input[name=token]").value;

    for (let i = 0; i < difficulties.length; i++) {
        progressCount++;
        const difficulty = difficulties[i];
        updateProgress(`${difficulty.toUpperCase()} 채보 기록 수집 중...`);
        const musicDoc = await fetchMusicFormDoc(sendUrl + difficulty, token);

        const forms = musicDoc.querySelectorAll("form");
        for (let j = 0; j < forms.length; j++) {
            if (forms[j].querySelector(".music_title") === null) continue;
            const title = forms[j].querySelector(".music_title").textContent.trim();
            if (!title) continue;

            let score = 0;
            if (forms[j].querySelector(".play_musicdata_highscore") !== null) {
                score = Number(forms[j].querySelector(".play_musicdata_highscore").querySelector("span").textContent.replaceAll(",", ""));
            }
            let isAllJustice = false;
            let isFullCombo = false;
            let fullChainLv = 0;
            const lampImgsDiv = forms[j].querySelector(".play_musicdata_icon");
            if (lampImgsDiv !== null) {
                const lampImgs = forms[j].querySelector(".play_musicdata_icon").querySelectorAll("img");
                for (let k = 0; k < lampImgs.length; k++) {
                    const src = lampImgs[k].src;
                    if (src.includes("alljustice")) {
                        isAllJustice = true;
                        isFullCombo = true;
                    } else if (src.includes("fullcombo")) {
                        isFullCombo = true;
                    }
                    if (src.includes("fullchain2")) {
                        fullChainLv = 2;
                    } else if (src.includes("fullchain")) {
                        fullChainLv = 1;
                    }
                }
            }
            const idx = Number.parseInt(forms[j].querySelector('input[type="hidden"][name="idx"]').getAttribute("value"));

            musicData.push({
                title: title,
                difficulty: difficulty,
                score: score,
                isAllJustice: isAllJustice,
                isFullCombo: isFullCombo,
                fullChainLv: fullChainLv,
                idx: idx
            });
        }
        await sleep(700);
    }

    // ==========================================
    // 5. Best 30 & New 20 수집
    // ==========================================
    progressCount++;
    updateProgress("Best 30 기록 수집 중...");
    const ratingsBestDoc = await fetchPageDoc(ratingsBestUrl);
    const bestMusics = ratingsBestDoc.getElementsByTagName("form");
    const bestMusicData = [];
    for (let i = 0; i < bestMusics.length; i++) {
        const music = bestMusics[i];
        const title = music.querySelector(".music_title").textContent.trim();
        const difficulty = switchNumToDiff(Number(music.querySelector('input[type="hidden"][name="diff"]').getAttribute("value")));
        const score = Number(music.querySelector(".play_musicdata_highscore").querySelector("span").textContent.replaceAll(",", ""));

        let isAllJustice = false;
        let isFullCombo = false;
        let fullChainLv = 0;
        const musicInMusicData = musicData.find(m => m.title === title && m.difficulty === difficulty && m.score === score);
        if (musicInMusicData) {
            isAllJustice = musicInMusicData.isAllJustice;
            isFullCombo = musicInMusicData.isFullCombo;
            fullChainLv = musicInMusicData.fullChainLv;
        }
        const idx = Number.parseInt(music.querySelector('input[type="hidden"][name="idx"]').getAttribute("value"));

        bestMusicData.push({
            title: title,
            difficulty: difficulty,
            score: score,
            isAllJustice: isAllJustice,
            isFullCombo: isFullCombo,
            fullChainLv: fullChainLv,
            idx: idx
        });
    }
    await sleep(700);

    progressCount++;
    updateProgress("New 20 기록 수집 중...");
    const ratingsNewDoc = await fetchPageDoc(ratingsNewUrl);
    const newMusics = ratingsNewDoc.getElementsByTagName("form");
    const newMusicData = [];
    for (let i = 0; i < newMusics.length; i++) {
        const music = newMusics[i];
        const title = music.querySelector(".music_title").textContent.trim();
        const difficulty = switchNumToDiff(Number(music.querySelector('input[type="hidden"][name="diff"]').getAttribute("value")));
        const score = Number(music.querySelector(".play_musicdata_highscore").querySelector("span").textContent.replaceAll(",", ""));

        let isAllJustice = false;
        let isFullCombo = false;
        let fullChainLv = 0;
        const musicInMusicData = musicData.find(m => m.title === title && m.difficulty === difficulty && m.score === score);
        if (musicInMusicData) {
            isAllJustice = musicInMusicData.isAllJustice;
            isFullCombo = musicInMusicData.isFullCombo;
            fullChainLv = musicInMusicData.fullChainLv;
        }
        const idx = Number.parseInt(music.querySelector('input[type="hidden"][name="idx"]').getAttribute("value"));

        newMusicData.push({
            title: title,
            difficulty: difficulty,
            score: score,
            isAllJustice: isAllJustice,
            isFullCombo: isFullCombo,
            fullChainLv: fullChainLv,
            idx: idx
        });
    }

    playerData.best = bestMusicData;
    playerData.new = newMusicData;
    playerData.score = musicData;

    // ==========================================
    // 6. 수집 완료 및 전송 UI 표시
    // ==========================================
    progressBarFill.style.width = "100%";
    statusText.textContent = "✨ 데이터 수집 완료!";
    progressDetail.innerHTML = `<span>${playerData.name} (${playerData.rating.toFixed(2)})</span><span>완료</span>`;

    const allowedOrigins = [
        "https://chunishift.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001"
    ];

    const messageHandler = (e) => {
        if (!allowedOrigins.includes(e.origin)) return;
        if (e.data !== "ready") return;
        
        e.source.postMessage(JSON.stringify(playerData), e.origin);
        statusText.textContent = "🚀 CHUNITHM SHIFT로 데이터 전송 성공!";
        sendBtn.textContent = "✅ 동기화 완료! 창을 닫아도 됩니다";
        sendBtn.style.background = "#10b981";
    };
    window.addEventListener("message", messageHandler);

    // 버튼 1: CHUNITHM SHIFT 열기 및 자동 전송
    const sendBtn = document.createElement("button");
    sendBtn.className = "cs-btn";
    sendBtn.textContent = "🚀 CHUNITHM SHIFT 열기 및 데이터 전송";
    sendBtn.style.cssText = `
        width: 100%; padding: 14px; border: none; border-radius: 12px;
        background: linear-gradient(135deg, #0284c7, #4f46e5);
        color: #fff; font-size: 0.95rem; font-weight: 800;
        cursor: pointer; transition: all 0.2s ease;
        box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
    `;
    sendBtn.addEventListener("click", () => {
        window.open("https://chunishift.vercel.app/");
    });
    actionContainer.appendChild(sendBtn);

    // 보조 버튼 그룹
    const subButtonGroup = document.createElement("div");
    subButtonGroup.style.cssText = "display: flex; gap: 8px; margin-top: 4px;";

    const blob = new Blob([JSON.stringify(playerData, null, 2)], { type: "application/json" });
    const jsonUrl = URL.createObjectURL(blob);
    const downloadBtn = document.createElement("a");
    downloadBtn.className = "cs-btn";
    downloadBtn.textContent = "💾 JSON 다운로드";
    downloadBtn.href = jsonUrl;
    downloadBtn.download = `chunishift_${playerData.name}_${Date.now()}.json`;
    downloadBtn.style.cssText = `
        flex: 1; padding: 10px; border-radius: 10px; text-decoration: none;
        background: #27272a; color: #d4d4d8; font-size: 0.82rem; font-weight: 700;
        text-align: center; border: 1px solid #3f3f46; transition: all 0.2s;
    `;
    subButtonGroup.appendChild(downloadBtn);

    const closeBtn = document.createElement("button");
    closeBtn.className = "cs-btn";
    closeBtn.textContent = "닫기";
    closeBtn.style.cssText = `
        padding: 10px 16px; border-radius: 10px; border: 1px solid #27272a;
        background: transparent; color: #a1a1aa; font-size: 0.82rem; font-weight: 700;
        cursor: pointer; transition: all 0.2s;
    `;
    closeBtn.addEventListener("click", () => {
        window.removeEventListener("message", messageHandler);
        overlay.remove();
    });
    subButtonGroup.appendChild(closeBtn);

    actionContainer.appendChild(subButtonGroup);
}

main();

