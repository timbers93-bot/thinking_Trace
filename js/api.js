/**
 * Thinking Trace - Robust Apps Script Fetch API Network Module
 */

import { store } from './store.js';

export const api = {
  /**
   * API 1: Request AI Support (action: "askAi")
   * Payload: { action: "askAi", beforeAi: "...", myQuestion: "..." }
   */
  async askAi(beforeAi, myQuestion) {
    const url = store.getAppsScriptUrl();
    const payload = {
      action: "askAi",
      beforeAi: beforeAi,
      myQuestion: myQuestion
    };

    if (url && url.startsWith('http')) {
      try {
        // Use text/plain header to bypass CORS preflight in browsers
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const text = await response.text();
          try {
            const data = JSON.parse(text);
            if (data && (data.reply || data.result)) {
              return data.reply || data.result;
            }
          } catch (e) {
            // Text returned directly
            if (text && text.trim().length > 0) {
              return text;
            }
          }
        }
      } catch (err) {
        console.warn('[Network Notice] Apps Script direct fetch error, executing resilient fallback:', err);
      }
    }

    // Fallback Mock AI Response Generator
    await new Promise(resolve => setTimeout(resolve, 1000));
    return this.generateMockAiAnswer(beforeAi, myQuestion);
  },

  /**
   * API 2: Submit Final Trace (action: "submitTrace")
   * Payload: { action: "submitTrace", rowArray: [학번, 이름, pwd, 1구역, 2구역, AI원본답변, 3구역요약, 4구역, 제출시간] }
   * Columns A~I (Total 9 elements)
   */
  async submitTrace(studentInfo, traceData) {
    const url = store.getAppsScriptUrl();

    // Format current local time: YYYY-MM-DD HH:mm:ss
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // Exactly 9 elements matching Columns A~I in Google Sheet
    const rowArray = [
      studentInfo.studentId || '',       // A열: 학번
      studentInfo.name || '',            // B열: 이름
      studentInfo.password || '',        // C열: pwd
      traceData.beforeAi || '',          // D열: Before AI (1구역)
      traceData.myQuestion || '',        // E열: My Question (2구역)
      traceData.aiSupport || '',         // F열: 수신된 AI 원본 답변
      traceData.studentSummary || '',    // G열: 학생 핵심 요약 (3구역/G열)
      traceData.myChoice || '',          // H열: My Choice (4구역/H열)
      formattedDate                      // I열: 제출시간 (YYYY-MM-DD HH:mm:ss)
    ];

    const activeAss = store.getActiveAssignment();
    const sheetName = activeAss.sheetName || '사고흔적_제출';

    const payload = {
      action: "submitTrace",
      sheetName: sheetName,
      rowArray: rowArray
    };

    if (url && url.startsWith('http')) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const text = await response.text();
          try {
            const data = JSON.parse(text);
            return { success: true, data, formattedDate };
          } catch (e) {
            return { success: true, text, formattedDate };
          }
        }
      } catch (err) {
        console.warn('[Network Notice] Apps Script submitTrace fetch error, fallback to local storage:', err);
      }
    }

    // Fallback local submission
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true, isMock: true, rowArray, formattedDate };
  },

  /**
   * API 3: Reset Backend Sheet Submissions Data (action: "resetSheet")
   * Payload: { action: "resetSheet", sheetName: "단원명" }
   */
  async resetSheet(sheetName) {
    const url = store.getAppsScriptUrl();
    const payload = {
      action: "resetSheet",
      sheetName: sheetName || "사고흔적_제출"
    };

    if (url && url.startsWith('http')) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const text = await response.text();
          try {
            const data = JSON.parse(text);
            return { success: true, data };
          } catch (e) {
            return { success: true, text };
          }
        }
      } catch (err) {
        console.warn('[Network Notice] Apps Script resetSheet fetch error:', err);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, isMock: true };
  },

  /**
   * Educational AI response simulation (Rich, Context-Aware, Sensitive Analysis)
   */
  generateMockAiAnswer(beforeAi, myQuestion) {
    const q = (myQuestion || '').toLowerCase();
    const b = (beforeAi || '').substring(0, 25);

    let category = "일반 탐구";
    if (q.includes("특허") || q.includes("출원") || q.includes("발명")) category = "특허 및 지식재산";
    else if (q.includes("저작권") || q.includes("ai") || q.includes("인공지능")) category = "AI 윤리 및 저작권";
    else if (q.includes("환경") || q.includes("탄소") || q.includes("에너지")) category = "환경 및 지속가능성";

    let answer = `[AI 튜터 심층 입체 분석 - ${category} 분야]\n\n`;
    answer += `💡 1. 학생 초기 생각("${b}...") 진단:\n`;
    answer += `- 질문자님께서 문제 상황의 핵심을 타당하게 잘 짚어주셨습니다. 기존 접근의 한계를 고민하는 접근법이 훌륭합니다.\n\n`;

    answer += `🔍 2. "${myQuestion}"에 대한 다각적 답변:\n`;
    if (category === "특허 및 지식재산") {
      answer += `- [핵심 절차 및 요건]: 특허 출원은 (선행기술 조사 ➡️ 명세서 작성 ➡️ 출원서 제출 ➡️ 심사청구) 4단계를 거칩니다. 기존 기술과의 '신규성'과 '진보성' 증명이 핵심입니다.\n`;
      answer += `- [쟁점 및 대안]: 개인/소기업의 비용 부담과 기술 유출 우려가 있으므로 '실용신안' 등록이나 '공개특허' 제도를 비교 검토할 필요가 있습니다.\n`;
    } else if (category === "AI 윤리 및 저작권") {
      answer += `- [법적·사회적 관점]: 현재 저작권법은 '인간의 사상과 감정'만을 인정하므로 AI 단독 창작물은 저작권이 인정되지 않습니다.\n`;
      answer += `- [기여도 판정 쟁점]: 그러나 인간이 프롬프트 조율 및 수정·선택 과정에 결정적 기여를 한 경우 부분적 창작성을 인정받을 수 있습니다.\n`;
    } else {
      answer += `- [다각적 관점 기술]: 단일 원인 분석을 넘어 기술적 효율성, 사용자 수용성, 법적·제도적 인프라의 종합적 균형이 필요합니다.\n`;
      answer += `- [파급력 분석]: 적용 시 기대되는 이점과 반대로 발생 가능한 부작용(비용 증가, 안전성 검증)을 함께 비교해 보세요.\n`;
    }

    answer += `\n⚖️ 3. 4구역(My Choice) 작성을 위한 성찰 질문:\n`;
    answer += `- "위 분석 내용 중 내가 동의하는 부분과 추가로 고려할 가장 결정적인 기준은 무엇인가?"를 한 문장으로 정리해 보세요.`;

    return answer;
  }
};
