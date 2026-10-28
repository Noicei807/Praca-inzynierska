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
  <h2>Kategoria</h2>
  <!-- Zmiana klasy na sortowanie-ogolny i usunięcie zbędnego diva -->
  <select class="sortowanie-ogolny" v-model="wybranaKategoria">
    <option value="wszystkie">Wszystkie</option>
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
            <option value="brak">Domyślnie (od najnowszych)</option>
            <option value="tytul-az">Tytuł: od A do Z</option>
            <option value="tytul-za">Tytuł: od Z do A</option>
          </select>
        </div>

        <div class="grupa-filtrow">
          <h2>Język książki</h2>
          <div class="lista-checkboxow">
            <label><input type="checkbox" value="pl" v-model="wybraneJezyki"> Polski (PL)</label>
            <label><input type="checkbox" value="en" v-model="wybraneJezyki"> Angielski (EN)</label>
          </div>
        </div>

        <div class="zastosowanie-filtrow">
          <button type="button" class="zastosuj" @click="zastosujFiltry" :disabled="ladowanie">Zastosuj</button>
          <button type="button" class="wyczysc" @click="wyczyscFiltry" :disabled="ladowanie">Wyczyść</button>
        </div>
      </div>

      <div class="prawa-strona">
        <div class="wyszukiwarka-logo">
          <div class="logo">
            <img src="/logo.png" alt="LOGO" class="zdjecie-logo">
          </div>
          <form class="wyszukiwarka" @submit.prevent="szukajKsiazki">
            <input type="text" class="pole-tekstowe" placeholder="Szukaj książki" v-model="wyszukiwanaFraza">
            <button type="submit" class="przycisk-szukaj" :disabled="ladowanie">Szukaj</button>
          </form>
        </div>

        <div class="widok-wyszukanych-ksiazek">
          <!-- Stany ładowania -->
          <div v-if="ladowanie" style="grid-column: 1 / -1; text-align: center; font-size: 20px; padding: 40px;">
            Ładowanie katalogu...
          </div>
          <div v-else-if="brakWynikow" style="grid-column: 1 / -1; text-align: center; color: red; font-size: 20px; padding: 40px;">
            Nie znaleziono książek spełniających te kryteria.
          </div>

          <!-- Pętla po książkach z LOKALNEJ BAZY -->
          <template v-else>
            <div v-for="ksiazka in ksiazki" :key="ksiazka.id" class="pojedyncza-ksiazka">
              <h3 class="tytul-ksiazki">{{ ksiazka.tytul }}</h3>
              
              <img 
                class="zdjecia"
                v-if="ksiazka.okladka_url" 
                :src="ksiazka.okladka_url" 
                alt="Okładka" 
              />
              <div v-else class="brak-okladki">Brak okładki</div>      
              
              <div class="info-ksiazki" style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
                <span style="text-align: center; font-weight: bold; color: #5a3f99;">Dostępne: {{ ksiazka.ilosc }} szt.</span>
                <!-- Używamy Twojej klasy przycisk-szczegoly do zachowania wyglądu -->
                <button class="przycisk-szczegoly" @click="otworzSzczegoly(ksiazka)">Szczegóły</button>
                <button class="przycisk-szczegoly" style="background-color: #28a745;" @click="dodajDoKoszyka(ksiazka)" :disabled="ksiazka.ilosc < 1">
                  {{ ksiazka.ilosc > 0 ? 'Dodaj do koszyka' : 'Niedostępna' }}
                </button>
              </div>
            </div>
          </template>
        </div>

        <!-- Paginacja (Identyczna jak u Admina) -->
        <div class="paginacja" style="display: flex; justify-content: center; align-items: center; gap: 16px; margin: 24px 0;">
          <button type="button" @click="zmienStrone(obecnaStrona - 1)" :disabled="ladowanie || obecnaStrona <= 1" style="padding: 8px 16px; cursor: pointer; font-size: 18px;">&larr;</button>
          <span style="font-weight: bold; font-size: 16px;">{{ obecnaStrona }} / {{ wszystkieStrony }}</span>
          <button type="button" @click="zmienStrone(obecnaStrona + 1)" :disabled="ladowanie || obecnaStrona >= wszystkieStrony" style="padding: 8px 16px; cursor: pointer; font-size: 18px;">&rarr;</button>
        </div>

      </div>
    </div>

    <!-- MODAL - OKIENKO ZE SZCZEGÓŁAMI -->
    <div v-if="pokazModal" class="modal-tlo" @click.self="zamknijModal">
      <div class="modal-zawartosc">
        <button class="modal-zamknij-x" @click="zamknijModal">&times;</button>
        
        <div v-if="ladowanieSzczegolow" class="modal-ladowanie">
          Pobieranie szczegółowego opisu...
        </div>
        
        <div v-else class="modal-grid">
          <div class="modal-lewo">
            <img v-if="szczegolyKsiazki?.okladka_url" :src="szczegolyKsiazki.okladka_url" alt="Okładka" class="modal-okladka" />
            <button class="przycisk-szczegoly" style="width: 100%; margin-top: 15px; background-color: #28a745;" @click="dodajDoKoszyka(szczegolyKsiazki)" :disabled="szczegolyKsiazki?.ilosc < 1">
              Dodaj do koszyka
            </button>
          </div>
          
          <div class="modal-prawo">
            <h2>{{ szczegolyKsiazki?.tytul }}</h2>
            <h3>Autor: {{ szczegolyKsiazki?.autor }}</h3>
            <div class="modal-tagi">
              <span class="modal-tag" v-if="szczegolyKsiazki?.rok_wydania">Rok: {{ szczegolyKsiazki.rok_wydania }}</span>
              <span class="modal-tag" v-if="szczegolyKsiazki?.wydawnictwo">Wydawca: {{ szczegolyKsiazki.wydawnictwo }}</span>
              <span class="modal-tag">Dostępnych: {{ szczegolyKsiazki?.ilosc }} szt.</span>
            </div>
            <div class="modal-opis" v-html="pelnyOpisGoogle"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router'; // Pobieranie parametrów z URL

const route = useRoute();

const ksiazki = ref([]);
const obecnaStrona = ref(1);
const wszystkieStrony = ref(1);
const aktywnyTryb = ref('filtry');

const ladowanie = ref(false);
const brakWynikow = ref(false);

const wyszukiwanaFraza = ref('');
// MAGICZNA LINIA: Vue sprawdza czy w linku był gatunek, jak nie, ustawia "wszystkie"
const wybranaKategoria = ref(route.query.kategoria || 'wszystkie');
const rokOd = ref(null);
const rokDo = ref(null);
const wybraneSortowanie = ref('brak');
const wybraneJezyki = ref([]);

// Stany dla okienka (Modala)
const pokazModal = ref(false);
const ladowanieSzczegolow = ref(false);
const szczegolyKsiazki = ref(null);
const pelnyOpisGoogle = ref('');

const pobierzZBackendu = async (params) => {
  if (ladowanie.value) return; 
  ladowanie.value = true;
  brakWynikow.value = false;
  ksiazki.value = []; 

  try {
    const data = await $fetch('http://localhost:3001/api/ksiazki/lokalne', { query: params });
    ksiazki.value = data.items ?? [];
    obecnaStrona.value = data.currentPage ?? 1;
    wszystkieStrony.value = data.totalPages ?? 1;

    if (ksiazki.value.length === 0) brakWynikow.value = true;
  } catch (error) {
    alert("Błąd połączenia z bazą.");
  } finally {
    ladowanie.value = false;
  }
};

const szukajKsiazki = () => {
  const fraza = wyszukiwanaFraza.value.trim();
  if (fraza !== '') {
    aktywnyTryb.value = 'szukaj';
    pobierzZBackendu({ kategoria: fraza, strona: 1, limit: 12 });
  }
};

const zastosujFiltry = () => {
  wyszukiwanaFraza.value = ''; 
  aktywnyTryb.value = 'filtry';

  const params = {
    kategoria: wybranaKategoria.value === 'wszystkie' ? '' : wybranaKategoria.value,
    sortowanie: wybraneSortowanie.value,
    jezyki: wybraneJezyki.value.join(','),
    strona: 1, limit: 12
  };
  if (rokOd.value) params.rokOd = rokOd.value;
  if (rokDo.value) params.rokDo = rokDo.value;

  pobierzZBackendu(params);
};

const zmienStrone = (nowaStrona) => {
  if (nowaStrona < 1 || nowaStrona > wszystkieStrony.value) return;
  if (aktywnyTryb.value === 'szukaj') {
    pobierzZBackendu({ kategoria: wyszukiwanaFraza.value.trim(), strona: nowaStrona, limit: 12 });
  } else {
    zastosujFiltry(); // uproszczenie
  }
};

const wyczyscFiltry = () => {
  wybranaKategoria.value = 'wszystkie';
  rokOd.value = null; rokDo.value = null;
  wybraneSortowanie.value = 'brak'; wybraneJezyki.value = [];
  wyszukiwanaFraza.value = '';
  zastosujFiltry();
};

// Funkcje Modala
const otworzSzczegoly = async (ksiazka) => {
  szczegolyKsiazki.value = ksiazka;
  pokazModal.value = true;
  ladowanieSzczegolow.value = true;
  pelnyOpisGoogle.value = 'Brak dodatkowego opisu.';

  if (ksiazka.google_books_id) {
    try {
      // Uderza do naszego endpointu Proxy stworzonego w server.ts
      const data = await $fetch(`http://localhost:3001/api/ksiazki/szczegoly/${ksiazka.google_books_id}`);
      if (data.volumeInfo?.description) {
        pelnyOpisGoogle.value = data.volumeInfo.description;
      }
    } catch (error) {
      console.error("Błąd pobierania szczegółów:", error);
    }
  }
  ladowanieSzczegolow.value = false;
};

const zamknijModal = () => {
  pokazModal.value = false;
  szczegolyKsiazki.value = null;
};

// Koszyk
const dodajDoKoszyka = (ksiazka) => {
  alert(`Dodano do koszyka książkę: ${ksiazka.tytul}`);
  // Tutaj w przyszłości podepniemy Pinia (stan aplikacji) dla koszyka!
};

onMounted(zastosujFiltry);
</script>

<style src="./Gatunek.css" scoped></style>
<style src="./Katalog.css" scoped></style>