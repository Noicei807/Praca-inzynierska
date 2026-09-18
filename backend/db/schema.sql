create table if not exists uzytkownicy (
    id int auto_increment primary key,
    email varchar(255) not null unique,
    haslo_hash varchar(255) not null,
    data_utworzenia timestamp default current_timestamp
);

create table if not exists ksiazki (
    id int auto_increment primary key,
    google_books_id varchar(255) unique,
    tytul varchar(255) not null,
    autor varchar(255) not null,
    czy_dostepna boolean default true,
    data_dodania timestamp default current_timestamp
);

create table if not exists wypozyczenia (
    id int auto_increment primary key,
    uzytkownik_id int not null,
    ksiazka_id int not null,
    data_wypozyczenia timestamp default current_timestamp,
    data_zwrotu timestamp null,
    status enum('aktywne','zwrocone') default 'aktywne',
    foreign key (uzytkownik_id) references uzytkownicy(id),
    foreign key (ksiazka_id) references ksiazki(id)
);