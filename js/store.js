/**
 * Thinking Trace - Global Reactive Store (Multi-Assignment & Sheet Tab Isolation)
 */

const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw1f7WUZIWjhdWOY1ANTfv7rupHM8cU90FwdBI7kh4sZj7YUSr2WCNuL6FGJojn3Rs_/exec';

class Store extends EventTarget {
  constructor() {
    super();
    
    if (!localStorage.getItem('tt_apps_script_url')) {
      localStorage.setItem('tt_apps_script_url', DEFAULT_APPS_SCRIPT_URL);
    }

    const activeUser = JSON.parse(localStorage.getItem('tt_user') || 'null');
    
    // Default Assignments Pool
    const defaultAssignments = [
      {
        id: 'ass_1',
        subject: '기술과 발명',
        unit: '발명과 특허',
        prompt: '특허 출원 단계에 대해 설명할 수 있다.',
        sheetName: '발명과_특허',
        timerEnabled: true,
        createdAt: '2026-07-20'
      },
      {
        id: 'ass_2',
        subject: '인공지능과 정보윤리',
        unit: '2단원. AI 생성물과 지식재산권',
        prompt: '인공지능(AI)이 창작한 예술 작품 및 글의 저작권은 누구에게 인정되어야 하는가?',
        sheetName: 'AI생성물과_지식재산권',
        timerEnabled: false,
        createdAt: '2026-07-20'
      }
    ];

    const savedAssignments = JSON.parse(localStorage.getItem('tt_assignments') || 'null');
    const assignments = savedAssignments && savedAssignments.length > 0 ? savedAssignments : defaultAssignments;
    const activeAssignmentId = localStorage.getItem('tt_active_assignment_id') || assignments[0].id;

    // Load initial student trace isolated by studentId AND activeAssignmentId
    let initialTrace = {
      beforeAi: '',
      myQuestion: '',
      aiSupport: '',
      studentSummary: '',
      myChoice: '',
      selfScore: 0,
      isSubmitted: false,
      submittedAt: null
    };

    if (activeUser && activeUser.role === 'student' && activeUser.studentId) {
      const saved = localStorage.getItem(`tt_trace_${activeUser.studentId}_${activeAssignmentId}`);
      if (saved) {
        try { initialTrace = JSON.parse(saved); } catch(e) {}
      }
    }

    this.state = {
      user: activeUser,
      appsScriptUrl: localStorage.getItem('tt_apps_script_url') || DEFAULT_APPS_SCRIPT_URL,
      assignments: assignments,
      activeAssignmentId: activeAssignmentId,
      thinkingTrace: initialTrace,
      submissions: JSON.parse(localStorage.getItem('tt_all_submissions') || '[]')
    };

    // Pre-populate demo submissions categorized by assignmentId
    if (this.state.submissions.length === 0) {
      this.state.submissions = [
        { 
          assignmentId: 'ass_1',
          sheetName: '발명과_특허',
          studentId: '1103', 
          name: '성춘', 
          beforeAi: '스프로킷 전동 방식이 아닌 전동기를 이용한 기어 방식을 자전거 구조에 활용.', 
          myQuestion: '특허 출원 단계 순서는 어떻게 되는가?', 
          aiSupport: '[AI 튜터 피드백]\n1. 발명 작성 2. 선행기술 조사 3. 출원서 제출 4. 심사 청구.', 
          studentSummary: '선행기술 조사 후 특허청에 출원서를 전송하는 절차가 핵심이다.',
          myChoice: '기존 특허와의 차별성을 입증하는 명세서 작성이 가장 중요하다.', 
          submittedAt: '2026-07-20 19:00:48',
          rubric: { selfScore: 10, teacherScore: 10, totalScore: 20, teacherFeedback: '특허 출원 핵심 단계를 잘 파악함.' }
        },
        { 
          assignmentId: 'ass_2',
          sheetName: 'AI생성물과_지식재산권',
          studentId: '10101', 
          name: '김민수', 
          beforeAi: '인공지능이 인간의 창의성을 대체할 수 있다고 생각한다.', 
          myQuestion: '인공지능 예술 작품의 저작권은 누구에게 귀속되는가?', 
          aiSupport: '[AI 튜터 피드백]\n현행 저작권법은 인간의 창작물만을 인정하고 있습니다.', 
          studentSummary: 'AI는 저작권 주체가 될 수 없으며 기여한 인간에게 권리가 간다.',
          myChoice: 'AI는 도구일 뿐 최종 창의적 선택을 한 인간에게 저작권을 부여해야 한다.', 
          submittedAt: '2026-07-20 14:30',
          rubric: { selfScore: 9, teacherScore: 10, totalScore: 19, teacherFeedback: '법적 한계와 인간의 역할을 명확히 파악함.' }
        }
      ];
      this.saveSubmissions();
    }
  }

  // User Authentication
  loginStudent(studentId, name, password) {
    const cleanId = studentId.trim();
    const user = {
      role: 'student',
      studentId: cleanId,
      name: name.trim(),
      password: password,
      loginAt: new Date().toISOString()
    };
    this.state.user = user;
    localStorage.setItem('tt_user', JSON.stringify(user));
    this.loadTraceForCurrentStudent();

    this.dispatchEvent(new CustomEvent('authChange', { detail: user }));
    return user;
  }

  loginTeacher(email, password) {
    const user = {
      role: 'teacher',
      email: email.trim(),
      name: email.split('@')[0] + ' 선생님',
      password: password,
      loginAt: new Date().toISOString()
    };
    this.state.user = user;
    localStorage.setItem('tt_user', JSON.stringify(user));
    this.resetThinkingTrace();
    this.dispatchEvent(new CustomEvent('authChange', { detail: user }));
    return user;
  }

  loadTraceForCurrentStudent() {
    if (this.state.user && this.state.user.studentId) {
      const key = `tt_trace_${this.state.user.studentId}_${this.state.activeAssignmentId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          this.state.thinkingTrace = JSON.parse(saved);
          return;
        } catch (e) {}
      }
    }
    this.resetThinkingTrace();
  }

  resetThinkingTrace() {
    this.state.thinkingTrace = {
      beforeAi: '',
      myQuestion: '',
      aiSupport: '',
      studentSummary: '',
      myChoice: '',
      selfScore: 0,
      isSubmitted: false,
      submittedAt: null
    };

    if (this.state.user && this.state.user.studentId) {
      const key = `tt_trace_${this.state.user.studentId}_${this.state.activeAssignmentId}`;
      localStorage.removeItem(key);
    }

    this.dispatchEvent(new CustomEvent('traceChange', { detail: this.state.thinkingTrace }));
  }

  logout() {
    this.state.user = null;
    localStorage.removeItem('tt_user');
    this.resetThinkingTrace();
    this.dispatchEvent(new CustomEvent('authChange', { detail: null }));
  }

  getUser() { return this.state.user; }
  isAuthenticated() { return !!this.state.user; }
  getRole() { return this.state.user ? this.state.user.role : null; }

  // Assignment Management (Teacher Workflow)
  getAssignments() { return this.state.assignments; }
  
  getActiveAssignment() {
    return this.state.assignments.find(a => a.id === this.state.activeAssignmentId) || this.state.assignments[0];
  }

  setActiveAssignment(assignmentId) {
    this.state.activeAssignmentId = assignmentId;
    localStorage.setItem('tt_active_assignment_id', assignmentId);
    this.loadTraceForCurrentStudent();
    this.dispatchEvent(new CustomEvent('assignmentChange', { detail: this.getActiveAssignment() }));
  }

  createAssignment(subject, unit, prompt, timerEnabled = true) {
    const id = 'ass_' + Date.now();
    const cleanUnit = unit.trim().replace(/[\/\?\\*\:\[\]]/g, '_').substring(0, 30) || ('과제_' + id);
    const newAss = {
      id: id,
      subject: subject.trim(),
      unit: unit.trim(),
      prompt: prompt.trim(),
      sheetName: cleanUnit,
      timerEnabled: Boolean(timerEnabled),
      createdAt: new Date().toLocaleDateString('ko-KR')
    };

    this.state.assignments.unshift(newAss);
    this.state.activeAssignmentId = id;

    localStorage.setItem('tt_assignments', JSON.stringify(this.state.assignments));
    localStorage.setItem('tt_active_assignment_id', id);

    this.loadTraceForCurrentStudent();
    this.dispatchEvent(new CustomEvent('assignmentChange', { detail: newAss }));
    return newAss;
  }

  // Thinking Trace Actions (Per Student & Assignment Isolated)
  updateThinkingTrace(data) {
    this.state.thinkingTrace = {
      ...this.state.thinkingTrace,
      ...data
    };

    if (this.state.user && this.state.user.role === 'student' && this.state.user.studentId) {
      const key = `tt_trace_${this.state.user.studentId}_${this.state.activeAssignmentId}`;
      localStorage.setItem(key, JSON.stringify(this.state.thinkingTrace));
    }

    this.dispatchEvent(new CustomEvent('traceChange', { detail: this.state.thinkingTrace }));
  }

  setAiResponse(aiResponseText) {
    this.updateThinkingTrace({ aiSupport: aiResponseText });
  }

  markSubmitted(selfScore = 10) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const submittedAt = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. ${now.getHours() >= 12 ? '오후' : '오전'} ${now.getHours() % 12 || 12}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const activeAss = this.getActiveAssignment();

    this.updateThinkingTrace({
      selfScore: selfScore,
      isSubmitted: true,
      submittedAt: submittedAt
    });

    if (this.state.user && this.state.user.role === 'student') {
      const newSubmission = {
        assignmentId: activeAss.id,
        sheetName: activeAss.sheetName,
        studentId: this.state.user.studentId,
        name: this.state.user.name,
        beforeAi: this.state.thinkingTrace.beforeAi,
        myQuestion: this.state.thinkingTrace.myQuestion,
        aiSupport: this.state.thinkingTrace.aiSupport,
        studentSummary: this.state.thinkingTrace.studentSummary,
        myChoice: this.state.thinkingTrace.myChoice,
        submittedAt: submittedAt,
        rubric: {
          selfScore: Number(selfScore),
          teacherScore: 0,
          totalScore: Number(selfScore),
          teacherFeedback: '채점 대기 중'
        }
      };

      // Filter out duplicate submission for same student and same assignment
      this.state.submissions = this.state.submissions.filter(s => !(s.studentId === newSubmission.studentId && s.assignmentId === newSubmission.assignmentId));
      this.state.submissions.unshift(newSubmission);
      this.saveSubmissions();
    }
  }

  unlockSubmissionForEdit() {
    this.updateThinkingTrace({ isSubmitted: false });
  }

  getThinkingTrace() { return this.state.thinkingTrace; }

  // Submissions Filtering
  clearSubmissionsForAssignment(assignmentId) {
    const targetId = assignmentId || this.state.activeAssignmentId;
    this.state.submissions = this.state.submissions.filter(s => s.assignmentId !== targetId);
    this.saveSubmissions();
  }

  getSubmissions(assignmentId = null) {
    const targetId = assignmentId || this.state.activeAssignmentId;
    if (targetId === 'all') return this.state.submissions;
    return this.state.submissions.filter(s => s.assignmentId === targetId);
  }

  gradeSubmission(studentId, assignmentId, rubricData) {
    const sub = this.state.submissions.find(s => s.studentId === studentId && (s.assignmentId === assignmentId || !assignmentId));
    if (sub) {
      sub.rubric = {
        selfScore: rubricData.selfScore || 0,
        teacherScore: rubricData.teacherScore || 0,
        totalScore: (rubricData.selfScore || 0) + (rubricData.teacherScore || 0),
        teacherFeedback: rubricData.teacherFeedback || ''
      };
      this.saveSubmissions();
    }
  }

  saveSubmissions() {
    localStorage.setItem('tt_all_submissions', JSON.stringify(this.state.submissions));
    this.dispatchEvent(new CustomEvent('submissionsChange', { detail: this.state.submissions }));
  }

  // Apps Script Config
  setAppsScriptUrl(url) {
    const cleanUrl = url.trim();
    this.state.appsScriptUrl = cleanUrl;
    localStorage.setItem('tt_apps_script_url', cleanUrl);
    this.dispatchEvent(new CustomEvent('configChange', { detail: { appsScriptUrl: cleanUrl } }));
  }

  getAppsScriptUrl() { return this.state.appsScriptUrl; }
}

export const store = new Store();
