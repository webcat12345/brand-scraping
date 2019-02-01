const puppeteer = require('puppeteer');

const SITE_URL = 'http://kdtj.kipris.or.kr/kdtj/searchLogina.do?method=loginTM#page1';
const SEARCH_API_URL = 'http://kdtj.kipris.or.kr/kdtj/grrt1000a.do?method=searchTM';
const SEARCH_KEY = 'PD=[20000101~20191231]';

async function startSearch(page) {
    try {
        await page.click('#queryText');
        await page.keyboard.type(SEARCH_KEY);
        await page.keyboard.type(String.fromCharCode(13));
        console.log('Search started...');
        await page.waitForResponse(SEARCH_API_URL);
        await page.waitFor(6000);
        // await page.waitForNavigation();
        console.log('Search finished... checking page');
    } catch (e) {
        console.log('ERROR: Search failed. Error Detail - ', e);
    }
}

async function getTotalPageCount(page) {
    try {
        await page.waitForSelector('.articles', {visible: true});
        const element = await page.$('.articles');
        let text = await page.evaluate(element => element.textContent, element);
        text = text.replace(/\,/g, '');
        const index = text.search(/\//g);

        // sample text format - Total 1,730,209 Articles (1 / 57,674 Pages)

        const value = text.substring(index + 2, text.length - 7);
        const totalPageCount = parseInt(value, 10);
        console.log(`Total Page Count - ${totalPageCount}`);
        return totalPageCount;
    } catch (e) {
        console.log('ERROR: Getting total page count failed. Error Detail - ', e);
        return 0;
    }
}

async function nextPage(page, currentPageNumber) {
    try {
        await page.evaluate( () => {
            Array.from(document.querySelectorAll( '.board_pager03 a' ))
                .filter( element => element.textContent === `${currentPageNumber + 1}` )[0].click();
        });
        console.log('Go to next page, Page Number - ', currentPageNumber + 1);
        await page.waitForResponse(SEARCH_API_URL);
        await page.waitFor(6000);
    } catch (e) {
        console.log('ERROR: Clicking next page is failed. Error Detail - ', e);
    }
}

async function run() {
    // start browser
    const browser = await puppeteer.launch({headless: false, args: ['--start-fullscreen', '--window-size=1920,1040']});
    const page = await browser.newPage();
    await page.setViewport({width: 1300, height: 800});
    await page.goto(SITE_URL);

    await startSearch(page);
    const totalPage = await getTotalPageCount(page);
    await nextPage(page, 1);


    // await page.pdf({path: 'brands/1.pdf', format: 'A4'});
    browser.close();
}

run();