# brand-scrapping
Web scrapping from Korean Brand website - http://kdtj.kipris.or.kr/kdtj/searchLogina.do?method=loginTM#page10

### Stacks we use

`node.js` and [puppeteer](https://github.com/GoogleChrome/puppeteer)

### Usage

* Clone repository from git
* `npm install` to install dependencies
* `npm run start` to run node.js server

Data will be saved as `brands/[pagenumber].pdf`

### Challenge points

* Pagination skip every 10 pages
* Wait for image downloaded to the browser cache

### TODO

* Start from specific page
* Error handling - extraction failed should stop process and notify to user
