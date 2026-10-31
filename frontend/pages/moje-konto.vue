<template>
  <div class="glowny">
    <nav class="nawigacja">
      <div class="menu">
        <button class="przycisk-katalog" @click="navigateTo('/Gatunek')">Katalog</button>
        <button class="przycisk-wyloguj" @click="wylogujAkcja">Wyloguj</button>
      </div>
    </nav>

    <div class="podstrona-konto">
      <h1 class="naglowek-konta">Moje Konto - Twoje książki</h1>
      
      <div v-if="ladowanie" class="komunikat-ladowania">
        Trwa pobieranie danych o Twoich wypożyczeniach...
      </div>

      <div v-else class="sekcje-wypozyczen">
        
        <div class="sekcja">
          <h2 class="tytul-sekcji oczekujace-tytul">Książki oczekujące na potwierdzenie</h2>
          <div v-if="oczekujace.length === 0" class="brak-danych">
            Nie masz żadnych książek oczekujących na weryfikację.
          </div>
          <div v-else class="lista-wypozyczen">
            <div v-for="w in oczekujace" :key="w.wypozyczenie_id" class="karta-wypozyczenia">
              <img v-if="w.okladka_url" :src="w.okladka_url" alt="Okładka" class="miniatura" />
              <div v-else class="brak-okladki-miniatura">Brak okładki</div>
              <div class="info-wypozyczenia">
                <h3>{{ w.tytul }}</h3>
                <p class="status status-zolty">Status: Oczekujące</p>
              </div>
            </div>
          </div>
        </div>

        <div class="sekcja">
          <h2 class="tytul-sekcji aktywne-tytul">Wypożyczone książki</h2>
          <div v-if="wypozyczone.length === 0" class="brak-danych">
            Obecnie nie masz żadnych aktywnych wypożyczeń.
          </div>
          <div v-else class="lista-wypozyczen">
            <div v-for="w in wypozyczone" :key="w.wypozyczenie_id" class="karta-wypozyczenia">
              <img v-if="w.okladka_url" :src="w.okladka_url" alt="Okładka" class="miniatura" />
              <div v-else class="brak-okladki-miniatura">Brak okładki</div>
              <div class="info-wypozyczenia">
                <h3>{{ w.tytul }}</h3>
                <p class="status status-zielony">
                  Czas na oddanie do: <strong>{{ formatujDate(w.data_zwrotu) }}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const wypozyczenia = ref([]);
const ladowanie = ref(false);

const oczekujace = computed(() => wypozyczenia.value.filter(w => w.status === 'oczekujace'));
const wypozyczone = computed(() => wypozyczenia.value.filter(w => w.status === 'wypozyczone'));

const ustawLadowanie = (stan) => () => { ladowanie.value = stan; };
const aktualizujStanWypozyczen = (dane) => { wypozyczenia.value = dane; return dane; };

const pobierzToken = () => localStorage.getItem('token');
const budujZadaniePobierania = () => $fetch('http://localhost:3001/api/wypozyczenia/moje', { 
  headers: { 'Authorization': `Bearer ${pobierzToken()}` } 
});

const wyciagnijWiadomoscBledu = (error) => error.data?.error || error.message || error;
const obsluzBladPobierania = (blad) => Promise.resolve(blad).then(wyciagnijWiadomoscBledu).then((msg) => alert("Błąd pobierania: " + msg));

const pobierzMojeWypozyczeniaAkcja = () => {
  ustawLadowanie(true)();
  return Promise.resolve()
    .then(budujZadaniePobierania)
    .then(aktualizujStanWypozyczen)
    .catch(obsluzBladPobierania)
    .finally(ustawLadowanie(false));
};

const formatujDate = (dataString) => {
  if (!dataString) return 'Brak daty zwrotu';
  return new Date(dataString).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' });
};

const usunDaneLogowania = () => { localStorage.removeItem('token'); localStorage.removeItem('rola'); };
const przekierujDoLogowania = () => navigateTo('/login');
const wylogujAkcja = () => Promise.resolve().then(usunDaneLogowania).then(przekierujDoLogowania);

onMounted(pobierzMojeWypozyczeniaAkcja);
</script>

<style src="./Gatunek.css" scoped></style>
<style src="./moje-konto.css" scoped></style>