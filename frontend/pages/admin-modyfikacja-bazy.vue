<template>
<div class="glowny">
    <!------------------- pasek nawigacji - css globalny -------------------------->
    <nav class="nawigacja">
      <div class="menu">
        <button class="przycisk-zmiana-dodawanie">Zmień na panel dodawania</button>
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
        <select class="sortowanie-kategoria">
          <option value="rosnaco">Fantastyka</option>
          <option value="malejaca">Kryminał i Sensacja</option>
          <option value="malejaca">Informatyka</option>
          <option value="malejaca">Biografie</option>
          <option value="malejaca">Historia</option>
          <option value="malejaca">Biznes i Ekonomia</option>
          <option value="malejaca">Psychologia</option>
          <option value="malejaca">Nauka</option>
          <option value="malejaca">Rozwój osobisty</option>
          <option value="malejaca">Literatura piękna</option>
          <option value="malejaca">Dla dzieci</option>
          <option value="malejaca">Romans</option>
        </select>
      </div>      
    </div>
      <div class="grupa-filtrow">
        <h2>Cena</h2>
        <select class="sortowanie-ogolny">
          <option value="rosnaco">Cena od najniższej</option>
          <option value="malejaca">Cena od najwyższej</option>
        </select>
        <div class="zakres-cen">
          <input type="number" placeholder="Od" class="input-ogolny">
          <span> - </span>
          <input type="number" placeholder="Do" class="input-ogolny">
        </div>
      </div>

        <div class="grupa-filtrow">
        <h2>Autor</h2>
        <select class="sortowanie-ogolny">
          <option value="alfabetycznie">Od A do Z</option>
          <option value="odwrotnie">Od Z do A</option>
        </select>
          <div class="lista-checkboxow">
            <label><input type="checkbox" value="przyklad1">Przyklad1</label>
            <label><input type="checkbox" value="przyklad2">Przyklad2</label>
            <label><input type="checkbox" value="przyklad3">Przyklad3</label>
            <label><input type="checkbox" value="przyklad4">Przyklad4</label>
          </div>
        </div>

        <div class="grupa-filtrow">
        <h2>Tytuł</h2>
        <select class="sortowanie-ogolny">
          <option value="alfabetycznie">Od A do Z</option>
          <option value="odwrotnie">Od Z do A</option>
        </select>
        </div>
      
        <div class="grupa-filtrow">
        <h2>Wydawnictwo</h2>
          <div class="lista-checkboxow">
            <label><input type="checkbox" value="przyklad1">Przyklad1</label>
            <label><input type="checkbox" value="przyklad2">Przyklad2</label>
            <label><input type="checkbox" value="przyklad3">Przyklad3</label>
            <label><input type="checkbox" value="przyklad4">Przyklad4</label>
            </div>
        </div>

        <div class="zastosowanie-filtrow">
          <button class="zastosuj">Zastosuj</button>
          <button class="wyczysc">Wyczyść</button>
        </div>

  </div>

  <div class="prawa-strona">

    <div class="modyfikacja">
        <h1>Panel modyfikacji bazy danych</h1>
    </div>

    <div class="wyszukiwarka-logo">

      <div class="logo">
        <img src="/logo.png" alt="LOGO"  class="zdjecie-logo">
      </div>
      <div class="wyszukiwarka">
       <input type="text" class="pole-tekstowe" placeholder="Szukaj książki">
       <button class="przycisk-szukaj">Szukaj</button>
      </div>
    </div>


<div class="widok-wyszukanych-ksiazek">

  </div>
</div>

</div>
</div>

  </template>



<style src="./Kategoria.css"   scoped></style>
<style src="./admin-modyfikacja-bazy.css"   scoped></style>



