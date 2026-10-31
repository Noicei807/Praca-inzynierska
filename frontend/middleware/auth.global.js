export default defineNuxtRouteMiddleware((to, from) => {
  // Sprawdzamy czy to przeglądarka (a nie serwer SSR)
  if (process.client) {
    const token = localStorage.getItem('token');
    
    // Jeśli próbuje wejść gdziekolwiek indziej niż na '/login' lub '/rejestracja', to go blokujemy
    if (!token && to.path !== '/login' && to.path !== '/rejestracja') {
      return navigateTo('/login');
    }

    // Jeśli ma token i próbuje wejść na formularz logowania, to go stamtąd wyrzucamy (na stronę główną)
    if (token && (to.path === '/login' || to.path === '/rejestracja')) {
      return navigateTo('/');
    }
  }
});