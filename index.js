const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Middleware to parse JSON requests
app.use(express.json());

// Basic GET route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Perform semantic search on the index
function semanticSearch(queryEmbedding, index, topN = 5) {
  const results = index.map(doc => {
    const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
    return { ...doc, similarity };
  });
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, topN);
}

// Load the semantic index from file
function loadIndex() {
  const indexPath = path.resolve('documentIndex.json');
  return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
}

// Same embedding function used during index building
async function generateEmbedding(text) {
  const response = await fetch('http://localhost:11434/api/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: text, model: 'your-embedding-model' }),
  });
  const data = await response.json();
  return data.embedding;
}

// Cosine similarity function
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (normA * normB);
}

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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Semantic search API is running on port ${PORT}`);
});
