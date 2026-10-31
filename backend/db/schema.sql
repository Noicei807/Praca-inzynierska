DROP TABLE IF EXISTS wypozyczenia;
DROP TABLE IF EXISTS ksiazki;
DROP TABLE IF EXISTS uzytkownicy;

CREATE TABLE IF NOT EXISTS uzytkownicy (
    id int auto_increment primary key,
    imie varchar(100) not null,
    nazwisko varchar(100) not null,
    email varchar(255) not null unique,
    haslo varchar(255) not null,
    rola varchar(50) default 'czytelnik',
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
    status enum('oczekujace','wypozyczone','zwrocone') default 'oczekujace',
    foreign key (uzytkownik_id) references uzytkownicy(id),
    foreign key (ksiazka_id) references ksiazki(id)
);