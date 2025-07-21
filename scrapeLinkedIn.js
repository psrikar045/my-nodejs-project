const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
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


const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36';


function delay(time) {
  return new Promise(function(resolve) {
      setTimeout(resolve, time)
  });
}

async function scrapeLinkedInCompany(url, browser) {
  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);

  try {

    console.log(`Scraping ${url}...`);
    const aboutUrl = url.endsWith('/') ? `${url}about/` : `${url}/about/`;
    let retries = 3;
    while (retries > 0) {
      try {
        await page.goto(aboutUrl, { waitUntil: 'networkidle2' });
        break;
      } catch (error) {
        console.warn(`Error loading page, retrying... (${retries} retries left)`);
        retries--;
        if (retries === 0) {
          throw error;
        }
      }
    }

    const pageTitle = await page.title();
    if (pageTitle.includes('Sign Up | LinkedIn')) {
      console.warn(`Skipping ${url} due to authentication wall.`);
      return { url, status: 'Skipped', error: 'Authentication wall' };
    }
    await delay(Math.random() * 5000 + 5000); // Random delay between 5-10 seconds

    // Click "Show more" button if it exists
    const showMoreButtonSelector = '.org-about-us-organization-description__show-more-button';
    if (await page.$(showMoreButtonSelector) !== null) {
      try {
        const showMoreButton = await page.$(showMoreButtonSelector);
        const rect = await page.evaluate(el => {
          const { top, left, width, height } = el.getBoundingClientRect();
          return { top, left, width, height };
        }, showMoreButton);

        await page.mouse.move(rect.left + rect.width / 2, rect.top + rect.height / 2, { steps: 10 });
        await page.mouse.click(rect.left + rect.width / 2, rect.top + rect.height / 2);
        await page.waitForTimeout(1000); // Wait for content to load
      } catch (error) {
        console.warn('Could not click "Show more" button.');
      }
    }

    const content = await page.content();
    console.log(content);
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

    const companyData = {
      url,
      status: 'Success',
      logoUrl: jsonData.logo || $('.org-top-card-primary-content__logo-container img').attr('src'),
      bannerUrl: jsonData.image ? jsonData.image.contentUrl : $('.org-top-card-primary-content__banner-container img').attr('src'),
      aboutUs: $('.org-about-us-organization-description__text-free-viewer').text().trim(),
      website: $('dt:contains("Website")').next('dd').find('a').attr('href'),
      verified: $('.org-page-verified-badge').length > 0,
      industry: $('dt:contains("Industry")').next('dd').text().trim(),
      companySize: $('dt:contains("Company size")').next('dd').text().trim(),
      headquarters: $('dt:contains("Headquarters")').next('dd').text().trim(),
      founded: $('dt:contains("Founded")').next('dd').text().trim(),
      locations: [], // This will be populated later
      specialties: $('dt:contains("Specialties")').next('dd').text().trim().split(', '),
    };

    // Extract locations
    $('dt:contains("Locations")').next('dd').find('li').each((i, el) => {
      companyData.locations.push($(el).text().trim());
    });

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
