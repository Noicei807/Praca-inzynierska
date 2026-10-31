<template>
  <div class="glowny">
    <div class="login-box">
      <h2>Zarejestruj się</h2>

      <form @submit.prevent="zarejestruj">
        <p class="rejestracja">Imię</p>
        <input type="text" class="login" v-model="form.imie" required>
        
        <p class="rejestracja">Nazwisko</p>
        <input type="text" class="login" v-model="form.nazwisko" required>

        <p class="rejestracja">E-mail</p>
        <input type="email" class="login" v-model="form.email" required>

        <p class="rejestracja">Hasło</p>
        <input type="password" class="haslo" v-model="form.haslo" required>

        <p class="rejestracja">Powtórz hasło</p>
        <input type="password" class="haslo" v-model="form.powtorzHaslo" required>

        <div v-if="bladKomunikat" style="color: red; margin-top: 10px; font-weight: bold; text-align: center;">
          {{ bladKomunikat }}
        </div>

        <div class="przyciski">
          <button type="submit" :disabled="ladowanie">
            {{ ladowanie ? 'TWORZENIE...' : 'UTWÓRZ KONTO' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { rejestracjaSchema } from '../../shared/index.ts';

// --- STAN LOKALNY ---
const form = ref({ imie: '', nazwisko: '', email: '', haslo: '', powtorzHaslo: '' });
const ladowanie = ref(false);
const bladKomunikat = ref('');

// --- 1. CZYSTE FUNKCJE (Pure Functions) ---
const wyciagnijDane = (formRef) => formRef.value;

const upewnijSieZeHaslaIdentyczne = (dane) => {
  if (dane.haslo !== dane.powtorzHaslo) throw new Error("Hasła nie są identyczne");
  return dane; // Puszczamy dalej, jeśli ok
};

const filtrujTylkoPotrzebnePola = (dane) => ({
  imie: dane.imie,
  nazwisko: dane.nazwisko,
  email: dane.email,
  haslo: dane.haslo
});

const sprawdzPoprawnoscZod = (dane) => rejestracjaSchema.parse(dane);

const wyciagnijWiadomoscBledu = (error) => 
  error.issues ? error.issues[0].message : (error.data?.error || error.message);

const zwrocSciezkePoRejestracji = () => '/login';

// --- 2. FUNKCJE EFEKTÓW UBOCZNYCH (Side-Effects) ---
const ustawLadowanie = (stan) => () => { ladowanie.value = stan; };
const czyscKomunikaty = () => { bladKomunikat.value = ''; };
const ustawKomunikatBledu = (komunikat) => { bladKomunikat.value = komunikat; };

const wyslijZadanieRejestracji = (validData) => 
  $fetch('http://localhost:3001/api/auth/rejestracja', {
    method: 'POST',
    body: validData
  });

const powiadomOSukcesie = () => { alert('Konto utworzone! Możesz się teraz zalogować.'); };
const PrzejdzDoStrony = (sciezka) => { navigateTo(sciezka); };

// --- 3. GŁÓWNY POTOK FUNKCYJNY (Pipeline) ---
const zarejestruj = () => {
  czyscKomunikaty();
  ustawLadowanie(true)();

  Promise.resolve(form)
    .then(wyciagnijDane)
    .then(upewnijSieZeHaslaIdentyczne)
    .then(filtrujTylkoPotrzebnePola)
    .then(sprawdzPoprawnoscZod)
    .then(wyslijZadanieRejestracji)
    .then(powiadomOSukcesie)
    .then(zwrocSciezkePoRejestracji)
    .then(PrzejdzDoStrony)
    .catch((error) => 
      Promise.resolve(error)
        .then(wyciagnijWiadomoscBledu)
        .then(ustawKomunikatBledu)
    )
    .finally(ustawLadowanie(false));
};
</script>

<style src="./login-rejestracja.css" scoped></style>