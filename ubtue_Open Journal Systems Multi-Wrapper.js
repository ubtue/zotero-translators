{
    "translatorID": "b60e74db-2e5d-4b2a-94ac-f484737364b1",
    "label": "Open Journal Systems Multi-Wrapper",
    "creator": "Madeesh Kannan",
    "target": "/issue/view/",
    "minVersion": "3.0",
    "maxVersion": "",
    "priority": 100,
    "inRepository": false,
    "translatorType": 4,
    "browserSupport": "gcsibv",
    "lastUpdated": "2019-07-31 17:00:25"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2019 Universitätsbibliothek Tübingen.  All rights reserved.

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.

	***** END LICENSE BLOCK *****
*/


function detectWeb(doc, url) {
    if (url.match(/\/issue\/view/))
        return "multiple";
}

function getSearchResults(doc) {
    var items = {};
    var found = false;
    var rows = ZU.xpath(doc, '//a[contains(@href, "/article/view/") and not(contains(@href, "/pdf"))]')
    for (let i = 0; i < rows.length; i++) {
        let href = rows[i].href;
        let title = ZU.trimInternal(rows[i].textContent);

        if (!href || !title)
            continue;
        if (title.match(/PDF|EPUB|XML|HTML|Download Full Text/i))
            continue;
        found = true;
        items[href] = title;
    }
    return found ? items : false;
}

function invokeBestTranslator(doc, url) {
    var translator = Zotero.loadTranslator("web");
    translator.setDocument(doc);
    translator.setHandler("translators", function (o, t) {
        translator.setTranslator(t);
        translator.translate();
    });
    translator.setHandler("itemDone", function (t, i) {
        i.complete();
    });
    translator.getTranslators();
}

function doWeb(doc, url) {
    let items = getSearchResults(doc);
    if (items) {
        Zotero.selectItems(items, function (items) {
            if (!items) {
                return true;
            }
            let articles = [];
            for (let i in items) {
                articles.push(i);
            }
            ZU.processDocuments(articles, invokeBestTranslator);
        });
    } else {
        // attempt to skip landing pages for issues
        let tocLinks = ZU.xpath(doc, '//a[contains(@href, "/issue/view/") and not(contains(@href, "/pdf"))]')
        for (let entry in tocLinks) {
            let link = tocLinks[entry].href;
            if (link.match(/\/issue\/view\/\d+\/showToc$/i)) {
                ZU.processDocuments([link], invokeBestTranslator);
                break;
            }
        }
    }
}