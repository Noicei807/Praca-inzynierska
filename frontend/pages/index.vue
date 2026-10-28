<template>
  <div class="glowny box">
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

    <div class="wyszukiwarka-logo">
      <div class="logo">
        <img src="/logo.png" alt="LOGO"  class="zdjecie-logo">
      </div>
      <form class="wyszukiwarka" @submit.prevent="szukajZGlownej">
        <input type="text" class="pole-tekstowe" placeholder="Szukaj książki" v-model="frazaGlownej">
        <button type="submit" class="przycisk-szukaj">Szukaj</button>
      </form>
    </div>

    <!-- glowna zawartosc  -->
    <main class="zawartosc">

      <!-- animowana galeria -->
      <div class="galeria">
        <div 
          v-for="(tlo, index) in tlo"
          :key="index"
          class="slajd"
          :class="{aktualne:index === aktualne_zdjecie}"
          :style="{backgroundImage: `url(${tlo})`}"
        ></div>
        <div class="przyciemnienie"></div>
      </div>

      <!-- Kafelki z gatunkami - spięte z routingiem dynamicznym -->
      <div class="siatka">
        <div class="kafelek" @click="PrzejdzDoStrony('/Gatunek?kategoria=fantastyka')">Fantastyka</div>
        <div class="kafelek" @click="PrzejdzDoStrony('/Gatunek?kategoria=kryminał')">Kryminał i Sensacja</div>
        <div class="kafelek" @click="PrzejdzDoStrony('/Gatunek?kategoria=informatyka')">Informatyka</div>
        <div class="kafelek" @click="PrzejdzDoStrony('/Gatunek?kategoria=biografie')">Biografie</div>
        <div class="kafelek" @click="PrzejdzDoStrony('/Gatunek?kategoria=historia')">Historia</div>
        <div class="kafelek" @click="PrzejdzDoStrony('/Gatunek?kategoria=biznes')">Biznes i Ekonomia</div>
        <div class="kafelek" @click="PrzejdzDoStrony('/Gatunek?kategoria=psychologia')">Psychologia</div>
        <div class="kafelek" @click="PrzejdzDoStrony('/Gatunek?kategoria=nauka')">Nauka</div>
        <div class="kafelek" @click="PrzejdzDoStrony('/Gatunek?kategoria=rozwój')">Rozwój osobisty</div>
        <div class="kafelek" @click="PrzejdzDoStrony('/Gatunek?kategoria=literatura')">Literatura piękna</div>
        <div class="kafelek" @click="PrzejdzDoStrony('/Gatunek?kategoria=dzieci')">Dla dzieci</div>
        <div class="kafelek" @click="PrzejdzDoStrony('/Gatunek?kategoria=romans')">Romans</div>
      </div>
    </main>
  </div>
</template>

<!----------------------------------------------- ruchoma galeria---------------------------------------------- -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

/* Galeria */
const tlo = ['/book1.jpg', 'book2.jpg', 'book3.jpg', 'book4.jpg', 'book5.jpg ']
const aktualne_zdjecie = ref(0)
let timer = null
const interwal = 4000

onMounted(() =>{
  timer = setInterval(() => {
    aktualne_zdjecie.value = (aktualne_zdjecie.value + 1) % tlo.length
  }, interwal)
})

onUnmounted(() =>{
  clearInterval(timer)
})

/* Przejścia do stron - używamy navigateTo dla błyskawicznego działania bez mrugania ekranu! */
const PrzejdzDoStrony = (url) => {
  navigateTo(url);
}

/* Funkcja wyszukiwarki na stronie głównej */
const frazaGlownej = ref('');
const szukajZGlownej = () => {
  if(frazaGlownej.value.trim() !== '') {
    navigateTo(`/Gatunek?kategoria=${encodeURIComponent(frazaGlownej.value.trim())}`);
  }
}
</script>

<style src="./index.css" scoped></style>