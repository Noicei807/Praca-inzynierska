<template>
  <div class="glowny">
    <nav class="nawigacja">
      <div class="menu">
        <button class="przycisk-zmiana-modyfikacja" @click="przejdzDoDodawania">Zmień na dodawanie</button>
        <button class="przycisk-wyloguj" @click="wylogujAkcja">Wyloguj</button>
      </div>
    </nav>

    <div class="podstrona-admin">
      <h1 class="naglowek-konta">Panel Administratora - Oczekujące Wypożyczenia</h1>
      
      <div v-if="ladowanie" class="komunikat-ladowania">
        Trwa pobieranie listy oczekujących wypożyczeń...
      </div>

      <div v-else-if="oczekujace.length === 0" class="brak-danych">
        Brak książek oczekujących na zatwierdzenie.
      </div>

      <div v-else class="lista-wypozyczen">
        <div v-for="w in oczekujace" :key="w.wypozyczenie_id" class="karta-wypozyczenia">
          <div class="karta-lewo">
            <img v-if="w.okladka_url" :src="w.okladka_url" alt="Okładka" class="miniatura" />
            <div v-else class="brak-okladki-miniatura">Brak okładki</div>
          </div>
          
          <div class="info-wypozyczenia">
            <h3>{{ w.tytul }}</h3>
            <p class="autor">Autor: {{ w.autor }}</p>
            <div class="dane-czytelnika">
              <p><strong>Czytelnik:</strong> {{ w.imie }} {{ w.nazwisko }}</p>
              <p><strong>E-mail:</strong> {{ w.email }}</p>
              <p><strong>Data rezerwacji:</strong> {{ formatujDate(w.data_wypozyczenia) }}</p>
            </div>
          </div>
          
          <div class="akcje-wypozyczenia">
            <button class="przycisk-zatwierdz" @click="zatwierdzAkcja(w.wypozyczenie_id)">
              Zatwierdź
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: ["admin"] });
import { ref, onMounted } from 'vue';

const oczekujace = ref([]);
const ladowanie = ref(false);

const ustawLadowanie = (stan) => () => { ladowanie.value = stan; };
const aktualizujLokalnyStan = (dane) => { oczekujace.value = dane; return dane; };

const pobierzToken = () => localStorage.getItem('token');
const wyciagnijBladApi = (error) => error.data?.error || error.message || error;
const obsluzBlad = (prefix) => (blad) => Promise.resolve(blad).then(wyciagnijBladApi).then((msg) => alert(`${prefix}: ${msg}`));

const budujZadaniePobierania = () => $fetch('http://localhost:3001/api/wypozyczenia/oczekujace', { 
  headers: { 'Authorization': `Bearer ${pobierzToken()}` } 
});

const pobierzOczekujaceAkcja = () => {
  ustawLadowanie(true)();
  return Promise.resolve()
    .then(budujZadaniePobierania)
    .then(aktualizujLokalnyStan)
    .catch(obsluzBlad("Błąd pobierania"))
    .finally(ustawLadowanie(false));
};

const budujZadanieZatwierdzenia = (id) => $fetch(`http://localhost:3001/api/wypozyczenia/zatwierdz/${id}`, { 
  method: 'PUT', 
  headers: { 'Authorization': `Bearer ${pobierzToken()}` } 
});

const powiadomOSukcesie = (res) => alert(res.wiadomosc);
const usunZatwierdzoneZListy = (id) => () => {
  oczekujace.value = oczekujace.value.filter(w => w.wypozyczenie_id !== id);
};

const zatwierdzAkcja = (wypozyczenieId) => {
  return Promise.resolve(wypozyczenieId)
    .then(budujZadanieZatwierdzenia)
    .then(powiadomOSukcesie)
    .then(usunZatwierdzoneZListy(wypozyczenieId))
    .catch(obsluzBlad("Błąd zatwierdzania"));
};

const formatujDate = (dataString) => {
  if (!dataString) return 'Brak daty';
  return new Date(dataString).toLocaleDateString('pl-PL', { 
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
};

const przejdzDoDodawania = () => navigateTo('/admin-dodawanie-do-bazy');
const usunDaneLogowania = () => { localStorage.removeItem('token'); localStorage.removeItem('rola'); };
const przekierujDoLogowania = () => navigateTo('/login');
const wylogujAkcja = () => Promise.resolve().then(usunDaneLogowania).then(przekierujDoLogowania);

onMounted(pobierzOczekujaceAkcja);
</script>

<style src="./Gatunek.css" scoped></style>
<style src="./admin-wypozyczenia.css" scoped></style>