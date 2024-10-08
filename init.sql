CREATE DATABASE [Banjo]
GO

USE [Banjo]
GO

CREATE TABLE songs (
    name VARCHAR NOT NULL,
    altnames _TEXT,
    artist TEXT,
    tabfound BOOL NOT NULL,
    tabs _TEXT,
    audio _TEXT,
    username TEXT,
    approved BOOL,
    description TEXT,
    unique_id INT4 NOT NULL nextval('"songs_unique-id_seq"'::regclass)
);
GO 

CREATE TABLE users (
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    email TEXT NOT NULL,
    admin BOOL NOT NULL,
    verified BOOL NOT NULL
);
GO
