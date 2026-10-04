-- ============================================================
-- database.sql
-- Script de creación de la base de datos para Librería Pablito
-- Ejecutar: psql -U postgres -f database.sql
-- ============================================================

-- Crear la base de datos (ejecutar por separado si da error)
-- CREATE DATABASE libreria_pablito;

\c libreria_pablito;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'visitante')),
  avatar_url VARCHAR(500) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de libros
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  genre VARCHAR(100) DEFAULT 'General',
  status VARCHAR(30) DEFAULT 'por_leer' CHECK (status IN ('por_leer', 'leyendo', 'leido', 'abandonado')),
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  notes TEXT DEFAULT '',
  cover_url VARCHAR(500) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
