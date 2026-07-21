/**
 * Thinking Trace - Student Activity View (4-Step Trace, Timer, Progressive Disclosure & Self-Rubric)
 */

import { store } from '../store.js';
import { api } from '../api.js';

export function renderStudentActivityView() {
  const user = store.getUser();
  const trace = store.getThinkingTrace();
  const assignment = store.getActiveAssignment();

  const container = document.createElement('div');
  container.className = 'activity-container';

  // Check initial Progressive Disclosure state
  const isUnlockedInitially = Boolean(trace.aiSupport || trace.isSubmitted);

  // Check Timer status
  const timerEnabled = assignment.timerEnabled !== false; // Default true unless explicitly false

  container.innerHTML = `
    <!-- Top Fixed Assignment Banner (교과목 > 단원명 > 오늘의 과제) -->
    <div class="assignment-banner-card">
      <div class="assignment-header">
        <span class="banner-badge"><i class="fa-solid fa-bullhorn"></i> 오늘의 탐구 과제</span>
        <div class="assignment-path">
          <span class="path-item subject"><i class="fa-solid fa-book-bookmark"></i> ${assignment.subject || '교과목'}</span>
          <i class="fa-solid fa-chevron-right path-sep"></i>
          <span class="path-item unit"><i class="fa-solid fa-layer-group"></i> ${assignment.unit || '단원명'}</span>
        </div>
      </div>
      <div class="assignment-prompt">
        <i class="fa-solid fa-circle-question prompt-icon"></i>
        <h2>${assignment.prompt || '과제 내용을 작성해주세요.'}</h2>
      </div>
    </div>

    <!-- Student Activity Title & Status & Timer -->
    <div class="activity-header-card" style="margin-top: 1rem;">
      <div class="activity-title">
        <h1><i class="fa-solid fa-brain-circuit" style="color: #0ea5e9;"></i> 사고 흔적(Thinking Trace) 기록</h1>
        <p>AI 연동 4단계 사고 프로세스를 통해 과제에 대한 나의 탐구 결론을 완성하세요.</p>
      </div>
      <div class="student-meta" style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
        <!-- 5-Minute Timer (ON/OFF Control) -->
        <div id="assignment-timer" class="timer-badge ${timerEnabled ? '' : 'hidden'}" style="${timerEnabled ? '' : 'display: none;'}">
          <i class="fa-solid fa-clock"></i>
          <span class="timer-label">남은 시간:</span>
          <span id="timer-display" class="timer-time">05:00</span>
        </div>

        <div id="activity-status-badge" class="status-badge ${trace.isSubmitted ? 'submitted' : 'in-progress'}">
          <i class="fa-solid ${trace.isSubmitted ? 'fa-circle-check' : 'fa-clock-rotate-left'}"></i>
          <span>${trace.isSubmitted ? '최종 제출 완료 (' + (trace.submittedAt || '') + ')' : '작성 진행 중'}</span>
        </div>
      </div>
    </div>

    <!-- Read-Only Notice if Submitted -->
    <div id="readonly-info-banner" class="readonly-banner ${trace.isSubmitted ? '' : 'hidden'}" style="${trace.isSubmitted ? '' : 'display: none;'}">
      <i class="fa-solid fa-lock"></i>
      <span>최종 제출이 완료되어 작성 양식이 <strong>읽기 전용(Read-only)</strong>으로 보호됩니다.</span>
    </div>

    <!-- 4-Step Trace Grid with Progressive Disclosure -->
    <div class="trace-grid">
      
      <!-- 1구역: Before AI (Always Unlocked) -->
      <div class="trace-card sec-1">
        <div class="trace-card-header">
          <div class="sec-step">1</div>
          <div class="sec-title-box">
            <div class="sec-title">Before AI</div>
            <div class="sec-desc">내 생각 / 탐구 전 막힌 부분 기록</div>
          </div>
          <i class="fa-solid fa-lightbulb" style="color: #0ea5e9; font-size: 1.25rem;"></i>
        </div>
        <textarea 
          id="trace-sec-1" 
          class="trace-textarea" 
          placeholder="AI의 도움을 받기 전, 본인이 알고 있는 지식이나 고민되는 점, 막힌 부분을 자유롭게 적어보세요."
          ${trace.isSubmitted ? 'disabled' : ''}
        >${trace.beforeAi || ''}</textarea>
      </div>

      <!-- 2구역: My Question (Always Unlocked) -->
      <div class="trace-card sec-2">
        <div class="trace-card-header">
          <div class="sec-step">2</div>
          <div class="sec-title-box">
            <div class="sec-title">My Question</div>
            <div class="sec-desc">AI에게 보낼 질문 기록</div>
          </div>
          <i class="fa-solid fa-circle-question" style="color: #6366f1; font-size: 1.25rem;"></i>
        </div>
        <textarea 
          id="trace-sec-2" 
          class="trace-textarea" 
          placeholder="막힌 부분을 해결하거나 다각적 관점을 탐구하기 위해 AI에게 던질 핵심 질문을 작성해 보세요."
          ${trace.isSubmitted ? 'disabled' : ''}
        >${trace.myQuestion || ''}</textarea>

        <!-- Ask AI Button Area -->
        <div class="ask-ai-wrapper">
          <button type="button" id="btn-ask-ai" class="btn-ask-ai" ${trace.isSubmitted ? 'disabled' : ''}>
            <i class="fa-solid fa-robot"></i>
            <span id="ask-ai-text">AI 답변 요청 (Code.gs askAi)</span>
          </button>
        </div>
      </div>

      <!-- 3구역: AI Support & Student Summary (Progressive Disclosure - Disabled until AI requested) -->
      <div id="sec-3-card" class="trace-card sec-3 ${isUnlockedInitially ? 'unlocked-zone' : 'locked-zone'}">
        <div class="zone-lock-overlay ${isUnlockedInitially ? 'hidden' : ''}">
          <i class="fa-solid fa-lock"></i>
          <span>1, 2구역 작성 후 <strong>[AI 답변 요청]</strong>을 완료하면 부드럽게 해제됩니다.</span>
        </div>

        <div class="trace-card-header">
          <div class="sec-step">3</div>
          <div class="sec-title-box">
            <div class="sec-title">AI Support</div>
            <div class="sec-desc">AI 답변 확인 & 핵심 요약 작성</div>
          </div>
          <i class="fa-solid fa-microchip" style="color: #8b5cf6; font-size: 1.25rem;"></i>
        </div>
        
        <!-- Fixed AI Answer Output Box -->
        <div class="ai-box-label"><i class="fa-solid fa-robot"></i> 수신된 AI 답변</div>
        <div id="trace-sec-3-ai" class="ai-response-box">
          ${trace.aiSupport 
            ? trace.aiSupport 
            : `<div class="ai-placeholder"><i class="fa-solid fa-sparkles"></i> 1구역과 2구역 작성 후 [AI 답변 요청] 버튼을 누르면 AI 피드백이 출력됩니다.</div>`
          }
        </div>

        <!-- Student Summary Input Area -->
        <div class="summary-input-wrapper" style="margin-top: 1.25rem; width: 100%;">
          <label for="trace-sec-3-summary" class="summary-label">
            <i class="fa-solid fa-highlighter"></i> 학생 핵심 요약 (AI 답변에서 가장 중요한 내용 요약)
          </label>
          <textarea 
            id="trace-sec-3-summary" 
            class="trace-textarea" 
            placeholder="AI 답변 내용 중 핵심 포인트를 1~2문장으로 읽고 요약해 보세요."
            ${(trace.isSubmitted || !isUnlockedInitially) ? 'disabled' : ''}
          >${trace.studentSummary || ''}</textarea>
        </div>
      </div>

      <!-- 4구역: My Choice (Progressive Disclosure - Disabled until AI requested) -->
      <div id="sec-4-card" class="trace-card sec-4 ${isUnlockedInitially ? 'unlocked-zone' : 'locked-zone'}">
        <div class="zone-lock-overlay ${isUnlockedInitially ? 'hidden' : ''}">
          <i class="fa-solid fa-lock"></i>
          <span>1, 2구역 작성 후 <strong>[AI 답변 요청]</strong>을 완료하면 부드럽게 해제됩니다.</span>
        </div>

        <div class="trace-card-header">
          <div class="sec-step">4</div>
          <div class="sec-title-box">
            <div class="sec-title">My Choice</div>
            <div class="sec-desc">선택 이유 한 문장 작성</div>
          </div>
          <i class="fa-solid fa-scale-balanced" style="color: #10b981; font-size: 1.25rem;"></i>
        </div>
        <textarea 
          id="trace-sec-4" 
          class="trace-textarea" 
          placeholder="AI 답변과 나의 생각을 종합하여, 최종 선택 이유를 명확하게 작성해 보세요."
          ${(trace.isSubmitted || !isUnlockedInitially) ? 'disabled' : ''}
        >${trace.myChoice || ''}</textarea>
      </div>

    </div>

    <!-- Student 10-Point Self-Assessment Rubric Checklist -->
    <div class="self-rubric-card" style="margin-bottom: 1.5rem;">
      <div class="self-rubric-header">
        <div class="self-rubric-title">
          <i class="fa-solid fa-clipboard-check" style="color: #0ea5e9;"></i>
          <h3>학생 자기점검 체크리스트 (10점 만점)</h3>
        </div>
        <div class="self-rubric-score-badge">
          <span>자기점검 점수:</span>
          <strong id="self-score-val">0</strong>
          <span>/ 10점</span>
        </div>
      </div>
      <p class="self-rubric-desc">최종 제출 전 탐구 수행 과정을 스스로 성찰하고 평가 항목을 체크해 주세요.</p>

      <div class="self-rubric-items-grid">
        <label class="self-rubric-checkbox-item">
          <input type="checkbox" id="chk-rubric-1" class="rubric-chk" data-score="3" ${trace.isSubmitted ? 'disabled' : ''} />
          <span class="chk-box-custom"></span>
          <div class="chk-label-text">
            <span class="item-text">1. 내 생각이나 막힌 부분을 구체적으로 적었다.</span>
            <span class="item-pts">(3점)</span>
          </div>
        </label>

        <label class="self-rubric-checkbox-item">
          <input type="checkbox" id="chk-rubric-2" class="rubric-chk" data-score="2" ${trace.isSubmitted ? 'disabled' : ''} />
          <span class="chk-box-custom"></span>
          <div class="chk-label-text">
            <span class="item-text">2. 정답 대신 힌트나 예시를 요청했다.</span>
            <span class="item-pts">(2점)</span>
          </div>
        </label>

        <label class="self-rubric-checkbox-item">
          <input type="checkbox" id="chk-rubric-3" class="rubric-chk" data-score="2" ${trace.isSubmitted ? 'disabled' : ''} />
          <span class="chk-box-custom"></span>
          <div class="chk-label-text">
            <span class="item-text">3. AI 도움을 전체 복사하지 않고 요약했다.</span>
            <span class="item-pts">(2점)</span>
          </div>
        </label>

        <label class="self-rubric-checkbox-item">
          <input type="checkbox" id="chk-rubric-4" class="rubric-chk" data-score="3" ${trace.isSubmitted ? 'disabled' : ''} />
          <span class="chk-box-custom"></span>
          <div class="chk-label-text">
            <span class="item-text">4. 선택한 이유를 내 말로 바꾸어 분명히 적었다.</span>
            <span class="item-pts">(3점)</span>
          </div>
        </label>
      </div>
    </div>

    <!-- Bottom Action Footer Bar -->
    <div class="activity-footer-bar">
      <div class="submit-info">
        <i class="fa-solid fa-circle-info"></i>
        <span>제출 전까지는 1, 2, 4구역 및 핵심 요약 답변을 자유롭게 수정할 수 있습니다.</span>
      </div>

      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
        ${trace.isSubmitted ? `
          <button type="button" id="btn-unlock-edit" class="btn-unlock-edit">
            <i class="fa-solid fa-pen-to-square"></i> 제출 내용 수정하기
          </button>
        ` : ''}

        <button type="button" id="btn-reset-trace" class="btn-unlock-edit" style="border-color: #fda4af; color: #e11d48; background: #fff1f2;">
          <i class="fa-solid fa-trash-can"></i> 새로 작성하기 (초기화)
        </button>

        <button 
          type="button" 
          id="btn-submit-trace" 
          class="btn-submit-trace" 
          ${trace.isSubmitted ? 'disabled' : ''}
        >
          <i class="fa-solid fa-paper-plane"></i>
          <span>${trace.isSubmitted ? '최종 제출 완료' : '사고 흔적 최종 제출 (Code.gs submitTrace)'}</span>
        </button>
      </div>
    </div>
  `;

  // References
  const sec1 = container.querySelector('#trace-sec-1');
  const sec2 = container.querySelector('#trace-sec-2');
  const sec3Card = container.querySelector('#sec-3-card');
  const sec3Ai = container.querySelector('#trace-sec-3-ai');
  const sec3Summary = container.querySelector('#trace-sec-3-summary');
  const sec4Card = container.querySelector('#sec-4-card');
  const sec4 = container.querySelector('#trace-sec-4');

  const btnAskAi = container.querySelector('#btn-ask-ai');
  const askAiText = container.querySelector('#ask-ai-text');
  const btnSubmitTrace = container.querySelector('#btn-submit-trace');
  const readonlyBanner = container.querySelector('#readonly-info-banner');
  const statusBadge = container.querySelector('#activity-status-badge');
  const timerDisplay = container.querySelector('#timer-display');
  const selfScoreValSpan = container.querySelector('#self-score-val');
  const rubricCheckboxes = container.querySelectorAll('.rubric-chk');

  // --- 1. 5-Minute Countdown Timer Logic ---
  let timerInterval = null;
  let remainingSeconds = 300; // 5 minutes

  if (timerEnabled && !trace.isSubmitted) {
    const updateTimerUI = () => {
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      if (timerDisplay) {
        timerDisplay.innerText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        if (remainingSeconds <= 60) {
          timerDisplay.classList.add('warning-time');
        }
      }
    };

    updateTimerUI();

    timerInterval = setInterval(() => {
      remainingSeconds--;
      if (remainingSeconds <= 0) {
        remainingSeconds = 0;
        updateTimerUI();
        clearInterval(timerInterval);
        if (window.showToast) {
          window.showToast('제출 시간(5분)이 만료되었습니다. 작성하신 사고 흔적을 바로 제출해 주세요!', 'info');
        }
      } else {
        updateTimerUI();
      }
    }, 1000);
  }

  // --- 2. Self-Assessment Rubric Score Calculation ---
  const calculateSelfScore = () => {
    let sum = 0;
    rubricCheckboxes.forEach(chk => {
      if (chk.checked) {
        sum += parseInt(chk.getAttribute('data-score')) || 0;
      }
    });
    if (selfScoreValSpan) {
      selfScoreValSpan.innerText = sum;
    }
    return sum;
  };

  // Pre-check checkboxes based on saved selfScore or default logic
  const savedSelfScore = trace.selfScore || 0;
  if (savedSelfScore >= 10 || (!trace.isSubmitted && savedSelfScore === 0)) {
    // Default check all if clean or full score
    rubricCheckboxes.forEach(chk => chk.checked = true);
  } else {
    // Check based on target score matching
    let tempSum = 0;
    rubricCheckboxes.forEach(chk => {
      const pts = parseInt(chk.getAttribute('data-score')) || 0;
      if (tempSum + pts <= savedSelfScore) {
        chk.checked = true;
        tempSum += pts;
      }
    });
  }
  calculateSelfScore();

  rubricCheckboxes.forEach(chk => {
    chk.addEventListener('change', calculateSelfScore);
  });

  // Auto-resize helper function
  const autoResize = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.max(110, el.scrollHeight) + 'px';
  };

  const applyAutoResizeAll = () => {
    [sec1, sec2, sec3Summary, sec4].forEach(autoResize);
  };

  // Auto-sync typing changes to store & auto-expand textareas
  const syncToStore = () => {
    store.updateThinkingTrace({
      beforeAi: sec1.value,
      myQuestion: sec2.value,
      studentSummary: sec3Summary.value,
      myChoice: sec4.value,
      selfScore: calculateSelfScore()
    });
  };

  sec1.addEventListener('input', () => { syncToStore(); autoResize(sec1); });
  sec2.addEventListener('input', () => { syncToStore(); autoResize(sec2); });
  sec3Summary.addEventListener('input', () => { syncToStore(); autoResize(sec3Summary); });
  sec4.addEventListener('input', () => { syncToStore(); autoResize(sec4); });

  setTimeout(applyAutoResizeAll, 100);

  // --- 3. Handle API 1: askAi & Progressive Disclosure Unlock ---
  btnAskAi.addEventListener('click', async () => {
    const beforeAiVal = sec1.value.trim();
    const myQuestionVal = sec2.value.trim();

    if (!beforeAiVal) {
      window.showToast('1구역(Before AI) 내용을 작성해 주세요.', 'error');
      sec1.focus();
      return;
    }

    if (!myQuestionVal) {
      window.showToast('2구역(My Question) 질문을 작성해 주세요.', 'error');
      sec2.focus();
      return;
    }

    btnAskAi.disabled = true;
    askAiText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Apps Script AI 분석 중...';

    try {
      const aiReply = await api.askAi(beforeAiVal, myQuestionVal, assignment);
      sec3Ai.innerHTML = aiReply.replace(/\n/g, '<br>');
      store.setAiResponse(aiReply);

      // --- Progressive Disclosure: Smooth Unlock Animation ---
      [sec3Card, sec4Card].forEach(card => {
        card.classList.remove('locked-zone');
        card.classList.add('unlocked-zone', 'anim-unlock');
        const overlay = card.querySelector('.zone-lock-overlay');
        if (overlay) overlay.classList.add('hidden');
      });

      sec3Summary.disabled = false;
      sec4.disabled = false;

      applyAutoResizeAll();
      window.showToast('AI 답변이 3구역에 수신되었으며 3, 4구역이 해제되었습니다!', 'success');
    } catch (err) {
      window.showToast('AI 답변 요청 중 에러가 발생했습니다.', 'error');
    } finally {
      btnAskAi.disabled = false;
      askAiText.innerText = 'AI 답변 다시 요청 (Code.gs askAi)';
    }
  });

  // --- 4. Handle API 2: submitTrace ---
  btnSubmitTrace.addEventListener('click', async () => {
    syncToStore();
    const currentTrace = store.getThinkingTrace();
    const finalSelfScore = calculateSelfScore();

    if (!sec1.value.trim() || !sec2.value.trim()) {
      window.showToast('1구역 및 2구역을 작성해 주세요.', 'error');
      return;
    }

    if (!currentTrace.aiSupport) {
      window.showToast('2구역 작성 후 [AI 답변 요청]을 진행해 주세요.', 'error');
      return;
    }

    if (!sec4.value.trim()) {
      window.showToast('4구역(My Choice) 선택 이유를 작성해 주세요.', 'error');
      sec4.focus();
      return;
    }

    if (timerInterval) clearInterval(timerInterval);

    btnSubmitTrace.disabled = true;
    btnSubmitTrace.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 백엔드 전송 중...';

    try {
      await api.submitTrace(user, {
        beforeAi: sec1.value,
        myQuestion: sec2.value,
        aiSupport: currentTrace.aiSupport,
        studentSummary: sec3Summary.value,
        myChoice: sec4.value,
        selfScore: finalSelfScore
      });

      store.markSubmitted(finalSelfScore);

      // Lock forms (Read-only)
      sec1.disabled = true;
      sec2.disabled = true;
      sec3Summary.disabled = true;
      sec4.disabled = true;
      btnAskAi.disabled = true;
      rubricCheckboxes.forEach(chk => chk.disabled = true);

      readonlyBanner.classList.remove('hidden');
      readonlyBanner.style.display = 'flex';
      statusBadge.className = 'status-badge submitted';
      statusBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>최종 제출 완료</span>';
      
      btnSubmitTrace.innerHTML = '<i class="fa-solid fa-check-double"></i> <span>최종 제출 완료</span>';

      window.showToast('사고 흔적 및 자기점검 점수가 백엔드 구글 시트에 제출되었습니다!', 'success');

      setTimeout(() => {
        window.location.reload();
      }, 600);

    } catch (err) {
      window.showToast('제출 처리 중 에러가 발생했습니다.', 'error');
      btnSubmitTrace.disabled = false;
      btnSubmitTrace.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span>사고 흔적 최종 제출</span>';
    }
  });

  // Handle Unlock Edit
  const btnUnlock = container.querySelector('#btn-unlock-edit');
  if (btnUnlock) {
    btnUnlock.addEventListener('click', () => {
      store.unlockSubmissionForEdit();
      window.showToast('수정 모드로 전환되었습니다. 작성 후 다시 최종 제출하세요.', 'info');
      window.location.reload();
    });
  }

  // Handle Reset Trace (Clear)
  const btnResetTrace = container.querySelector('#btn-reset-trace');
  if (btnResetTrace) {
    btnResetTrace.addEventListener('click', () => {
      if (confirm('작성 중인 모든 사고 흔적(1~4구역)을 삭제하고 새로 작성하시겠습니까?')) {
        if (timerInterval) clearInterval(timerInterval);
        store.resetThinkingTrace();
        window.showToast('사고 흔적이 깔끔하게 초기화되었습니다.', 'info');
        window.location.reload();
      }
    });
  }

  return container;
}
