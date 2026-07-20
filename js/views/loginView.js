/**
 * Thinking Trace - Tabbed Login Screen View
 */

import { store } from '../store.js';

export function renderLoginView() {
  const container = document.createElement('div');
  container.className = 'login-wrapper';

  container.innerHTML = `
    <div class="login-card">
      <div class="login-header">
        <h2>사고 흔적 플랫폼 로그인</h2>
        <p>AI 연동 사고력 확장 교육 시스템에 오신 것을 환영합니다.</p>
      </div>

      <!-- Tab Switcher -->
      <div class="tab-container">
        <button type="button" class="tab-btn active" data-tab="student" id="tab-student">
          <i class="fa-solid fa-graduation-cap"></i> 학생용
        </button>
        <button type="button" class="tab-btn" data-tab="teacher" id="tab-teacher">
          <i class="fa-solid fa-chalkboard-user"></i> 교사용
        </button>
      </div>

      <!-- Student Login Form -->
      <form id="form-student-login" class="login-form">
        <div class="form-group">
          <label for="student-id"><i class="fa-solid fa-id-card"></i> 학번</label>
          <input type="text" id="student-id" placeholder="예: 10101 (1학년 1반 1번)" required />
        </div>
        <div class="form-group">
          <label for="student-name"><i class="fa-solid fa-user"></i> 이름</label>
          <input type="text" id="student-name" placeholder="예: 김민수" required />
        </div>
        <div class="form-group">
          <label for="student-password"><i class="fa-solid fa-lock"></i> 비밀번호</label>
          <input type="password" id="student-password" placeholder="비밀번호를 입력하세요" required />
        </div>
        <button type="submit" class="btn btn-student" id="btn-student-submit">
          <i class="fa-solid fa-right-to-bracket"></i> 학생 로그인
        </button>
      </form>

      <!-- Teacher Login Form (Initially Hidden) -->
      <form id="form-teacher-login" class="login-form hidden" style="display: none;">
        <div class="form-group">
          <label for="teacher-email"><i class="fa-solid fa-envelope"></i> 이메일 주소</label>
          <input type="email" id="teacher-email" placeholder="예: teacher@school.edu" required />
        </div>
        <div class="form-group">
          <label for="teacher-password"><i class="fa-solid fa-lock"></i> 비밀번호</label>
          <input type="password" id="teacher-password" placeholder="비밀번호를 입력하세요" required />
        </div>
        <button type="submit" class="btn btn-teacher" id="btn-teacher-submit">
          <i class="fa-solid fa-right-to-bracket"></i> 교사 로그인
        </button>
      </form>

      <!-- Quick Demo Login Helpers -->
      <div class="demo-box">
        <div class="demo-title">원클릭 테스트 체험 계정</div>
        <div class="demo-buttons">
          <button type="button" class="btn-demo" id="btn-demo-student">
            <i class="fa-solid fa-user-graduate"></i> 학생 체험 (10101 김민수)
          </button>
          <button type="button" class="btn-demo" id="btn-demo-teacher">
            <i class="fa-solid fa-user-tie"></i> 교사 체험 (teacher@school.edu)
          </button>
        </div>
      </div>
    </div>
  `;

  // Attach Tab Switching Events
  const tabStudent = container.querySelector('#tab-student');
  const tabTeacher = container.querySelector('#tab-teacher');
  const formStudent = container.querySelector('#form-student-login');
  const formTeacher = container.querySelector('#form-teacher-login');

  tabStudent.addEventListener('click', () => {
    tabStudent.classList.add('active');
    tabTeacher.classList.remove('active');
    formStudent.style.display = 'block';
    formTeacher.style.display = 'none';
  });

  tabTeacher.addEventListener('click', () => {
    tabTeacher.classList.add('active');
    tabStudent.classList.remove('active');
    formTeacher.style.display = 'block';
    formStudent.style.display = 'none';
  });

  // Handle Student Login Submit
  formStudent.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = container.querySelector('#student-id').value;
    const name = container.querySelector('#student-name').value;
    const pwd = container.querySelector('#student-password').value;

    if (!id || !name || !pwd) {
      window.showToast('모든 학생 입력 항목을 채워주세요.', 'error');
      return;
    }

    store.loginStudent(id, name, pwd);
    window.showToast(`${name} 학생으로 로그인되었습니다!`, 'success');
    window.location.hash = '#student-activity';
  });

  // Handle Teacher Login Submit
  formTeacher.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = container.querySelector('#teacher-email').value;
    const pwd = container.querySelector('#teacher-password').value;

    if (!email || !pwd) {
      window.showToast('이메일과 비밀번호를 입력해주세요.', 'error');
      return;
    }

    store.loginTeacher(email, pwd);
    window.showToast('교사 대시보드로 로그인되었습니다!', 'success');
    window.location.hash = '#teacher-dashboard';
  });

  // Handle Demo Buttons
  container.querySelector('#btn-demo-student').addEventListener('click', () => {
    container.querySelector('#student-id').value = '10101';
    container.querySelector('#student-name').value = '김민수';
    container.querySelector('#student-password').value = 'student123!';
    tabStudent.click();
    formStudent.dispatchEvent(new Event('submit'));
  });

  container.querySelector('#btn-demo-teacher').addEventListener('click', () => {
    container.querySelector('#teacher-email').value = 'teacher@school.edu';
    container.querySelector('#teacher-password').value = 'teacher123!';
    tabTeacher.click();
    formTeacher.dispatchEvent(new Event('submit'));
  });

  return container;
}
