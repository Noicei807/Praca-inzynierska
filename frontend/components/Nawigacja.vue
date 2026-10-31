<template>
  <nav class="nawigacja">
    <div class="nazwa-wypozyczalni">
      <h2 @click="navigateTo('/')" style="cursor: pointer;">Wypożyczalnia książek BookTabPL</h2>
    </div>
    
    <div class="menu">

      <!-- STAN 1: Użytkownik NIEZALOGOWANY (Gość) -->
      <template v-if="!czyZalogowany">
        <button class="przycisk-logowanie" @click="navigateTo('/login')">Zaloguj</button>
        <button class="przycisk-rejestracja" @click="navigateTo('/rejestracja')">Zarejestruj</button>
        <button class="przycisk-koszyk">Moje konto</button>
      </template>

      <!-- STAN 2: Zalogowany ZWYKŁY CZYTELNIK -->
      <template v-else-if="rola === 'czytelnik'">
        <button class="przycisk-logowanie" @click="navigateTo('/moje-konto')">Moje Konto</button>
        <button class="przycisk-wyloguj" @click="wyloguj">Wyloguj</button>
      </template>

      <!-- STAN 3: Zalogowany ADMIN -->
      <template v-else-if="rola === 'admin'">
        <button class="przycisk-logowanie" @click="navigateTo('/admin-dodawanie-do-bazy')">Dodawanie Książek</button>
        <button class="przycisk-rejestracja" @click="navigateTo('/admin-modyfikacja-bazy')">Zarządzanie Zapasami</button>
        <button class="przycisk-wyloguj" @click="wyloguj">Wyloguj</button>
      </template>

    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const czyZalogowany = ref(false);
const rola = ref(null);

onMounted(() => {
  if (process.client) {
    czyZalogowany.value = localStorage.getItem('token') !== null;
    rola.value = localStorage.getItem('rola');
  }
});

const wyczyscSesjeWPrzegladarce = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('rola');
};

const przekierujDoLogowania = () => {
  navigateTo('/login');
};

const wyloguj = () => {
  Promise.resolve()
    .then(wyczyscSesjeWPrzegladarce)
    .then(przekierujDoLogowania)
    .then(() => {
        // Po wylogowaniu zmuszamy komponent do odświeżenia stanu (bez przeładowania karty)
        czyZalogowany.value = false;
        rola.value = null;
    });
};
</script>