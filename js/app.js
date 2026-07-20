/**
 * Thinking Trace - Main Application Entry Point
 */

import { store } from './store.js';
import { Router } from './router.js';
import { renderLoginView } from './views/loginView.js';
import { renderStudentActivityView } from './views/studentActivityView.js';
import { renderTeacherDashboardView } from './views/teacherDashboardView.js';

// Global Toast Notification Helper
window.showToast = function(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconClass = 'fa-circle-info';
  if (type === 'success') iconClass = 'fa-circle-check';
  if (type === 'error') iconClass = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = '0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

// Render Navigation Bar User Profile State
function updateHeaderNav() {
  const userNav = document.getElementById('user-nav');
  if (!userNav) return;

  const user = store.getUser();

  if (user) {
    const isStudent = user.role === 'student';
    const roleLabel = isStudent ? '학생' : '교사';
    const displayName = isStudent ? `${user.studentId} ${user.name}` : user.name;
    const initial = user.name ? user.name.charAt(0) : 'U';

    userNav.innerHTML = `
      <div class="user-profile-badge">
        <div class="user-avatar">${initial}</div>
        <span>${displayName}</span>
        <span class="role-tag ${user.role}">${roleLabel}</span>
      </div>
      <button id="btn-header-logout" class="btn-logout">
        <i class="fa-solid fa-right-from-bracket"></i> 로그아웃
      </button>
    `;

    document.getElementById('btn-header-logout').addEventListener('click', () => {
      store.logout();
      window.showToast('로그아웃 되었습니다.', 'info');
      window.location.hash = '#login';
    });
  } else {
    userNav.innerHTML = `
      <button class="btn-demo" onclick="window.location.hash='#login'">
        <i class="fa-solid fa-right-to-bracket"></i> 로그인
      </button>
    `;
  }
}

// Settings Modal Handler
function initSettingsModal() {
  const modal = document.getElementById('settings-modal');
  const btnOpen = document.getElementById('btn-open-settings');
  const btnClose = document.getElementById('btn-close-settings');
  const btnSave = document.getElementById('btn-save-settings');
  const urlInput = document.getElementById('apps-script-url');
  const badge = document.getElementById('api-mode-badge');

  if (!modal || !btnOpen) return;

  const updateBadge = () => {
    const currentUrl = store.getAppsScriptUrl();
    if (currentUrl) {
      badge.className = 'badge badge-success';
      badge.style.background = '#dcfce7';
      badge.style.color = '#15803d';
      badge.style.padding = '0.35rem 0.75rem';
      badge.style.borderRadius = '9999px';
      badge.style.fontSize = '0.82rem';
      badge.innerHTML = '<i class="fa-solid fa-plug"></i> 구글 시트 Apps Script 연결됨';
    } else {
      badge.className = 'badge badge-mock';
      badge.style.background = '#fef3c7';
      badge.style.color = '#d97706';
      badge.style.padding = '0.35rem 0.75rem';
      badge.style.borderRadius = '9999px';
      badge.style.fontSize = '0.82rem';
      badge.innerHTML = '<i class="fa-solid fa-vial"></i> Mock API Mode (오프라인/테스트)';
    }
  };

  btnOpen.addEventListener('click', () => {
    urlInput.value = store.getAppsScriptUrl();
    updateBadge();
    modal.classList.remove('hidden');
  });

  btnClose.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  btnSave.addEventListener('click', () => {
    store.setAppsScriptUrl(urlInput.value);
    modal.classList.add('hidden');
    window.showToast('Apps Script Web App URL 설정이 저장되었습니다.', 'success');
  });
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  // Define route mapping
  const routes = {
    '#login': renderLoginView,
    '#student-activity': renderStudentActivityView,
    '#teacher-dashboard': renderTeacherDashboardView
  };

  const router = new Router(routes);

  // Subscribe to auth state changes
  store.addEventListener('authChange', () => {
    updateHeaderNav();
  });

  updateHeaderNav();
  initSettingsModal();
  router.init();
});
