# Semantic Search Module

This repository contains a complete semantic search pipeline that:
- Crawls a website using Puppeteer.
- Builds a semantic index by generating text embeddings using a custom embedding model (served locally via Ollama).
- Provides an Express API for performing semantic search queries based on cosine similarity.

## Features

- **Web Crawler:** Crawls the target website and extracts page titles and text content.
- **Semantic Index Builder:** Processes crawled data, generates embeddings for each document, and builds a searchable index.
- **Semantic Search API:** A RESTful Express API that accepts a query, converts it into an embedding, performs a cosine similarity search, and returns the most relevant results.
- **Custom Embedding Model:** Uses a custom model (created with Ollama) for generating embeddings.

## Requirements

- Node.js (v18 or later)
- npm
- Ollama (installed and configured locally; see [ollama.com](https://ollama.com/))
- Ubuntu 22.04 (or similar Linux distribution)
