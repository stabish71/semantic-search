// crawler.js
import puppeteer from 'puppeteer';
import fs from 'fs';

// Set the base URL to the domain you want to crawl.
const baseUrl = 'https://narayanaone.health';
const visitedUrls = new Set();
const pagesToVisit = [baseUrl];
const crawledData = [];

// Helper function to extract hostname
const getHostname = (url) => {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
};

const baseHostname = getHostname(baseUrl);

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  const crawlPage = async (url) => {
    if (visitedUrls.has(url)) return;
    visitedUrls.add(url);

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      const content = await page.evaluate(() => ({
        title: document.title,
        body: document.body.innerText,
      }));
      console.log(`Crawled: ${url}`);
      crawledData.push({
        url,
        title: content.title,
        content: content.body,
      });

      // Find all links on the page (as raw href attributes)
      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href]')).map(a => a.getAttribute('href'))
      );

      // Process each link: convert relative URLs to absolute ones
      links.forEach(link => {
        try {
          const absoluteUrl = new URL(link, url).href; // Convert relative to absolute URL
          const hostname = getHostname(absoluteUrl);
          // Enqueue if it's within the same domain and hasn't been visited
          if (hostname && hostname === baseHostname && !visitedUrls.has(absoluteUrl)) {
            pagesToVisit.push(absoluteUrl);
          }
        } catch (err) {
          // Skip invalid URLs
        }
      });
    } catch (err) {
      console.error(`Error crawling ${url}:`, err.message);
    }
  };

  while (pagesToVisit.length > 0) {
    const nextPage = pagesToVisit.pop();
    await crawlPage(nextPage);
  }

  await browser.close();

  // Save crawled data to a JSON file
  fs.writeFileSync('crawledData.json', JSON.stringify(crawledData, null, 2));
  console.log('Crawling complete. Data saved to crawledData.json');
})();
