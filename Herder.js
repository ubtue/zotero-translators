{
	"translatorID": "4c0fcb0c-478e-4282-ba19-88f5f293eddf",
	"label": "Herder",
	"creator": "Johannes Riedl",
	"target": "^https?://(www\\.)?herder.de/",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2018-03-15 16:09:11"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2018 Johannes Riedl
	
	This file is part of Zotero.

	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with Zotero. If not, see <http://www.gnu.org/licenses/>.

	***** END LICENSE BLOCK *****
*/


// attr()/text() v2
function attr(docOrElem,selector,attr,index){var elem=index?docOrElem.querySelectorAll(selector).item(index):docOrElem.querySelector(selector);return elem?elem.getAttribute(attr):null;}function text(docOrElem,selector,index){var elem=index?docOrElem.querySelectorAll(selector).item(index):docOrElem.querySelector(selector);return elem?elem.textContent:null;}


function detectWeb(doc, url) {
	Z.debug("URL: " + url);
	var herderArticleRegex = new RegExp('/hefte/archiv/([\d\-]+/){2}[a-z\-]+/');
	if (url.match(herderArticleRegex)) {
		return "journalArticle";
	} else if (getSearchResults(doc, true)) {
		return "multiple";
	}
}


function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	var rows = doc.querySelectorAll('article a[href]');
//	Z.debug(rows);
	for (let i=0; i<rows.length; i++) {
		// TODO: check and maybe adjust
		let href = rows[i].href;
		// TODO: check and maybe adjust
		let title = ZU.trimInternal(rows[i].textContent);
		if (!href || !title) continue;
		if (checkOnly) return true;
		found = true;
		items[href] = title;
	}
	return found ? items : false;
}


function doWeb(doc, url) {
	if (detectWeb(doc, url) == "multiple") {
		Zotero.selectItems(getSearchResults(doc, false), function (items) {
			if (!items) {
				return true;
			}
			var articles = [];
			for (var i in items) {
				articles.push(i);
			}
			ZU.processDocuments(articles, scrape);
		});
	} else {
		scrape(doc, url);
	}
}

function  scrape(doc, url) {
	var item = new Zotero.Item('journalArticle');
	item.title = text(doc, 'h1');
//	item.url = attr(doc, 'link[rel="canonical"]', 'href')
    Z.debug("DEBUG: " + text(doc, '.byline a[href]'));
    var fullAuthorString = text(doc, '.byline a[href]');
    var creatorParts = fullAuthorString.split(" ");
    Z.debug(creatorParts);
    item.creators.push({
         firstName: creatorParts[0] !== null ? creatorParts[0] : "",
         lastName: creatorParts[1] !== null ? creatorParts[1] : "",
         creatorType: "author"
    });
    var infoLine = text(doc, '.article-infoline');
    var infoLineParts = infoLine.split(" ");
    // We have a strin like "ThPh 92 (2017) 577-583"
    Z.debug("infoLineParts.length:" + infoLineParts.length)
    if (infoLineParts.length == 4) {
        item.issue = infoLineParts[1];
        item.pages = infoLineParts[3];
        item.date = infoLineParts[2].trim();
    }
    //    item.accessDate = 
    item.abstractNote = text(doc,'.article-summary p')
    item.complete();
	
}



