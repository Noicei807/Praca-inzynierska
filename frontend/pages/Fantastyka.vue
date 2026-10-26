<template>
<div class="glowny">
    <!------------------- pasek nawigacji - css globalny -------------------------->
    <nav class="nawigacja">
      <div class="nazwa-wypozyczalni">
          <h2>Wypożyczalnia książek BookTabPL</h2>
        </div>
      <div class="menu">
        <div class="rozwijane-menu">
          <button class="przycisk-rozwijany">Kategorie ▾</button>
        </div>
        <button class="przycisk-logowanie">Zaloguj</button>
        <button class="przycisk-rejestracja">Zarejestruj</button>
        <button class="przycisk-koszyk">Koszyk</button>
      </div>
    </nav>
      <!------------------- pasek nawigacji - css globalny -------------------------->


<div class="podstrona">
  <div class="pasek-boczny-filtry">
      <h1>Filtruj według</h1>

      <div class="grupa-filtrow">
        <h2>Cena</h2>
        <select class="sortowanie-ogolny">
          <option value="rosnaco">Cena od najniższej</option>
          <option value="malejaca">Cena od najwyższej</option>
        </select>
        <div class="zakres-cen">
          <input type="number" placeholder="Od" class="input-ogolny">
          <span> - </span>
          <input type="number" placeholder="Do" class="input-ogolny">
        </div>
      </div>

        <div class="grupa-filtrow">
        <h2>Autor</h2>
        <select class="sortowanie-ogolny">
          <option value="alfabetycznie">Od A do Z</option>
          <option value="odwrotnie">Od Z do A</option>
        </select>
          <div class="lista-checkboxow">
            <label><input type="checkbox" value="przyklad1">Przyklad1</label>
            <label><input type="checkbox" value="przyklad2">Przyklad2</label>
            <label><input type="checkbox" value="przyklad3">Przyklad3</label>
            <label><input type="checkbox" value="przyklad4">Przyklad4</label>
          </div>
        </div>

        <div class="grupa-filtrow">
        <h2>Tytuł</h2>
        <select class="sortowanie-ogolny">
          <option value="alfabetycznie">Od A do Z</option>
          <option value="odwrotnie">Od Z do A</option>
        </select>
        </div>
      
        <div class="grupa-filtrow">
        <h2>Wydawnictwo</h2>
          <div class="lista-checkboxow">
            <label><input type="checkbox" value="przyklad1">Przyklad1</label>
            <label><input type="checkbox" value="przyklad2">Przyklad2</label>
            <label><input type="checkbox" value="przyklad3">Przyklad3</label>
            <label><input type="checkbox" value="przyklad4">Przyklad4</label>
            </div>
        </div>

        <div class="zastosowanie-filtrow">
          <button class="zastosuj">Zastosuj</button>
          <button class="wyczysc">Wyczyść</button>
        </div>

  </div>

  <div class="prawa-strona">
    <div class="wyszukiwarka-logo">

      <div class="logo">
        <img src="/logo.png" alt="LOGO"  class="zdjecie-logo">
      </div>
      <div class="wyszukiwarka">
       <input type="text" class="pole-tekstowe" placeholder="Szukaj książki">
       <button class="przycisk-szukaj">Szukaj</button>
      </div>
    </div>

<div class="widok-wyszukanych-ksiazek">
  <div v-for="ksiazka in ksiazki" :key="ksiazka.id" class="pojedyncza-ksiazka">
  <h3 class="tytul-ksiazki">{{ ksiazka.volumeInfo.title }}</h3>
    <img class="zdjecia"
    v-if="ksiazka.volumeInfo?.imageLinks?.thumbnail" 
    :src="ksiazka.volumeInfo?.imageLinks?.thumbnail" 
    alt="Okładka" 
    />
  <div v-else class="brak-okladki">Brak okładki</div>      
  <div class="info-ksiazki">
        <button class="przycisk-szczegoly">Szczegóły</button>
      </div>
     </div>
  </div>
</div>

</div>
</div>

  </template>

<script setup>
import { ref, onMounted } from 'vue';

const ksiazki = ref([]);

const fetchFromOurApi = (category) => 
  fetch(`http://localhost:3001/api/ksiazki?kategoria=${category}`)
    .then(res => {
      if (!res.ok) throw new Error('Błąd zapytania, status: ' + res.status);
      return res.json();
    });

const updateBooksState = (data) => {
  ksiazki.value = data;
};

onMounted(() => {
  fetchFromOurApi('fantastyka')
    .then(updateBooksState)
    .catch(error => console.error('Błąd pobierania danych z Fastify:', error));
});
</script>

<style src="./Kategoria.css" scoped></style>

