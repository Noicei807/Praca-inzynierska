<template>
  <div class="glowny">
    <!------------------- pasek nawigacji - css globalny -------------------------->
    <nav class="nawigacja">
      <div class="menu">
        <button 
          class="przycisk-zmiana-modyfikacja" 
          @click="navigateTo('/admin-dodawanie-do-bazy')"
        >
          Zmień na panel dodawania
        </button>
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
        <div class="modyfikacja">
          <h1>Panel modyfikacji książek w bazie danych</h1>
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
              :disabled="ladowanie"
              style="position: relative; z-index: 50; pointer-events: auto; cursor: pointer;"
            >
              Szukaj
            </button>
          </form>
        </div>

        <div class="widok-wyszukanych-ksiazek">
          <!-- Wskaźnik ładowania -->
          <div v-if="ladowanie" style="grid-column: 1 / -1; text-align: center; font-size: 20px; padding: 40px;">
            Trwa komunikacja z bazą danych...
          </div>
          
          <!-- Brak wyników -->
          <div v-else-if="brakWynikow" style="grid-column: 1 / -1; text-align: center; font-size: 20px; padding: 40px; color: red;">
            Nie znaleziono żadnych książek dla tego zapytania. Spróbuj innej frazy.
          </div>

          <!-- Właściwa lista książek -->
          <template v-else>
            <div v-for="ksiazka in ksiazki" :key="ksiazka.id" class="pojedyncza-ksiazka">
              <h3 class="tytul-ksiazki">{{ ksiazka.tytul || 'Brak tytułu' }}</h3>
              <img 
                class="zdjecia"
                v-if="ksiazka.okladka_url" 
                :src="ksiazka.okladka_url" 
                alt="Okładka" 
              />
              <div v-else class="brak-okladki">Brak okładki</div>      
              
              <div class="ksiazka-dodaj">
                <div class="ilosc-ksiazek">
                  <input type="number" placeholder="ilość" class="input-dodaj" v-model.number="ksiazka.ilosc">
                </div>
                <!-- ZACHOWANA KLASA przycisk-dodaj Z TWOJEGO CSS -->
                <button type="button" class="przycisk-dodaj" @click="zapiszZmiany(ksiazka.id, ksiazka.ilosc)">Zapisz</button>
                <button type="button" class="przycisk-dodaj" @click="usunKsiazke(ksiazka.id)">Usuń</button>
              </div>
            </div>
          </template>
        </div>

        <div class="paginacja" style="display: flex; justify-content: center; align-items: center; gap: 16px; margin: 24px 0;">
          <button 
            type="button" 
            @click="zmienStrone(obecnaStrona - 1)" 
            :disabled="ladowanie || obecnaStrona <= 1"
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
            :disabled="ladowanie || obecnaStrona >= wszystkieStrony"
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
import { edytujKsiazkeSchema } from '../../shared/index.js';

const ksiazki = ref([]);
const obecnaStrona = ref(1);
const wszystkieStrony = ref(1);
const aktywnyTryb = ref('filtry');

const ladowanie = ref(false);
const brakWynikow = ref(false);

const wyszukiwanaFraza = ref('');
const wybranaKategoria = ref('wszystkie'); // Domyślnie ładuje wszystko
const rokOd = ref(null);
const rokDo = ref(null);
const wybraneSortowanie = ref('brak');
const wybraneJezyki = ref([]);
const tylkoZOkladka = ref(false);
const tylkoZAutorem = ref(false);
const tylkoZWydawnictwem = ref(false);

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

    if (ksiazki.value.length === 0) {
      brakWynikow.value = true;
    }
  } catch (error) {
    alert("Błąd połączenia: " + (error.data?.error || error.message));
  } finally {
    ladowanie.value = false;
  }
};

const szukajKsiazki = () => {
  const fraza = wyszukiwanaFraza.value.trim();
  if (fraza !== '') {
    aktywnyTryb.value = 'szukaj';
    pobierzZBackendu({ 
      kategoria: fraza, 
      strona: 1, 
      limit: 8 
    });
  }
};

const zastosujFiltry = () => {
  wyszukiwanaFraza.value = ''; 
  aktywnyTryb.value = 'filtry';

  const params = {
    // PRZECHWYCENIE "WSZYSTKIE" -> zamienia na puste zapytanie by pominąć filtr gatunku
    kategoria: wybranaKategoria.value === 'wszystkie' ? '' : wybranaKategoria.value,
    sortowanie: wybraneSortowanie.value,
    jezyki: wybraneJezyki.value.join(','),
    tylkoOkladka: tylkoZOkladka.value,
    tylkoAutor: tylkoZAutorem.value,
    tylkoWydawnictwo: tylkoZWydawnictwem.value,
    strona: 1,
    limit: 8
  };
  
  if (rokOd.value) params.rokOd = rokOd.value;
  if (rokDo.value) params.rokDo = rokDo.value;

  pobierzZBackendu(params);
};

const zmienStrone = (nowaStrona) => {
  if (nowaStrona < 1 || nowaStrona > wszystkieStrony.value) return;
  
  if (aktywnyTryb.value === 'szukaj') {
    pobierzZBackendu({ kategoria: wyszukiwanaFraza.value.trim(), strona: nowaStrona, limit: 8 });
  } else {
    const params = {
      kategoria: wybranaKategoria.value === 'wszystkie' ? '' : wybranaKategoria.value,
      sortowanie: wybraneSortowanie.value,
      jezyki: wybraneJezyki.value.join(','),
      tylkoOkladka: tylkoZOkladka.value,
      tylkoAutor: tylkoZAutorem.value,
      tylkoWydawnictwo: tylkoZWydawnictwem.value,
      strona: nowaStrona,
      limit: 8
    };
    if (rokOd.value) params.rokOd = rokOd.value;
    if (rokDo.value) params.rokDo = rokDo.value;
    pobierzZBackendu(params);
  }
};

const wyczyscFiltry = () => {
  wybranaKategoria.value = 'wszystkie'; // Reset do "Wszystkie"
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

const zapiszZmiany = async (id, nowaIlosc) => {
  try {
    const validData = edytujKsiazkeSchema.parse({ ilosc: nowaIlosc });
    await $fetch(`http://localhost:3001/api/ksiazki/lokalne/${id}`, {
      method: 'PUT',
      body: validData
    });
    alert('Ilość została pomyślnie zaktualizowana!');
  } catch (error) {
    if (error.issues) alert("Błąd walidacji: " + error.issues[0].message);
    else alert("Błąd serwera: " + (error.data?.error || error.message));
  }
};

const usunKsiazke = async (id) => {
  if (!confirm("Czy na pewno chcesz bezpowrotnie usunąć tę książkę z bazy?")) return;
  try {
    await $fetch(`http://localhost:3001/api/ksiazki/lokalne/${id}`, { method: 'DELETE' });
    alert('Książka została usunięta!');
    zmienStrone(obecnaStrona.value);
  } catch (error) {
    alert("Błąd usuwania: " + (error.data?.error || error.message));
  }
};

onMounted(zastosujFiltry);
</script>

<style src="./Kategoria.css" scoped></style>
<style src="./admin-modyfikacja-bazy.css" scoped></style>