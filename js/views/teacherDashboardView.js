/**
 * Thinking Trace - Teacher Dashboard View (Per-Teacher Apps Script URL, Timer Control & Side-by-Side View)
 */

import { store } from '../store.js';
import { api } from '../api.js';

export function renderTeacherDashboardView() {
  const assignments = store.getAssignments();
  const activeAss = store.getActiveAssignment();
  let selectedTabId = activeAss.id;

  const container = document.createElement('div');
  container.className = 'dashboard-container';

  function renderView() {
    const currentSelectedAss = assignments.find(a => a.id === selectedTabId) || activeAss;
    const isNewMode = selectedTabId === 'new';
    const submissions = store.getSubmissions(isNewMode ? 'none' : selectedTabId);

    container.innerHTML = `
      <!-- Dashboard Title -->
      <div class="dashboard-title">
        <h1><i class="fa-solid fa-chalkboard-user"></i> 교사 과제 출제 및 루브릭 채점 대시보드</h1>
        <p style="color: #cbd5e1; margin-top: 0.25rem;">
          과제별로 탭을 구분하여 탐구 과제를 출제하고 학생 제출 자료를 분리하여 루브릭으로 평가합니다.
        </p>
      </div>

      <!-- 1. 개별 구글 시트 Apps Script 연동 설정 Card (타 사용자 배포용) -->
      <div class="table-card" style="border-left: 6px solid #0ea5e9; margin-bottom: 1.25rem;">
        <div class="table-header-row">
          <h3><i class="fa-solid fa-plug-circle-bolt" style="color: #0ea5e9;"></i> 개별 구글 시트 Apps Script 연동 설정</h3>
          <span class="badge" style="background: #e0f2fe; color: #0369a1; font-weight: 700;">
            <i class="fa-solid fa-link"></i> 타 교사/사용자 개별 시트 배포 가능
          </span>
        </div>
        <p class="text-desc" style="margin-bottom: 0.85rem;">
          본인의 구글 시트 <strong>Apps Script 웹 앱 URL</strong>을 연결하면 학생들의 제출 자료가 선생님 본인의 개인 구글 시트 탭으로 저장됩니다.
        </p>
        <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
          <input 
            type="url" 
            id="teacher-apps-script-url" 
            class="trace-textarea" 
            style="min-height: 46px; flex: 1; font-size: 0.9rem;" 
            value="${store.getAppsScriptUrl()}" 
            placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec" 
          />
          <button type="button" id="btn-save-teacher-url" class="btn btn-student" style="max-width: 180px; padding: 0.75rem 1rem;">
            <i class="fa-solid fa-floppy-disk"></i> 연동 URL 저장
          </button>
        </div>
      </div>

      <!-- 2. 과제 탭 구분 바 (Assignment Tabs) -->
      <div class="assignment-tabs-bar" style="margin-bottom: 1.25rem;">
        <div class="tab-list">
          ${assignments.map((ass, idx) => `
            <button 
              type="button" 
              class="ass-tab-btn ${ass.id === selectedTabId ? 'active' : ''}" 
              data-id="${ass.id}"
            >
              <i class="fa-solid fa-book-bookmark"></i>
              <span>과제 ${assignments.length - idx}: ${truncate(ass.unit || ass.subject, 18)}</span>
              ${ass.id === store.getActiveAssignment().id ? '<span class="active-badge">학생 화면 배포 중</span>' : ''}
            </button>
          `).join('')}

          <button type="button" class="ass-tab-btn new-ass-btn ${selectedTabId === 'new' ? 'active' : ''}" data-id="new">
            <i class="fa-solid fa-plus-circle"></i> + 새 과제 출제
          </button>
        </div>
      </div>

      <!-- 과제 출제 / 관리 Card -->
      <div class="table-card" style="border-left: 6px solid #8b5cf6;">
        <div class="table-header-row">
          <h3>
            <i class="fa-solid fa-file-pen" style="color: #8b5cf6;"></i>
            ${isNewMode ? '신규 과제 출제 폼' : `과제 정보: [${currentSelectedAss.subject}] ${currentSelectedAss.unit}`}
          </h3>
          ${!isNewMode ? `
            <button type="button" id="btn-set-active" class="btn-unlock-edit" style="background: #f3e8ff; color: #7e22ce; border-color: #c084fc;">
              <i class="fa-solid fa-circle-check"></i> ${currentSelectedAss.id === store.getActiveAssignment().id ? '현재 학생 화면 배포 중' : '이 과제를 학생 화면에 배포하기'}
            </button>
          ` : ''}
        </div>

        <form id="form-create-assignment" class="assignment-form">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label for="ass-subject"><i class="fa-solid fa-book-bookmark"></i> 1. 교과목 입력</label>
              <input type="text" id="ass-subject" value="${isNewMode ? '' : (currentSelectedAss.subject || '')}" placeholder="예: 기술과 발명, 과학" required />
            </div>
            <div class="form-group">
              <label for="ass-unit"><i class="fa-solid fa-layer-group"></i> 2. 단원명 입력 (구글 시트 탭 이름으로 사용)</label>
              <input type="text" id="ass-unit" value="${isNewMode ? '' : (currentSelectedAss.unit || '')}" placeholder="예: 발명과 특허, 탄소세_도입" required />
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label for="ass-prompt"><i class="fa-solid fa-circle-question"></i> 3. 학생들이 수행할 과제/질문 입력</label>
            <textarea id="ass-prompt" class="trace-textarea" style="min-height: 80px;" placeholder="학생들이 4단계 사고 흔적을 통해 해결할 핵심 탐구 질문을 입력하세요." required>${isNewMode ? '' : (currentSelectedAss.prompt || '')}</textarea>
          </div>

          <!-- Timer Control Option (Requirement 1) -->
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label for="ass-timer-enabled" style="cursor: pointer; display: inline-flex; align-items: center; gap: 0.6rem; user-select: none; background: #f8fafc; padding: 0.65rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; width: 100%;">
              <input type="checkbox" id="ass-timer-enabled" style="width: 18px; height: 18px; cursor: pointer;" ${isNewMode || currentSelectedAss.timerEnabled !== false ? 'checked' : ''} />
              <span style="font-size: 0.9rem; color: #1e293b;">
                <i class="fa-solid fa-stopwatch" style="color: #0ea5e9;"></i>
                <strong>5분 타이머 작동 (ON/OFF 제어)</strong> — 켜면 학생 화면에 5분 카운트다운 타이머가 표시되고, 끄면 숨겨집니다(Disabled).
              </span>
            </label>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div class="sheet-tab-notice" style="font-size: 0.85rem; color: #64748b;">
              <i class="fa-solid fa-table-cells"></i> 구글 시트 탭 이름: <strong>[${isNewMode ? '단원명 입력시 생성' : (currentSelectedAss.sheetName || '사고흔적')}]</strong>
            </div>

            <!-- Form Action Buttons Bar -->
            <div style="display: flex; gap: 0.65rem; flex-wrap: wrap;">
              <button type="button" id="btn-save-as-new-ass" class="btn-submit-trace" style="font-size: 0.9rem; padding: 0.75rem 1.25rem; background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%);">
                <i class="fa-solid fa-floppy-disk"></i> 💾 다른 이름으로 저장 (새 과제 출제)
              </button>

              <button type="submit" class="btn btn-teacher" style="max-width: 200px; padding: 0.75rem 1.25rem;">
                <i class="fa-solid fa-paper-plane"></i> ${isNewMode ? '새 과제 출제 및 배포' : '과제 내용 수정'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Summary Metrics for Selected Assignment -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon blue"><i class="fa-solid fa-users"></i></div>
          <div>
            <div class="metric-val">${submissions.length}명</div>
            <div class="metric-label">현재 과제 제출 학생</div>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon green"><i class="fa-solid fa-square-poll-vertical"></i></div>
          <div>
            <div class="metric-val">20점</div>
            <div class="metric-label">루브릭 만점 기준</div>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon purple"><i class="fa-solid fa-clipboard-check"></i></div>
          <div>
            <div class="metric-val">${submissions.filter(s => s.rubric && s.rubric.teacherScore > 0).length}명</div>
            <div class="metric-label">교사 채점 완료</div>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon amber"><i class="fa-solid fa-table"></i></div>
          <div>
            <div class="metric-val" style="font-size: 0.9rem;">시트 탭: ${currentSelectedAss.sheetName || '사고흔적'}</div>
            <div class="metric-label">백엔드 구글 시트 탭</div>
          </div>
        </div>
      </div>

      <!-- 3. 학생 제출 자료 과제별 분리 현황 Table -->
      <div class="table-card">
        <div class="table-header-row">
          <h3>
            <i class="fa-solid fa-list-check"></i> 
            [${currentSelectedAss.unit || '전체'}] 과제 제출 현황 (${submissions.length}건)
          </h3>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button id="btn-reset-sheet" class="btn-unlock-edit" style="border-color: #fda4af; color: #e11d48; background: #fff1f2;">
              <i class="fa-solid fa-broom"></i> 🧹 백엔드 시트 제출자료 리셋
            </button>
            <button id="btn-refresh-list" class="btn-unlock-edit">
              <i class="fa-solid fa-rotate-right"></i> 목록 새로고침
            </button>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table class="custom-table">
            <thead>
              <tr>
                <th>학번</th>
                <th>이름</th>
                <th>1구역 (Before AI)</th>
                <th>2구역 (My Question)</th>
                <th>3구역 요약</th>
                <th>4구역 (My Choice)</th>
                <th>자기점검(10)</th>
                <th>교사평가(10)</th>
                <th>총점(20)</th>
                <th>채점하기</th>
              </tr>
            </thead>
            <tbody>
              ${submissions.length > 0 ? submissions.map((sub, idx) => {
                const rubric = sub.rubric || { selfScore: 10, teacherScore: 0, totalScore: 10 };
                const isGraded = rubric.teacherScore > 0;
                return `
                  <tr>
                    <td><strong>${sub.studentId}</strong></td>
                    <td>${sub.name}</td>
                    <td>${truncate(sub.beforeAi, 20)}</td>
                    <td>${truncate(sub.myQuestion, 20)}</td>
                    <td>${truncate(sub.studentSummary || sub.aiSupport, 20)}</td>
                    <td>${truncate(sub.myChoice, 20)}</td>
                    <td><span class="badge" style="background:#e0f2fe; color:#0369a1;">${rubric.selfScore}점</span></td>
                    <td><span class="badge ${isGraded ? 'badge-success' : ''}" style="${isGraded ? '' : 'background:#fef3c7; color:#b45309;'}">${rubric.teacherScore}점</span></td>
                    <td><strong style="color:${isGraded ? '#15803d' : '#475569'}; font-size:1rem;">${rubric.totalScore} / 20점</strong></td>
                    <td>
                      <button class="btn-demo open-rubric-btn" data-index="${idx}">
                        <i class="fa-solid fa-pen-ruler"></i> ${isGraded ? '채점 수정' : '채점 하기'}
                      </button>
                    </td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="10" style="text-align: center; padding: 2rem; color: #94a3b8;">
                    <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                    이 과제에 제출된 학생 사고 흔적이 아직 없습니다.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 20-Point Rubric Grading Modal with Side-by-Side Comparison -->
      <div id="rubric-modal" class="modal-backdrop hidden">
        <div class="modal-card" style="max-width: 860px;">
          <div class="modal-header">
            <h3 id="rubric-student-name"><i class="fa-solid fa-pen-ruler"></i> 20점 만점 루브릭 채점표</h3>
            <button id="btn-close-rubric" class="btn-icon"><i class="fa-solid fa-xmark"></i></button>
          </div>
          
          <div class="modal-body">
            <!-- Side-by-Side Thought Shift Comparison Box (Requirement 4) -->
            <div class="rubric-preview-box">
              <h4 style="margin-bottom: 0.65rem; color: #0f172a; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fa-solid fa-right-left" style="color: #6366f1;"></i>
                <span>학생 사고 변화 Side-by-Side 비교 뷰 (AI 탐구 전 vs 후)</span>
              </h4>
              <div id="rubric-preview-content"></div>
            </div>

            <form id="form-rubric-grade" style="margin-top: 1.25rem;">
              <input type="hidden" id="rubric-student-id" />

              <div class="rubric-score-row">
                <div class="rubric-label-box">
                  <label for="rubric-self-score">
                    <strong>1. 학생 자기점검 평가 (10점 만점)</strong>
                    <div class="rubric-desc">학생 스스로 수행한 자기점검 체크리스트 결과 점수</div>
                  </label>
                </div>
                <div class="rubric-input-box">
                  <input type="number" id="rubric-self-score" min="0" max="10" value="10" class="score-input" required />
                  <span class="score-unit">/ 10점</span>
                </div>
              </div>

              <div class="rubric-score-row" style="margin-top: 1rem;">
                <div class="rubric-label-box">
                  <label for="rubric-teacher-score">
                    <strong>2. 교사 확인 평가 (10점 만점)</strong>
                    <div class="rubric-desc">4구역 비판적 선택(My Choice)의 타당성 및 논리성 평가</div>
                  </label>
                </div>
                <div class="rubric-input-box">
                  <input type="number" id="rubric-teacher-score" min="0" max="10" value="10" class="score-input" required />
                  <span class="score-unit">/ 10점</span>
                </div>
              </div>

              <div class="rubric-total-box">
                <span>최종 총점:</span>
                <strong id="rubric-total-val">20</strong>
                <span>/ 20점</span>
              </div>

              <div class="form-group" style="margin-top: 1rem;">
                <label for="rubric-feedback"><i class="fa-solid fa-comment-dots"></i> 교사 피드백 및 총평</label>
                <textarea id="rubric-feedback" class="trace-textarea" style="min-height: 80px;" placeholder="학생의 비판적 사고 성장에 도움이 되는 피드백을 작성해 주세요."></textarea>
              </div>

              <div class="modal-footer" style="padding-right: 0; padding-bottom: 0;">
                <button type="submit" class="btn btn-teacher">
                  <i class="fa-solid fa-check"></i> 채점 완료 및 피드백 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    // Save Teacher Custom Apps Script URL
    container.querySelector('#btn-save-teacher-url').addEventListener('click', () => {
      const url = container.querySelector('#teacher-apps-script-url').value;
      store.setAppsScriptUrl(url);
      window.showToast('선생님 개인 구글 시트 연동 URL이 저장되었습니다!', 'success');
    });

    // Attach Assignment Tab Events
    container.querySelectorAll('.ass-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        selectedTabId = id;
        renderView();
      });
    });

    // Set Active Assignment Button Event
    const btnSetActive = container.querySelector('#btn-set-active');
    if (btnSetActive) {
      btnSetActive.addEventListener('click', () => {
        store.setActiveAssignment(currentSelectedAss.id);
        window.showToast(`[${currentSelectedAss.unit}] 과제가 학생 화면에 배포되었습니다!`, 'success');
        renderView();
      });
    }

    // Reset Backend Sheet Submissions Data
    const btnResetSheet = container.querySelector('#btn-reset-sheet');
    if (btnResetSheet) {
      btnResetSheet.addEventListener('click', async () => {
        if (confirm(`[${currentSelectedAss.unit}] 과제의 백엔드 구글 시트 및 대시보드 제출 자료를 모두 초기화(리셋)하시겠습니까?`)) {
          await api.resetSheet(currentSelectedAss.sheetName);
          store.clearSubmissionsForAssignment(currentSelectedAss.id);
          window.showToast(`[${currentSelectedAss.unit}] 과제 제출 자료가 리셋되었습니다.`, 'info');
          renderView();
        }
      });
    }

    // Save as New Assignment (다른 이름으로 저장)
    container.querySelector('#btn-save-as-new-ass').addEventListener('click', () => {
      const subject = container.querySelector('#ass-subject').value;
      const unit = container.querySelector('#ass-unit').value;
      const prompt = container.querySelector('#ass-prompt').value;
      const timerEnabled = container.querySelector('#ass-timer-enabled').checked;

      if (!subject || !unit || !prompt) {
        window.showToast('교과목, 단원명, 과제 질문을 모두 입력해주세요.', 'error');
        return;
      }

      const newAss = store.createAssignment(subject, unit, prompt, timerEnabled);
      selectedTabId = newAss.id;
      window.showToast(`새 과제 [${unit}]로 저장되고 학생 화면에 배포되었습니다!`, 'success');
      renderView();
    });

    // Update Assignment Form Submit Event
    container.querySelector('#form-create-assignment').addEventListener('submit', (e) => {
      e.preventDefault();
      const subject = container.querySelector('#ass-subject').value;
      const unit = container.querySelector('#ass-unit').value;
      const prompt = container.querySelector('#ass-prompt').value;
      const timerEnabled = container.querySelector('#ass-timer-enabled').checked;

      if (isNewMode) {
        const newAss = store.createAssignment(subject, unit, prompt, timerEnabled);
        selectedTabId = newAss.id;
        window.showToast(`새 과제 [${unit}]가 출제되고 실시간 배포되었습니다!`, 'success');
      } else {
        currentSelectedAss.subject = subject.trim();
        currentSelectedAss.unit = unit.trim();
        currentSelectedAss.prompt = prompt.trim();
        currentSelectedAss.timerEnabled = timerEnabled;
        currentSelectedAss.sheetName = unit.trim().replace(/[\/\?\\*\:\[\]]/g, '_').substring(0, 30);
        store.setActiveAssignment(currentSelectedAss.id);
        window.showToast(`과제 [${unit}] 내용 및 타이머 설정이 수정/배포되었습니다!`, 'success');
      }
      renderView();
    });

    // Refresh Table
    container.querySelector('#btn-refresh-list').addEventListener('click', () => {
      renderView();
    });

    // Rubric Modal Logic & Side-by-Side Render
    const rubricModal = container.querySelector('#rubric-modal');
    const btnCloseRubric = container.querySelector('#btn-close-rubric');
    const selfScoreInput = container.querySelector('#rubric-self-score');
    const teacherScoreInput = container.querySelector('#rubric-teacher-score');
    const totalValSpan = container.querySelector('#rubric-total-val');

    const updateTotal = () => {
      const s = parseInt(selfScoreInput.value) || 0;
      const t = parseInt(teacherScoreInput.value) || 0;
      totalValSpan.innerText = Math.min(20, Math.max(0, s + t));
    };

    selfScoreInput.addEventListener('input', updateTotal);
    teacherScoreInput.addEventListener('input', updateTotal);

    container.querySelectorAll('.open-rubric-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.currentTarget.getAttribute('data-index');
        const item = submissions[idx];
        if (!item) return;

        container.querySelector('#rubric-student-id').value = item.studentId;
        container.querySelector('#rubric-student-name').innerText = `${item.studentId} ${item.name} 학생 루브릭 채점`;
        
        // Render Side-by-Side Comparison Layout
        container.querySelector('#rubric-preview-content').innerHTML = `
          <div class="side-by-side-grid">
            <div class="side-box before-ai-box">
              <div class="side-box-header">
                <span class="step-badge sec-1">1구역</span>
                <strong>Before AI (탐구 전 초기 생각)</strong>
              </div>
              <div class="side-box-content">${item.beforeAi ? item.beforeAi.replace(/\n/g, '<br>') : '<span class="text-muted">내용 없음</span>'}</div>
            </div>

            <div class="side-box my-choice-box">
              <div class="side-box-header">
                <span class="step-badge sec-4">4구역</span>
                <strong>My Choice (AI 탐구 후 최종 선택 및 이유)</strong>
              </div>
              <div class="side-box-content">${item.myChoice ? item.myChoice.replace(/\n/g, '<br>') : '<span class="text-muted">내용 없음</span>'}</div>
            </div>
          </div>

          <details class="trace-details-accordion" style="margin-top: 0.85rem;">
            <summary style="cursor: pointer; font-size: 0.85rem; font-weight: 700; color: #475569; user-select: none;">
              <i class="fa-solid fa-chevron-down"></i> 2구역(질문) 및 3구역(AI 답변 요약) 보기
            </summary>
            <div class="details-content" style="margin-top: 0.5rem; font-size: 0.85rem; line-height: 1.5; color: #334155; background: #ffffff; padding: 0.85rem; border-radius: 8px; border: 1px solid #cbd5e1;">
              <p><strong>2구역 (My Question):</strong> ${item.myQuestion || '-'}</p>
              <p style="margin-top: 0.4rem;"><strong>3구역 (AI 답변 요약):</strong> ${item.studentSummary || item.aiSupport || '-'}</p>
            </div>
          </details>
        `;

        const rubric = item.rubric || { selfScore: 10, teacherScore: 10, teacherFeedback: '' };
        selfScoreInput.value = rubric.selfScore;
        teacherScoreInput.value = rubric.teacherScore || 10;
        container.querySelector('#rubric-feedback').value = rubric.teacherFeedback || '';
        updateTotal();

        rubricModal.classList.remove('hidden');
      });
    });

    btnCloseRubric.addEventListener('click', () => {
      rubricModal.classList.add('hidden');
    });

    container.querySelector('#form-rubric-grade').addEventListener('submit', (e) => {
      e.preventDefault();
      const studentId = container.querySelector('#rubric-student-id').value;
      const selfScore = parseInt(selfScoreInput.value) || 0;
      const teacherScore = parseInt(teacherScoreInput.value) || 0;
      const feedback = container.querySelector('#rubric-feedback').value;

      store.gradeSubmission(studentId, currentSelectedAss.id, {
        selfScore: selfScore,
        teacherScore: teacherScore,
        teacherFeedback: feedback
      });

      rubricModal.classList.add('hidden');
      window.showToast(`${studentId} 학생의 루브릭 채점이 저장되었습니다!`, 'success');
      renderView();
    });
  }

  function truncate(str, len) {
    if (!str) return '-';
    return str.length > len ? str.substring(0, len) + '...' : str;
  }

  renderView();
  return container;
}
