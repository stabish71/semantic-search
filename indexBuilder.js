// indexBuilder.js
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
  
  // Use the 'embeddings' field as returned by your curl test
  const embedding = data.embeddings;
  if (!Array.isArray(embedding)) {
    console.error("Invalid embedding returned:", data);
    throw new Error("Invalid embedding returned");
  }
  return embedding;
}

// Cosine similarity helper (if needed for later search)
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (normA * normB);
}

async function buildIndex() {
  const dataPath = path.resolve('crawledData.json');
  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const index = [];

  for (const doc of rawData) {
    // Combine title and content (you can preprocess if needed)
    const text = doc.title + "\n" + doc.content;
    console.log(`Generating embedding for: ${doc.url}`);
    const embedding = await generateEmbedding(text);
    index.push({
      url: doc.url,
      title: doc.title,
      content: doc.content,
      embedding,
    });
  }

  fs.writeFileSync('documentIndex.json', JSON.stringify(index, null, 2));
  console.log('Semantic index built and saved to documentIndex.json');
}

buildIndex();
