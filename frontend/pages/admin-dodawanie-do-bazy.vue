<template>
  <div class="glowny">
    <!------------------- pasek nawigacji - css globalny -------------------------->
    <nav class="nawigacja">
      <div class="menu">
        <button class="przycisk-zmiana-modyfikacja">Zmień na panel modyfikacji</button>
        <button class="przycisk-wyloguj">Wyloguj</button>
      </div>
    </nav>
    <!------------------- pasek nawigacji - css globalny -------------------------->

    <div class="podstrona">
      <div class="pasek-boczny-filtry">
        <h1>Filtruj według</h1>

        <div class="grupa-filtrow">
          <h2>Kategoria</h2>
          <div class="kategorie">
            <select class="sortowanie-kategoria" v-model="wybranaKategoria">
              <option value="fantastyka">Fantastyka</option>
              <option value="kryminał">Kryminał i Sensacja</option>
              <option value="informatyka">Informatyka</option>
              <option value="biografie">Biografie</option>
              <option value="historia">Historia</option>
              <option value="nauka">Nauka</option>
              <option value="psychologia">Psychologia</option>
              <option value="romans">Romans</option>
            </select>
          </div>
        </div>

        <div class="grupa-filtrow">
          <h2>Rok wydania</h2>
          <div class="zakres-cen">
            <input type="number" placeholder="Od" class="input-ogolny" v-model.number="rokOd">
            <span>-</span>
            <input type="number" placeholder="Do" class="input-ogolny" v-model.number="rokDo">
          </div>
        </div>

        <div class="grupa-filtrow">
          <h2>Sortowanie</h2>
          <select class="sortowanie-ogolny" v-model="wybraneSortowanie">
            <option value="brak">Domyślnie (trafność)</option>
            <option value="tytul-az">Tytuł: od A do Z</option>
            <option value="tytul-za">Tytuł: od Z do A</option>
            <option value="autor-az">Autor: od A do Z</option>
            <option value="autor-za">Autor: od Z do A</option>
            <option value="rok-malejaco">Rok: od najnowszych</option>
            <option value="rok-rosnaco">Rok: od najstarszych</option>
          </select>
        </div>

        <div class="grupa-filtrow">
          <h2>Język książki</h2>
          <div class="lista-checkboxow">
            <label><input type="checkbox" value="pl" v-model="wybraneJezyki"> Polski (PL)</label>
            <label><input type="checkbox" value="en" v-model="wybraneJezyki"> Angielski (EN)</label>
          </div>
        </div>

        <div class="grupa-filtrow">
          <h2>Wymagane dane</h2>
          <div class="lista-checkboxow">
            <label><input type="checkbox" v-model="tylkoZOkladka"> Posiada okładkę</label>
            <label><input type="checkbox" v-model="tylkoZAutorem"> Posiada autora</label>
            <label><input type="checkbox" v-model="tylkoZWydawnictwem"> Posiada wydawnictwo</label>
          </div>
        </div>

        <div class="zastosowanie-filtrow">
          <button type="button" class="zastosuj" @click="zastosujFiltry">Zastosuj</button>
          <button type="button" class="wyczysc" @click="wyczyscFiltry">Wyczyść</button>
        </div>
      </div>

      <div class="prawa-strona">
        <div class="dodawanie">
          <h1>Panel dodawania książek do bazy danych</h1>
        </div>

        <div class="wyszukiwarka-logo">
          <div class="logo">
            <img src="/logo.png" alt="LOGO" class="zdjecie-logo">
          </div>
          <form class="wyszukiwarka" @submit.prevent="szukajKsiazki">
            <input 
              type="text" 
              class="pole-tekstowe" 
              placeholder="Szukaj książki" 
              v-model="wyszukiwanaFraza"
            >
            <button 
              type="submit" 
              class="przycisk-szukaj"
              style="position: relative; z-index: 50; pointer-events: auto; cursor: pointer;"
            >
              Szukaj
            </button>
          </form>
        </div>

        <div class="widok-wyszukanych-ksiazek">
          <div v-for="ksiazka in ksiazki" :key="ksiazka.id" class="pojedyncza-ksiazka">
            <h3 class="tytul-ksiazki">{{ ksiazka.volumeInfo?.title || 'Brak tytułu' }}</h3>
            <img 
              class="zdjecia"
              v-if="ksiazka.volumeInfo?.imageLinks?.thumbnail" 
              :src="ksiazka.volumeInfo?.imageLinks?.thumbnail" 
              alt="Okładka" 
            />
            <div v-else class="brak-okladki">Brak okładki</div>      
<div class="ksiazka-dodaj">
  <div class="ilosc-ksiazek">
    <input type="number" placeholder="ilość" class="input-dodaj" v-model.number="ilosci[ksiazka.id]">
  </div>
  <button type="button" class="przycisk-dodaj" @click="dodajKsiazke(ksiazka)">Dodaj</button>
</div>
          </div>
        </div>

        <!-- PASEK PAGINACJI NA DOLE (po 8 książek na stronę) -->
        <div class="paginacja" style="display: flex; justify-content: center; align-items: center; gap: 16px; margin: 24px 0;">
          <button 
            type="button" 
            @click="zmienStrone(obecnaStrona - 1)" 
            :disabled="obecnaStrona <= 1"
            style="padding: 8px 16px; cursor: pointer; font-size: 18px;"
          >
            &larr;
          </button>

          <span style="font-weight: bold; font-size: 16px;">
            {{ obecnaStrona }} / {{ wszystkieStrony }}
          </span>

          <button 
            type="button" 
            @click="zmienStrone(obecnaStrona + 1)" 
            :disabled="obecnaStrona >= wszystkieStrony"
            style="padding: 8px 16px; cursor: pointer; font-size: 18px;"
          >
            &rarr;
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { dodajKsiazkeSchema } from '../../shared/index.js';

const ksiazki = ref([]);
const ilosci = ref({});
const obecnaStrona = ref(1);
const wszystkieStrony = ref(1);
const aktywnyTryb = ref('filtry');

const wyszukiwanaFraza = ref('');
const wybranaKategoria = ref('fantastyka');
const rokOd = ref(null);
const rokDo = ref(null);
const wybraneSortowanie = ref('brak');
const wybraneJezyki = ref([]);
const tylkoZOkladka = ref(false);
const tylkoZAutorem = ref(false);
const tylkoZWydawnictwem = ref(false);

const buildSearchUrl = (fraza, strona) => {
  const params = new URLSearchParams({ kategoria: fraza, strona: String(strona), limit: '8' });
  return `http://localhost:3001/api/ksiazki?${params.toString()}`;
};

const buildFilterUrl = (filtry, strona) => {
  const params = new URLSearchParams({
    kategoria: filtry.kategoria,
    sortowanie: filtry.sortowanie,
    jezyki: filtry.jezyki.join(','),
    tylkoOkladka: String(filtry.tylkoOkladka),
    tylkoAutor: String(filtry.tylkoAutor),
    tylkoWydawnictwo: String(filtry.tylkoWydawnictwo),
    strona: String(strona),
    limit: '8'
  });
  if (filtry.rokOd) params.set('rokOd', String(filtry.rokOd));
  if (filtry.rokDo) params.set('rokDo', String(filtry.rokDo));
  return `http://localhost:3001/api/ksiazki?${params.toString()}`;
};

const getFilterSnapshot = () => ({
  kategoria: wybranaKategoria.value,
  rokOd: rokOd.value,
  rokDo: rokDo.value,
  sortowanie: wybraneSortowanie.value,
  jezyki: wybraneJezyki.value,
  tylkoOkladka: tylkoZOkladka.value,
  tylkoAutor: tylkoZAutorem.value,
  tylkoWydawnictwo: tylkoZWydawnictwem.value
});

const fetchFromServer = (url) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Błąd zapytania');
  return res.json();
});

const updateViewState = (data) => {
  ksiazki.value = data.items ?? [];
  obecnaStrona.value = data.currentPage ?? 1;
  wszystkieStrony.value = data.totalPages ?? 1;
};

const wykonajPotok = (url) => Promise.resolve(url)
  .then(fetchFromServer)
  .then(updateViewState)
  .catch(err => console.error(err));

const dodajKsiazke = (ksiazka) => {
  const payload = {
    tytul: ksiazka.volumeInfo?.title || 'Brak tytułu',
    autor: ksiazka.volumeInfo?.authors?.join(', ') || 'Autor nieznany',
    google_books_id: ksiazka.id,
    ilosc: ilosci.value[ksiazka.id]
  };

  try {
    const validData = dodajKsiazkeSchema.parse(payload);
    fetch('http://localhost:3001/api/ksiazki', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validData)
    })
    .then(res => res.json())
    .then(data => {
      alert(data.wiadomosc || 'Książka dodana!');
      ilosci.value[ksiazka.id] = null;
    })
    .catch(err => console.error(err));
  } catch (error) {
    if (error.issues) alert(error.issues[0].message);
  }
};

const szukajKsiazki = () => {
  const fraza = wyszukiwanaFraza.value.trim();
  if (fraza !== '') {
    aktywnyTryb.value = 'szukaj';
    wykonajPotok(buildSearchUrl(fraza, 1));
  }
};

const zastosujFiltry = () => {
  wyszukiwanaFraza.value = '';
  aktywnyTryb.value = 'filtry';
  wykonajPotok(buildFilterUrl(getFilterSnapshot(), 1));
};

const zmienStrone = (nowaStrona) => {
  if (nowaStrona < 1 || nowaStrona > wszystkieStrony.value) return;
  const url = aktywnyTryb.value === 'szukaj'
    ? buildSearchUrl(wyszukiwanaFraza.value.trim(), nowaStrona)
    : buildFilterUrl(getFilterSnapshot(), nowaStrona);
  wykonajPotok(url);
};

const wyczyscFiltry = () => {
  wybranaKategoria.value = 'fantastyka';
  rokOd.value = null;
  rokDo.value = null;
  wybraneSortowanie.value = 'brak';
  wybraneJezyki.value = [];
  tylkoZOkladka.value = false;
  tylkoZAutorem.value = false;
  tylkoZWydawnictwem.value = false;
  wyszukiwanaFraza.value = '';
  zastosujFiltry();
};

onMounted(zastosujFiltry);
</script>

<style src="./Kategoria.css" scoped></style>
<style src="./admin-dodawanie-do-bazy.css" scoped></style>