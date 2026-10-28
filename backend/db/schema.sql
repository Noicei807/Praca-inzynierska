DROP TABLE IF EXISTS wypozyczenia;
DROP TABLE IF EXISTS ksiazki;
-- Tabela uzytkownicy zostaje nietknięta, ewentualnie dodaj tu DROP jeśli chcesz czyścić wszystko

CREATE TABLE IF NOT EXISTS uzytkownicy (
    id int auto_increment primary key,
    email varchar(255) not null unique,
    haslo_hash varchar(255) not null,
    data_utworzenia timestamp default current_timestamp
);

CREATE TABLE IF NOT EXISTS ksiazki (
    id int auto_increment primary key,
    google_books_id varchar(255) unique,
    tytul varchar(255) not null,
    autor varchar(255) not null,
    wydawnictwo varchar(255),
    rok_wydania int,
    jezyk varchar(10),
    kategoria varchar(100),
    okladka_url text,
    ilosc int not null default 1,
    data_dodania timestamp default current_timestamp
);

CREATE TABLE IF NOT EXISTS wypozyczenia (
    id int auto_increment primary key,
    uzytkownik_id int not null,
    ksiazka_id int not null,
    data_wypozyczenia timestamp default current_timestamp,
    data_zwrotu timestamp null,
    status enum('aktywne','zwrocone') default 'aktywne',
    foreign key (uzytkownik_id) references uzytkownicy(id),
    foreign key (ksiazka_id) references ksiazki(id)
);