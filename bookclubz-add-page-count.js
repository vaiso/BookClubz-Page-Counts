// ==UserScript==
// @name         Bookclubz - Add Page Count
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds a page count to books on Bookclubz.com want-to-read list
// @author       vaiso
// @match        https://bookclubz.com/*/book-inspiration
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// @require http://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js
// @require  https://gist.github.com/raw/2625891/waitForKeyElements.js
// ==/UserScript==
/* globals jQuery, $, waitForKeyElements */

main();

function main() {
    'use strict';

    // setTimeout to wait for the DOM to finish loading - cause TamperMonkey does not like EventListeners (╯°□°)╯︵ ┻━┻
    setTimeout(() => {
        let books = document.getElementsByClassName('title-author');
        for (let book of books) {
            let bookTitle = book.children[0].children[0].innerText
            getPageCountFromTitle(bookTitle)
                .then(pageCount => {
                    book.children[1].innerText = book.children[1].innerText + "\nPage count: " + pageCount;
                });
        }
    }, 1000); // absolutely disgusting
};

async function getPageCountFromTitle(bookTitle) {
    return getBookISBN(bookTitle)
        .then(res => {
            return getPageCountFromISBN(res);
        });
}

async function getPageCountFromISBN(isbn) {
    return postData('https://yoga.readinglength.com/', {
        "operationName":"BOOK_FROM_ISBN_QUERY",
        "variables":{
            "isbn":isbn
        },
        "query":"query BOOK_FROM_ISBN_QUERY($isbn: String!) {\n  findBook(isbn10: $isbn) {\n  pageCount\n  }\n}\n"
    }).then(res => {
        return res.data.findBook.pageCount;
    });
}

async function getBookISBN(bookTitle) {
    return postData('https://yoga.readinglength.com/', {
        "operationName":"SEARCH_KEYWORDS_QUERY",
        "variables":{
            "kw":bookTitle
        },
        "query":"query SEARCH_KEYWORDS_QUERY($kw: String!) {\n  bookSearch(first: 1, kw: $kw) {\n    isbn10\n}\n}\n"
    }).then(res => {
        return res.data.bookSearch[0].isbn10;
    });
}

/**
 * Creates a post request to the given URL, supplying the given data
 * Taken from the Mozilla fetch API - https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
 */
async function postData(url = '', data = {}) {
    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(data)
    });
    return response.json();
}