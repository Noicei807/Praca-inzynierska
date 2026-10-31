export default defineNuxtRouteMiddleware((to, from) => {
  // Sprawdzamy to tylko w przeglądarce użytkownika
  if (process.client) {
    const rola = localStorage.getItem('rola');
    
    // Jeśli w pamięci nie ma roli "admin", wyrzucamy na stronę główną
    if (rola !== 'admin') {
      return navigateTo('/');
    }
  }
});