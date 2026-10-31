<template>
  <div class="glowny">
    <nav class="nawigacja">
      <div class="menu">
        <button class="przycisk-zatwierdzenia" @click="navigateTo('/admin-wypozyczenia')">Zmień na panel zatwierdzania wypożyczeń</button>
        <button class="przycisk-zmiana-modyfikacja" @click="navigateTo('/admin-modyfikacja-bazy')">Zmień na panel modyfikacji</button>
        <button class="przycisk-wyloguj" @click="wyloguj">Wyloguj</button>
      </div>
    </nav>

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
          <button type="button" class="zastosuj" @click="zastosujFiltry" :disabled="ladowanie">Zastosuj</button>
          <button type="button" class="wyczysc" @click="wyczyscFiltry" :disabled="ladowanie">Wyczyść</button>
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
            <input type="text" class="pole-tekstowe" placeholder="Szukaj książki" v-model="wyszukiwanaFraza">
            <button type="submit" class="przycisk-szukaj" :disabled="ladowanie" style="position: relative; z-index: 50; pointer-events: auto; cursor: pointer;">Szukaj</button>
          </form>
        </div>

        <div class="widok-wyszukanych-ksiazek">
          <div v-if="ladowanie" style="grid-column: 1 / -1; text-align: center; font-size: 20px; padding: 40px;">Trwa komunikacja z Google Books API...</div>
          <div v-else-if="brakWynikow" style="grid-column: 1 / -1; text-align: center; font-size: 20px; padding: 40px; color: red;">Nie znaleziono żadnych książek dla tego zapytania. Spróbuj innej frazy.</div>
          <template v-else>
            <div v-for="ksiazka in ksiazki" :key="ksiazka.id" class="pojedyncza-ksiazka">
              <h3 class="tytul-ksiazki">{{ ksiazka.volumeInfo?.title || 'Brak tytułu' }}</h3>
              <img class="zdjecia" v-if="ksiazka.volumeInfo?.imageLinks?.thumbnail" :src="ksiazka.volumeInfo?.imageLinks?.thumbnail" alt="Okładka" />
              <div v-else class="brak-okladki">Brak okładki</div>      
              <div class="ksiazka-dodaj">
                <div class="ilosc-ksiazek">
                  <input type="number" placeholder="ilość" class="input-dodaj" v-model.number="ilosci[ksiazka.id]">
                </div>
                <button type="button" class="przycisk-dodaj" @click="dodajKsiazkeAkcja(ksiazka)">Dodaj</button>
              </div>
            </div>
          </template>
        </div>

        <div class="paginacja" style="display: flex; justify-content: center; align-items: center; gap: 16px; margin: 24px 0;">
          <button type="button" @click="zmienStrone(obecnaStrona - 1)" :disabled="ladowanie || obecnaStrona <= 1" style="padding: 8px 16px; cursor: pointer; font-size: 18px;">&larr;</button>
          <span style="font-weight: bold; font-size: 16px;">{{ obecnaStrona }} / {{ wszystkieStrony }}</span>
          <button type="button" @click="zmienStrone(obecnaStrona + 1)" :disabled="ladowanie || obecnaStrona >= wszystkieStrony" style="padding: 8px 16px; cursor: pointer; font-size: 18px;">&rarr;</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: ["admin"] });
import { ref, onMounted } from 'vue';
import { dodajKsiazkeSchema } from '../../shared/index.ts';

const ksiazki = ref([]);
const ilosci = ref({});
const obecnaStrona = ref(1);
const wszystkieStrony = ref(1);
const aktywnyTryb = ref('filtry');
const ladowanie = ref(false);
const brakWynikow = ref(false);
const wyszukiwanaFraza = ref('');
const wybranaKategoria = ref('fantastyka');
const rokOd = ref(null);
const rokDo = ref(null);
const wybraneSortowanie = ref('brak');
const wybraneJezyki = ref([]);
const tylkoZOkladka = ref(false);
const tylkoZAutorem = ref(false);
const tylkoZWydawnictwem = ref(false);

const ustawLadowanie = (stan) => { ladowanie.value = stan; };
const ustawBrakWynikow = (stan) => { brakWynikow.value = stan; };
const wyczyscKsiazki = () => { ksiazki.value = []; };
const ustawDanePaginacji = (dane) => { 
  ksiazki.value = dane.items ?? []; 
  obecnaStrona.value = dane.currentPage ?? 1; 
  wszystkieStrony.value = dane.totalPages ?? 1; 
  if (ksiazki.value.length === 0) ustawBrakWynikow(true); 
  return dane;
};

const budujZadaniePobierania = (params) => () => $fetch('http://localhost:3001/api/ksiazki', { query: params });
const wyciagnijWiadomoscBledu = (error) => error.data?.error || error.message || error;
const obsluzBladPobierania = (blad) => Promise.resolve(blad).then(wyciagnijWiadomoscBledu).then((msg) => alert("Błąd połączenia: " + msg));

const pobierzZBackendu = (params) => {
  if (ladowanie.value) return;
  ustawLadowanie(true);
  ustawBrakWynikow(false);
  wyczyscKsiazki();
  return Promise.resolve()
    .then(budujZadaniePobierania(params))
    .then(ustawDanePaginacji)
    .catch(obsluzBladPobierania)
    .finally(() => ustawLadowanie(false));
};

const szukajKsiazki = () => {
  const fraza = wyszukiwanaFraza.value.trim();
  if (fraza !== '') {
    aktywnyTryb.value = 'szukaj';
    pobierzZBackendu({ kategoria: fraza, strona: 1, limit: 8 });
  }
};

const budujParametryFiltrow = () => {
  const params = { kategoria: wybranaKategoria.value, sortowanie: wybraneSortowanie.value, jezyki: wybraneJezyki.value.join(','), tylkoOkladka: tylkoZOkladka.value, tylkoAutor: tylkoZAutorem.value, tylkoWydawnictwo: tylkoZWydawnictwem.value, strona: 1, limit: 8 };
  if (rokOd.value) params.rokOd = rokOd.value;
  if (rokDo.value) params.rokDo = rokDo.value;
  return params;
};

const zastosujFiltry = () => {
  wyszukiwanaFraza.value = '';
  aktywnyTryb.value = 'filtry';
  return Promise.resolve().then(budujParametryFiltrow).then(pobierzZBackendu);
};

const zmienStrone = (nowaStrona) => {
  if (nowaStrona < 1 || nowaStrona > wszystkieStrony.value) return;
  if (aktywnyTryb.value === 'szukaj') return pobierzZBackendu({ kategoria: wyszukiwanaFraza.value.trim(), strona: nowaStrona, limit: 8 });
  return Promise.resolve()
    .then(budujParametryFiltrow)
    .then((params) => ({ ...params, strona: nowaStrona }))
    .then(pobierzZBackendu);
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

const wyloguj = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('rola');
  navigateTo('/login');
};

const wyciagnijRokWydania = (dataWydania) => dataWydania ? parseInt(dataWydania.substring(0, 4), 10) : null;
const transformujDaneKsiazki = (ksiazka) => {
  const info = ksiazka.volumeInfo || {};
  const rokWydania = wyciagnijRokWydania(info.publishedDate || '');
  return { tytul: info.title || 'Brak tytułu', autor: info.authors?.join(', ') || 'Autor nieznany', google_books_id: ksiazka.id, ilosc: ilosci.value[ksiazka.id] || 1, wydawnictwo: info.publisher || null, rok_wydania: isNaN(rokWydania) ? null : rokWydania, jezyk: info.language || null, kategoria: info.categories?.[0] || wybranaKategoria.value || null, okladka_url: info.imageLinks?.thumbnail || null };
};
const sprawdzPoprawnoscZod = (payload) => dodajKsiazkeSchema.parse(payload);
const pobierzToken = () => localStorage.getItem('token');
const wyslijZadanieDodania = (validData) => $fetch('http://localhost:3001/api/ksiazki', { method: 'POST', body: validData, headers: { 'Authorization': `Bearer ${pobierzToken()}` } });
const powiadomOSukcesie = (odpowiedz) => alert(odpowiedz.wiadomosc);
const czyscIloscPoDodaniu = (ksiazka) => { ilosci.value[ksiazka.id] = null; };
const wyciagnijBladWalidacjiLubSerwera = (error) => error.issues ? "Błąd walidacji: " + error.issues[0].message : "Błąd serwera: " + (error.data?.error || error.message);

const dodajKsiazkeAkcja = (ksiazka) => {
  return Promise.resolve(ksiazka)
    .then(transformujDaneKsiazki)
    .then(sprawdzPoprawnoscZod)
    .then(wyslijZadanieDodania)
    .then(powiadomOSukcesie)
    .then(() => czyscIloscPoDodaniu(ksiazka))
    .catch((error) => Promise.resolve(error).then(wyciagnijBladWalidacjiLubSerwera).then(alert));
};

onMounted(zastosujFiltry);
</script>

<style src="./Gatunek.css" scoped></style>
<style src="./admin-dodawanie-do-bazy.css" scoped></style>