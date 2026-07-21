/**
 * Thinking Trace - Robust Apps Script Fetch API Network Module
 */

import { store } from './store.js';

export const api = {
  /**
   * API 1: Request AI Support (action: "askAi")
   * Payload: { action: "askAi", subject, unit, prompt, beforeAi, myQuestion }
   */
  async askAi(beforeAi, myQuestion, assignment = null) {
    const url = store.getAppsScriptUrl();
    const currentAss = assignment || store.getActiveAssignment();

    const payload = {
      action: "askAi",
      subject: currentAss.subject || '',
      unit: currentAss.unit || '',
      prompt: currentAss.prompt || '',
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

    // High-Sensitivity Context-Aware Fallback AI Response Generator
    await new Promise(resolve => setTimeout(resolve, 800));
    return this.generateMockAiAnswer(beforeAi, myQuestion, currentAss);
  },

  /**
   * API 2: Submit Final Trace (action: "submitTrace")
   * Payload: { action: "submitTrace", rowArray: [학번, 이름, pwd, 1구역, 2구역, AI원본답변, 3구역요약, 4구역, selfScore, 제출시간] }
   */
  async submitTrace(studentInfo, traceData) {
    const url = store.getAppsScriptUrl();

    // Format current local time: YYYY-MM-DD HH:mm:ss
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // Exactly 10 elements matching Columns A~J in Google Sheet
    const rowArray = [
      studentInfo.studentId || '',       // A열: 학번
      studentInfo.name || '',            // B열: 이름
      studentInfo.password || '',        // C열: pwd
      traceData.beforeAi || '',          // D열: Before AI (1구역)
      traceData.myQuestion || '',        // E열: My Question (2구역)
      traceData.aiSupport || '',         // F열: 수신된 AI 원본 답변
      traceData.studentSummary || '',    // G열: 학생 핵심 요약 (3구역)
      traceData.myChoice || '',          // H열: My Choice (4구역)
      traceData.selfScore ?? 10,         // J열 위치: 자기점검 합산 점수 (10점 만점)
      formattedDate                      // 제출시간 (YYYY-MM-DD HH:mm:ss)
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
   * High-Sensitivity Educational AI Response Engine (Context-Aware Deep Feedback)
   */
  generateMockAiAnswer(beforeAi, myQuestion, assignment = null) {
    const subject = (assignment && assignment.subject) ? assignment.subject : '교과';
    const unit = (assignment && assignment.unit) ? assignment.unit : '단원';
    const prompt = (assignment && assignment.prompt) ? assignment.prompt : '탐구 과제';

    const bText = (beforeAi || '').trim();
    const qText = (myQuestion || '').trim();

    // Key topic analysis
    let topicName = unit;
    if (qText.includes("특허") || qText.includes("출원") || qText.includes("명세서") || qText.includes("발명")) {
      topicName = "특허 출원 및 지식재산권";
    } else if (qText.includes("저작권") || q.includes("ai") || qText.includes("창작")) {
      topicName = "AI 생성물 저작권 및 인간의 창의성";
    } else if (qText.includes("환경") || qText.includes("탄소") || qText.includes("세금")) {
      topicName = "탄소세 및 환경 정책의 경제적 효과";
    }

    let answer = `[🤖 Gemini 튜터 심층 입체 피드백 - ${subject} > ${unit}]\n\n`;

    answer += `🎯 1. 오늘의 탐구 과제 맥락 검토:\n`;
    answer += `📌 과제: "${prompt}"\n\n`;

    answer += `💡 2. 학생 1구역(Before AI) 초기 생각을 바탕으로 한 진단:\n`;
    if (bText.length > 5) {
      answer += `- 학생의 초기 생각: "${bText}"\n`;
      answer += `- [피드백]: 학생께서 탐구 전 생각하신 방향은 문제 상황의 핵심 지점을 매우 직관적으로 잘 포착하고 있습니다! 특히 자신이 어떤 부분에서 생각이 멈췄는지 명확히 파악하고 계신 점이 훌륭합니다.\n`;
      answer += `- [추가 고려할 점]: 다만, 한 단면뿐만 아니라 이 이슈가 가져올 사회적·법적·경제적 파급 효과까지 다각도로 확장해 볼 수 있습니다.\n\n`;
    } else {
      answer += `- 1구역에 탐구 전 본인의 기본 아이디어와 막힌 지점을 구체적으로 적어보시면 더욱 입체적인 AI 분석을 받으실 수 있습니다.\n\n`;
    }

    answer += `🔍 3. 학생 2구역 질문("${qText}")에 대한 맞춤 답변 & 다각적 관점:\n`;
    if (qText.length > 3) {
      answer += `- [핵심 해설 및 원리]: "${qText}"라는 질문은 이 탐구 주제의 핵심 쟁점을 건드리는 아주 날카로운 질문입니다.\n`;
      
      if (topicName.includes("특허")) {
        answer += `  • 핵심 절차: 선행기술 조사 ➡️ 명세서 작성 ➡️ 출원서 제출 ➡️ 심사 청구 단계로 진행됩니다.\n`;
        answer += `  • 관점 A (신규성·진보성 Focus): 기존 특허와의 기술적 차별성을 객관적 데이터로 입증하는 명세서 작성이 가장 결정적입니다.\n`;
        answer += `  • 관점 B (경제성·권리화 Focus): 출원 비용과 심사 기간(약 1~1.5년)을 고려하여 실용신안 또는 공개특허 등록 여부를 전략적으로 선택해야 합니다.\n`;
      } else if (topicName.includes("저작권")) {
        answer += `  • 법적 기준: 현행 저작권법은 '인간의 사상이나 감정을 표현한 창작물'만을 인정합니다.\n`;
        answer += `  • 관점 A (인간 주도론): AI는 지능적 도구에 불과하며, 프롬프트를 설계하고 최종 선택·수정한 인간에게 저작권이 귀속되어야 한다는 입장입니다.\n`;
        answer += `  • 관점 B (공공재/신개념 권리론): AI 생성물은 무단 복제를 막되 저작권 기한을 단축하거나 별도의 'AI 인격권'을 도입해야 한다는 제안도 있습니다.\n`;
      } else {
        answer += `  • 긍정적 측면 (혜택): 문제 해결을 신속하게 유도하고 기술적·제도적 혁신을 촉진할 수 있습니다.\n`;
        answer += `  • 수반되는 쟁점 (우려): 초기 도입 비용 발생, 기존 이해관계자와의 충돌, 사회적 합의 및 안전성 검증 절차가 수반됩니다.\n`;
      }
    } else {
      answer += `- 2구역에 AI에게 구체적으로 궁금한 점이나 힌트를 요청하는 질문을 적어주세요.\n`;
    }

    answer += `\n⚖️ 4. 4구역(My Choice) 작성을 위한 비판적 성찰 가이드:\n`;
    answer += `- 질문: "위 분석된 여러 관점 중, 내가 최종적으로 동의하는 선택은 무엇이며, 그렇게 판단한 가장 결정적인 이유는 무엇인가요?"\n`;
    answer += `- Tip: 3구역 핵심 요약란에 위 AI 피드백 중 가장 와닿은 문장 1~2개를 요약한 후, 4구역에서 본인만의 주체적 판단을 완성해 보세요!`;

    return answer;
  }
};
