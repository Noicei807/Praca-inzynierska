<template>
  <div class="glowny">
    <div class="login-box">
      <h2>Zaloguj się</h2>

      <form @submit.prevent="zaloguj">
        <p class="login">E-mail</p>
        <input type="email" class="login" v-model="form.email" required>

        <p class="login">Hasło</p>
        <input type="password" class="haslo" v-model="form.haslo" required>

        <div v-if="bladKomunikat" style="color: red; margin-top: 10px; font-weight: bold; text-align: center;">
          {{ bladKomunikat }}
        </div>

        <div class="przyciski">
          <button type="submit" :disabled="ladowanie">
            {{ ladowanie ? 'LOGOWANIE...' : 'ZALOGUJ SIĘ' }}
          </button>

          <p class="brak-konta">Nie masz konta?</p>
          <button type="button" class="rejestracja" @click="PrzejdzDoStrony('/rejestracja')">
            ZAREJESTRUJ SIĘ
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { logowanieSchema } from '../../shared/index.ts';

// --- STAN LOKALNY ---
const form = ref({ email: '', haslo: '' });
const ladowanie = ref(false);
const bladKomunikat = ref('');

const wyciagnijDane = (formRef) => formRef.value;

const sprawdzPoprawnoscZod = (dane) => logowanieSchema.parse(dane);

const wyciagnijBladZodLubApi = (error) => 
  error.issues ? error.issues[0].message : (error.data?.error || "Niepoprawne dane logowania");

const ustalSciezkeDlaRoli = (rola) => 
  rola === 'admin' ? '/admin-dodawanie-do-bazy' : '/';

// --- 2. FUNKCJE EFEKTÓW UBOCZNYCH (Side-Effects) ---
const ustawLadowanie = (stan) => () => { ladowanie.value = stan; };
const czyscKomunikaty = () => { bladKomunikat.value = ''; };
const ustawKomunikatBledu = (komunikat) => { bladKomunikat.value = komunikat; };

const wyslijZadanieLogowania = (validData) => 
  $fetch('http://localhost:3001/api/auth/logowanie', {
    method: 'POST',
    body: validData
  });

const zapiszTokenISesje = (odpowiedz) => {
  localStorage.setItem('token', odpowiedz.token);
  localStorage.setItem('rola', odpowiedz.rola);
  return odpowiedz.rola; // Przekazujemy rolę dalej do potoku
};

const PrzejdzDoStrony = (sciezka) => { navigateTo(sciezka); };

// --- 3. GŁÓWNY POTOK FUNKCYJNY (Pipeline) ---
const zaloguj = () => {
  czyscKomunikaty();
  ustawLadowanie(true)();

  Promise.resolve(form)
    .then(wyciagnijDane)
    .then(sprawdzPoprawnoscZod)
    .then(wyslijZadanieLogowania)
    .then(zapiszTokenISesje)
    .then(ustalSciezkeDlaRoli)
    .then(PrzejdzDoStrony)
    .catch((error) => 
      Promise.resolve(error)
        .then(wyciagnijBladZodLubApi)
        .then(ustawKomunikatBledu)
    )
    .finally(ustawLadowanie(false));
};
</script>

<style src="./login-rejestracja.css" scoped></style>