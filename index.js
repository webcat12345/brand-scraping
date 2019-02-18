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
        await page.waitFor(10000);
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

function nextPage(page, currentPageNumber) {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('Next page...');
            await page.waitForSelector('.board_pager03 strong', {visible: true});
            await page.evaluate(() => {
                const current = document.querySelector('.board_pager03 strong').textContent;
                if (current % 10 === 0) {
                    document.querySelector('.board_pager03 .next').click();
                } else {
                    console.log(current % 10);
                    document.querySelectorAll('.board_pager03 a')[current % 10].click();
                }
            });
            await page.waitForResponse(SEARCH_API_URL);
            await page.waitFor(10000);
            const pageNum = await await page.evaluate(() => document.querySelector('.board_pager03 strong').textContent);
            console.log(`Expected page - ${currentPageNumber + 1} =======  Current selected page - ${pageNum}`);
            resolve(pageNum);
        } catch (e) {
            console.log('ERROR: Clicking next page is failed. Error Detail - ', e);
            reject(e);
        }
    });
}

async function goToSpecificPageBlock(page, pageNumber) {
    try {
        await page.waitForSelector('.board_pager03 strong', {visible: true});
        const pageBlock = parseInt(pageNumber / 10, 10);
        for (let i = 1; i <= pageBlock; i++) {
            await page.waitForSelector('.board_pager03 strong', {visible: true});
            await page.evaluate(() => {
                document.querySelector('.board_pager03 .next').click();
            });
            await page.waitForResponse(SEARCH_API_URL);
            await page.waitFor(1000);
            console.log(`Skipping to page block ${pageBlock} - current page block - ${i * 10 + 1} - ${i * 10 + 10}`);
        }
    } catch (e) {
        console.log('ERROR: Failed to go to specific page. Error Detail - ', e);
    }
}

async function savePageToPDF(page, currentPageNumber) {
    try {
        await page.pdf({path: `brands/${currentPageNumber}.pdf`, format: 'A4'});
        console.log(`Page ${currentPageNumber} is saved as ${currentPageNumber}.PDF`);
    } catch (e) {
        console.log('ERROR: Saving page failed. Error Detail - ', e);
    }
}

async function savePageToCSV(page, currentPageNumber) {
    try {
        await page.waitForSelector('.icon_exl', {visible: true});
        await page.evaluate(() => {
            document.querySelector('.icon_exl a').click();
        });
        console.log(`Page ${currentPageNumber} is saved as csv`);
    } catch (e) {
        console.log('ERROR: Saving page as CSV failed. Error Detail - ', e);
    }
}

async function run() {
    // start browser
    const browser = await puppeteer.launch({headless: true, args: ['--start-fullscreen', '--window-size=1920,1040']});
    const page = await browser.newPage();
    await page.setViewport({width: 1300, height: 800});
    await page.goto(SITE_URL);

    await startSearch(page);
    const totalPage = await getTotalPageCount(page);
    // await goToSpecificPageBlock(page, 184);
    // await savePageToPDF(page, 181);
    await savePageToPDF(page, 1);
    for (let i = 1; i < totalPage; i ++) {
        const real_page = await nextPage(page, i);
        if (parseInt(real_page, 10) === parseInt(i + 1, 10)) {
            await savePageToPDF(page, real_page);
            // await savePageToCSV(page, real_page);
        } else {
            i = real_page - 1;
        }

    }
    browser.close();
}

run();