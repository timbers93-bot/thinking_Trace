/**
 * Thinking Trace - Single Page Client-Side Router
 */

import { store } from './store.js';

export class Router {
  constructor(routes) {
    this.routes = routes;
    this.appContainer = document.getElementById('app');
    
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  init() {
    this.handleRoute();
  }

  navigate(hash) {
    window.location.hash = hash;
  }

  handleRoute() {
    let hash = window.location.hash || '#login';
    const isAuthenticated = store.isAuthenticated();
    const userRole = store.getRole();

    // Guard 1: Unauthenticated users are forced to #login
    if (!isAuthenticated && hash !== '#login') {
      this.navigate('#login');
      return;
    }

    // Guard 2: Authenticated user attempting to visit #login redirected to their home dashboard
    if (isAuthenticated && hash === '#login') {
      if (userRole === 'teacher') {
        this.navigate('#teacher-dashboard');
      } else {
        this.navigate('#student-activity');
      }
      return;
    }

    // Guard 3: Role-based route access restriction
    if (isAuthenticated) {
      if (userRole === 'student' && hash === '#teacher-dashboard') {
        window.showToast('교사 전용 페이지입니다. 학생 활동 화면으로 이동합니다.', 'error');
        this.navigate('#student-activity');
        return;
      }
    }

    // Find view renderer
    const routeHandler = this.routes[hash] || this.routes['#login'];
    if (routeHandler) {
      this.appContainer.innerHTML = '';
      const viewElement = routeHandler();
      this.appContainer.appendChild(viewElement);
      window.scrollTo(0, 0);
    }
  }
}
