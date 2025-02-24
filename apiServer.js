// apiServer.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// Updated generateEmbedding function
async function generateEmbedding(text) {
  const response = await fetch('http://localhost:11434/api/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: text,
      model: 'Llama3.1:Latest'
    }),
  });
  const data = await response.json();
  console.log("Embedding for:", text, "->", data.embeddings);
  return data.embeddings;
}


// Cosine similarity helper
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (normA * normB);
}

// Load the semantic index from file
function loadIndex() {
  const indexPath = path.resolve('documentIndex.json');
  return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
}

// Semantic search: filter out docs without valid embeddings
function semanticSearch(queryEmbedding, index, topN = 5) {

  const vecA = [1, 0];
  const vecB = [0, 1];
  console.log(cosineSimilarity(vecA, vecB));
  return;
  if (!Array.isArray(queryEmbedding)) {
    throw new Error("Query embedding is not an array");
  }
  const results = index
    .filter(doc => Array.isArray(doc.embedding))
    .map(doc => {
      const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
      return { ...doc, similarity };
    });
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, topN);
}

const app = express();
app.use(express.json());

app.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required.' });

    // Generate embedding for the user's query
    const queryEmbedding = await generateEmbedding(query);
    // Load your semantic index
    const index = loadIndex();
    // Find the top 5 most similar documents
    const results = semanticSearch(queryEmbedding, index, 5);
    res.json({ query, results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Semantic search API is running on port ${PORT}`);
});
