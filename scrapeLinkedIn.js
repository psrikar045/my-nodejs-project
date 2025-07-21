const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const { createWriteStream } = require('fs');

const LOG_FILE = 'scraper.log';
const logger = createWriteStream(LOG_FILE, { flags: 'a' });

console.log = (message) => {
  logger.write(`${new Date().toISOString()} - INFO: ${message}\n`);
  process.stdout.write(`${message}\n`);
};

console.warn = (message) => {
  logger.write(`${new Date().toISOString()} - WARN: ${message}\n`);
  process.stdout.write(`${message}\n`);
};

console.error = (message, error) => {
  const errorMessage = error ? `: ${error.stack || error}` : '';
  logger.write(`${new Date().toISOString()} - ERROR: ${message}${errorMessage}\n`);
  process.stderr.write(`${message}${errorMessage}\n`);
};


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

async function scrapeLinkedInCompany(url, browser) {
  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);

  try {
    if (!await isScrapingAllowed(url)) {
      console.warn(`Scraping disallowed by robots.txt for ${url}. Skipping.`);
      return { url, status: 'Skipped', error: 'Scraping disallowed by robots.txt' };
    }

    console.log(`Scraping ${url}...`);
    let retries = 3;
    while (retries > 0) {
      try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        break;
      } catch (error) {
        console.warn(`Error loading page, retrying... (${retries} retries left)`);
        retries--;
        if (retries === 0) {
          throw error;
        }
      }
    }
    await delay(Math.random() * 3000 + 2000); // Random delay between 2-5 seconds

    // Navigate to the "About" page
    const aboutUrl = `${url.replace(/\/$/, '')}/about/`;
    await page.goto(aboutUrl, { waitUntil: 'networkidle2' });
    await delay(Math.random() * 3000 + 2000); // Random delay between 2-5 seconds

    // Click "Show more" button for "About Us"
    const showMoreButtonSelector = 'button[data-control-name="about_show_more"]';
    try {
      if (await page.$(showMoreButtonSelector) !== null) {
        await page.click(showMoreButtonSelector);
        await page.waitForTimeout(1000); // Wait for content to load
      }
    } catch (error) {
      console.warn('Could not click "Show more" button for About Us.');
    }

    const content = await page.content();
    const $ = cheerio.load(content);

    let jsonData = {};
    $('script[type="application/ld+json"]').each((i, el) => {
      const scriptContent = $(el).html();
      if (scriptContent) {
        const parsedJson = JSON.parse(scriptContent);
        if (parsedJson['@type'] === 'Organization') {
          jsonData = parsedJson;
        }
      }
    });

    // Click "Show all locations" button if it exists
    const showAllLocationsButtonSelector = 'button[data-control-name="about_show_all_locations"]';
    try {
      if (await page.$(showAllLocationsButtonSelector) !== null) {
        await page.click(showAllLocationsButtonSelector);
        await page.waitForTimeout(1000); // Wait for content to load
      }
    } catch (error) {
      console.warn('Could not click "Show all locations" button.');
    }

    const companyData = {
      url,
      status: 'Success',
      logoUrl: jsonData.logo || $('.org-top-card-primary-content__logo-container img').attr('src'),
      bannerUrl: jsonData.image ? jsonData.image.contentUrl : $('.org-top-card-primary-content__banner-container img').attr('src'),
      aboutUs: jsonData.description || $('p.org-about-us-organization-description__text').text().trim(),
      website: jsonData.url || $('dt:contains("Website")').next('dd').find('a').attr('href'),
      verified: $('.org-page-verified-badge').length > 0,
      industry: jsonData.industry || $('dt:contains("Industry")').next('dd').text().trim(),
      companySize: jsonData.numberOfEmployees ? `${jsonData.numberOfEmployees.minValue}-${jsonData.numberOfEmployees.maxValue} employees` : $('dt:contains("Company size")').next('dd').text().trim(),
      headquarters: jsonData.address ? `${jsonData.address.streetAddress}, ${jsonData.address.addressLocality}, ${jsonData.address.addressRegion}` : $('dt:contains("Headquarters")').next('dd').text().trim(),
      founded: jsonData.foundingDate || $('dt:contains("Founded")').next('dd').text().trim(),
      locations: $('.org-locations-module__location-item').map((i, el) => $(el).find('p').text().trim()).get(),
      specialties: jsonData.keywords ? jsonData.keywords.split(', ') : ($('dt:contains("Specialties")').next('dd').text().trim().split(', ') || []),
    };

    console.log(`Successfully scraped ${url}`);
    return companyData;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return { url, status: 'Failed', error: error.message };
  } finally {
    await page.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const headless = !args.includes('--headful');
  let urls = args.filter(arg => !arg.startsWith('--'));

  if (urls.length === 0) {
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

  const browser = await puppeteer.launch({ headless });
  const allCompanyData = [];
  for (const url of urls) {
    const companyData = await scrapeLinkedInCompany(url, browser);
    allCompanyData.push(companyData);
  }

  try {
    await fs.writeFile('output.json', JSON.stringify(allCompanyData, null, 2));
    console.log('Successfully saved data to output.json');
  } catch (error) {
    console.error('Error writing to output.json:', error);
  } finally {
    await browser.close();
  }
}

main();
