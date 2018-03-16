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
	"lastUpdated": "2018-03-16 15:03:28"
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
	var herderArticleRegex = new RegExp('/hefte/archiv/([\\d\\-]+/){2}[a-z\\-]+/');
	Z.debug("Regex: " + herderArticleRegex);
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
		if (!href || !title || rows[i].title.includes("Kommentare")) continue;
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
    var fullAuthorString = text(doc, '.byline a[href], .author a[href]');
    if (fullAuthorString !== null) {
        var creatorParts = fullAuthorString.split(" ");
        Z.debug(creatorParts);
        item.creators.push({
            firstName: creatorParts[0] !== null ? creatorParts[0] : "",
             lastName: creatorParts[1] !== null ? creatorParts[1] : "",
             creatorType: "author"
        });
    }
    var infoLine = text(doc, '.article-infoline');
    if (infoLine !== null) {
        var infoLineParts = infoLine.split(" ");
        // We have a strin like "ThPh 92 (2017) 577-583"
        Z.debug("infoLineParts.length:" + infoLineParts.length)
        if (infoLineParts.length == 4) {
            item.issue = infoLineParts[1];
            item.pages = infoLineParts[3];
            item.date = infoLineParts[2].trim();
        }
    }
    item.url = url;
    item.abstractNote = text(doc,'.article-summary p')
    item.complete();
	
}



/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://www.herder.de/thph/hefte/archiv/92-2017/4-2017/",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "https://www.herder.de/thph/hefte/archiv/92-2017/4-2017/theologische-thomasforschung-im-englischen-und-deutschen-sprachraum/",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "Theologische Thomasforschung im englischen und deutschen Sprachraum",
				"creators": [
					{
						"firstName": "Bernhard",
						"lastName": "Knorn",
						"creatorType": "author"
					}
				],
				"date": "(2017)",
				"abstractNote": "Die Theologie des Thomas von Aquin ist seit der Mitte des 20. Jahrhunderts in der Fundamentaltheologie und Dogmatik deutlich weniger berücksichtigt worden als zuvor. Im englischen Sprachraum hat jedoch in den letzten 20 Jahren eine theologische Thomas-Renaissance begonnen. Der Beitrag unterscheidet zunächst vier verschiedene Richtungen im Rahmen dieses neuen Interesses an Thomas in der Theologie und stellt diese dar. Sodann werden durch eine kritische Besprechung zweier Thomas-Handbücher aus dem Jahr 2016 aktuelle Zugänge zu Thomas im englischen und im deutschen Sprachraum miteinander verglichen: der von Philip McCosker und Denys Turner herausgegebene Cambridge Companion to the Summa Theologiae und das von Volker Leppin herausgegebene Thomas Handbuch. Im Ergebnis steht ein oft unmittelbarer Zugang zu Thomas’ Texten einer von historischer Thomasforschung geprägten Deutung gegenüber.",
				"issue": "92",
				"libraryCatalog": "Herder",
				"pages": "577-583",
				"url": "https://www.herder.de/thph/hefte/archiv/92-2017/4-2017/theologische-thomasforschung-im-englischen-und-deutschen-sprachraum/",
				"attachments": [],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://www.herder.de/el/hefte/archiv/2018/3-2018/aufschieberitis-ueberwinden/",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "Alltagsspiritualität: \"Aufschieberitis\" überwinden",
				"creators": [
					{
						"firstName": "Anselm",
						"lastName": "Grün",
						"creatorType": "author"
					}
				],
				"libraryCatalog": "Herder",
				"shortTitle": "Alltagsspiritualität",
				"url": "https://www.herder.de/el/hefte/archiv/2018/3-2018/aufschieberitis-ueberwinden/",
				"attachments": [],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/
