# LinkedIn Company Scraper

This script scrapes public LinkedIn company profiles to extract key information. It's designed to be robust against dynamic class names and other anti-scraping measures.

## Features

- Extracts company logo, banner image, website, industry, company size, headquarters, specialties, and more.
- Prioritizes `application/ld+json` schema for reliable data extraction.
- Uses robust, content-based selectors for "About Us," "Founded," and "Locations" when JSON-LD data is unavailable.
- Simulates human-like interactions (mouse movements, clicks) to access dynamically loaded content.
- Handles "Show more" and "Show all locations" buttons.
- Includes randomized delays to mimic human browsing behavior.
- Provides detailed logging for debugging.

## How to Use

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Create `urls.txt`:**
    Create a file named `urls.txt` in the root of the project and add one LinkedIn company profile URL per line.

3.  **Run the scraper:**
    ```bash
    node scrapeLinkedIn.js
    ```
    To run in "headful" mode (to see the browser), use:
    ```bash
    node scrapeLinkedIn.js --headful
    ```

4.  **View the output:**
    The scraped data will be saved in `output.json`.

## Robust Scraping Strategies

This scraper employs several strategies to ensure reliable data extraction, especially for fields that are often difficult to scrape:

### "About Us"

1.  **JSON-LD First:** The scraper first attempts to extract the company description from the `application/ld+json` data.
2.  **Content-Based HTML Scraping:** If the description is not in the JSON-LD data, the scraper will:
    - Find and click the "About" or "Overview" tab using text-based searches.
    - Click any "Show more" buttons to reveal the full text.
    - Extract the text from the "About Us" or "Overview" section.

### "Founded"

1.  **JSON-LD First:** The scraper looks for the `foundingDate` in the `application/ld+json` data.
2.  **Content-Based HTML Scraping:** If not found in JSON-LD, it searches for the "Founded" label within the "About" section and extracts the corresponding value.

### "Locations"

1.  **JSON-LD First:** The scraper attempts to get locations from the `application/ld+json` data.
2.  **Content-Based HTML Scraping:** If not available in JSON-LD, it will:
    - Find the "Locations" section on the page.
    - Click the "Show all locations" button if it exists.
    - Extract all listed locations.

## Troubleshooting

- **Empty Fields:** If you're getting empty fields for `aboutUs`, `founded`, or `locations`, it could be due to:
    - **LinkedIn UI Changes:** LinkedIn frequently changes its layout. The content-based selectors are designed to be resilient, but significant changes might require updating the script.
    - **Bot Detection:** LinkedIn has strong anti-bot measures. If you run the scraper too frequently or from a cloud IP, you might be blocked or served a different version of the page. Running in "headful" mode (`--headful`) can sometimes help.
    - **Dynamic Content:** The data you're looking for might be loaded dynamically after some user interaction that the scraper is not yet simulating. Check the `scraper.log` file to see if the scraper is successfully finding and clicking the necessary tabs and buttons.

- **Errors:** Check the `scraper.log` file for any errors during the scraping process. This will provide clues as to what went wrong.