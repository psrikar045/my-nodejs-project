# LinkedIn Company Scraper

## Description

A Node.js script that scrapes company data from LinkedIn public company profile pages. It uses Puppeteer for browser automation and Cheerio for HTML parsing. This script is designed to be robust and to extract a comprehensive set of data points from company profiles.

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
        node scrapeLinkedIn.js
        ```

3.  **Output:**
    The scraped data will be saved in a file named `output.json` in the same directory. A `scraper.log` file will also be created, containing a log of the scraping process.

4.  **Headless Mode:**
    By default, the script runs in headless mode. To run in "headful" mode (which shows the browser window), use the `--headful` flag:
    ```bash
    node scrapeLinkedIn.js --headful https://www.linkedin.com/company/google/
    ```

## Ethical Considerations

*   **Respect `robots.txt`:** This script checks the `robots.txt` file of the website before scraping. If scraping is disallowed, it will skip the URL.
*   **Human-like Behavior:** The script includes randomized delays between requests to mimic human browsing behavior and avoid overloading the server.
*   **LinkedIn's Terms of Service:** Be aware that scraping LinkedIn may be against their Terms of Service. Use this script responsibly and at your own risk. For professional and large-scale data extraction, consider using the official LinkedIn API or commercial data providers.

## Sample Input/Output

**Input (`urls.txt`):**
```
https://www.linkedin.com/company/google/
```

**Output (`output.json`):**
```json
[
  {
    "url": "https://www.linkedin.com/company/google/",
    "status": "Success",
    "logoUrl": "https://media.licdn.com/dms/image/C4E0BAQHi-8L1s_T22Q/company-logo_200_200/0/1615920999055?e=1729123200&v=beta&t=...",
    "bannerUrl": "https://media.licdn.com/dms/image/D4E16AQH-...",
    "aboutUs": "Google is a global technology company...",
    "website": "https://www.google.com",
    "verified": true,
    "industry": "Internet",
    "companySize": "10,001+ employees",
    "headquarters": "Mountain View, CA",
    "founded": "1998",
    "locations": [
      "Mountain View, CA",
      "New York, NY",
      "London, United Kingdom"
    ],
    "specialties": [
      "Search",
      "Advertising",
      "Mobile",
      "Android",
      "YouTube",
      "Cloud"
    ]
  }
]
```

## Troubleshooting

*   **Changes in LinkedIn's Website Structure:** LinkedIn frequently updates its website. If the script stops working, it's likely due to changes in the HTML structure. You may need to update the Cheerio selectors in `scrapeLinkedIn.js` to match the new structure. You can do this by inspecting the elements in your browser's developer tools.
*   **Rate Limiting and Bot Detection:** If you scrape too many pages in a short period, LinkedIn may temporarily block your IP address. The script includes delays to minimize this risk, but if you encounter issues, try increasing the delay or running the script less frequently. For more advanced scenarios, consider using a proxy service.
*   **Missing or Incomplete Data:** Some company profiles may not have all the data points that the script tries to extract. The script is designed to handle this gracefully, but you may see `null` or empty values in the output.
*   **Debugging with Headful Mode:** If you are having trouble with a specific page, running the script in headful mode (`--headful`) can help you see what's happening in the browser and identify any issues with the page loading or selectors.