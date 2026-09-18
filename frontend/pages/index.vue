<template>
  <div class = "glowny box">
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
      <div class="wyszukiwarka">
       <input type="text" class="pole-tekstowe" placeholder="Szukaj książki">
       <button class="przycisk-szukaj">Szukaj</button>
      </div>
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




    <!-- Kafelki z gatunkami -->
      <div class="siatka">
        <div class="kafelek" @click="PrzejdzDoStrony('/Fantastyka')">Fantastyka</div>
        <div class="kafelek">Kryminał i Sensacja</div>
        <div class="kafelek">Informatyka</div>
        <div class="kafelek">Biografie</div>
        <div class="kafelek">Historia</div>
        <div class="kafelek">Biznes i Ekonomia</div>
        <div class="kafelek">Psychologia</div>
        <div class="kafelek">Nauka</div>
        <div class="kafelek">Rozwój osobisty</div>
        <div class="kafelek">Literatura piękna</div>
        <div class="kafelek">Dla dzieci</div>
        <div class="kafelek">Romans</div>
      </div>
    </main>
  </div>
</template>

<!----------------------------------------------- ruchoma galeria---------------------------------------------- -->
<script setup>

/* Galeria*/
import { ref, onMounted, onUnmounted } from 'vue'

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
}
)

/* Przejscia do stron */
const PrzejdzDoStrony = (url) => {
  window.location.href = url;
}
</script>

<style src="./index.css" scoped></style>
