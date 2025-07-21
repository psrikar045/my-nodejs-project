const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs').promises;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

async function isScrapingAllowed(url) {
  try {
    const robotsUrl = new URL('/robots.txt', url).href;
    const response = await fetch(robotsUrl);
    if (response.ok) {
      const robotsTxt = await response.text();
      // A simple check to see if the User-Agent is disallowed.
      // This is a basic implementation and might not cover all cases.
      return !robotsTxt.includes('Disallow: /');
    }
  } catch (error) {
    // If we can't fetch or parse robots.txt, we assume scraping is allowed.
    console.warn(`Could not fetch or parse robots.txt for ${url}. Proceeding with caution.`);
  }
  return true;
}

function delay(time) {
  return new Promise(function(resolve) {
      setTimeout(resolve, time)
  });
}

async function scrapeLinkedInCompany(url) {
  if (!await isScrapingAllowed(url)) {
    console.warn(`Scraping disallowed by robots.txt for ${url}. Skipping.`);
    return null;
  }

  console.log(`Scraping ${url}...`);
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);

  await delay(Math.random() * 3000 + 2000); // Random delay between 2-5 seconds

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });

    const content = await page.content();
    const $ = cheerio.load(content);

    const companyData = {
      logoUrl: $('.ember-view.org-top-card-primary-content__logo-container img').attr('src'),
      bannerUrl: $('.ember-view.org-top-card-primary-content__banner-container img').attr('src'),
      aboutUs: $('.org-about-us-organization-description__text-free-viewer').text().trim(),
      founded: $('dt:contains("Founded")').next('dd').text().trim(),
      companySize: $('dt:contains("Company size")').next('dd').text().trim(),
      companyType: $('dt:contains("Type")').next('dd').text().trim(),
    };

    console.log(`Successfully scraped ${url}`);
    return companyData;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  } finally {
    await browser.close();
  }
}

async function main() {
  let urls = [];
  if (process.argv.length > 2) {
    urls = process.argv.slice(2);
  } else {
    try {
      const data = await fs.readFile('urls.txt', 'utf8');
      urls = data.split('\n').filter(Boolean);
    } catch (error) {
      console.error('Error reading urls.txt:', error);
      return;
    }
  }

  // Randomize the order of URLs
  urls.sort(() => Math.random() - 0.5);

  const allCompanyData = [];
  for (const url of urls) {
    const companyData = await scrapeLinkedInCompany(url);
    if (companyData) {
      allCompanyData.push(companyData);
    }
  }

  try {
    await fs.writeFile('output.json', JSON.stringify(allCompanyData, null, 2));
    console.log('Successfully saved data to output.json');
  } catch (error) {
    console.error('Error writing to output.json:', error);
  }
}

main();
