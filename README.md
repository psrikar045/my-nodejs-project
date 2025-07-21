# LinkedIn Company Scraper

## Description

A Node.js script that scrapes company data from LinkedIn public company profile pages. It uses Puppeteer for browser automation and Cheerio for HTML parsing.

## Usage

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Provide input URLs:**

    *   **Option 1: Command-line arguments**
        ```bash
        node scrapeLinkedIn.js https://www.linkedin.com/company/google/ https://www.linkedin.com/company/microsoft/
        ```

    *   **Option 2: `urls.txt` file**
        Create a `urls.txt` file in the same directory as the script and add one LinkedIn company URL per line.
        ```
        https://www.linkedin.com/company/google/
        https://www.linkedin.com/company/microsoft/
        ```
        Then run the script without any command-line arguments:
        ```bash
        node scrapeLinkedIn..js
        ```

3.  **Output:**
    The scraped data will be saved in a file named `output.json` in the same directory.

## Ethical Considerations

*   **Respect `robots.txt`:** This script checks the `robots.txt` file of the website before scraping. If scraping is disallowed, it will skip the URL.
*   **Human-like Behavior:** The script includes randomized delays between requests to mimic human browsing behavior and avoid overloading the server.
*   **LinkedIn's Terms of Service:** Be aware that scraping LinkedIn may be against their Terms of Service. Use this script responsibly and at your own risk. For professional and large-scale data extraction, consider using the official LinkedIn API.

## Sample Input/Output

**Input (`urls.txt`):**
```
https://www.linkedin.com/company/google/
```

**Output (`output.json`):**
```json
[
  {
    "logoUrl": "https://media.licdn.com/dms/image/C4E0BAQHi-8L1s_T22Q/company-logo_200_200/0/1615920999055?e=1729123200&v=beta&t=...",
    "bannerUrl": "https://media.licdn.com/dms/image/D4E16AQH-..."
    "aboutUs": "Google is a global technology company...",
    "founded": "1998",
    "companySize": "10,001+ employees",
    "companyType": "Public Company"
  }
]
```

## Troubleshooting

*   **Changes in LinkedIn's Website Structure:** LinkedIn frequently updates its website. If the script stops working, it's likely due to changes in the HTML structure. You may need to update the Cheerio selectors in `scrapeLinkedIn.js` to match the new structure.
*   **Rate Limiting:** If you scrape too many pages in a short period, LinkedIn may temporarily block your IP address. The script includes delays to minimize this risk, but if you encounter issues, try increasing the delay or running the script less frequently.
*   **Headless Mode:** By default, the script runs in headless mode. If you need to debug or see what the browser is doing, you can set `headless: false` in the `puppeteer.launch()` options in `scrapeLinkedIn.js`.