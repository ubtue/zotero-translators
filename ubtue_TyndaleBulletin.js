{
	"translatorID": "04938f7b-4cda-4efa-bbe8-efc2fd6decb2",
	"label": "ubtue_TyndaleBulletin",
	"creator": "Helena Nebel",
	"target": "tyndalebulletin.org\\/",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 99,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2025-08-27 12:13:26"
}

/*
	***** BEGIN LICENSE BLOCK *****
	
	Copyright © 2022 Universitätsbibliothek Tübingen. All rights reserved.
	This file is part of Zotero.
	
	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.
	
	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Affero General Public License for more details.
	
	You should have received a copy of the GNU Affero General Public License
	along with Zotero.  If not, see <http://www.gnu.org/licenses/>.
	
	***** END LICENSE BLOCK *****
*/


function detectWeb(doc, url) {
	if (url.indexOf('/article/')>-1) {
		return "journalArticle";
	} else if (getSearchResults(doc, true)) {
		return "multiple";
	}
}

function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	var rows = ZU.xpath(doc, '//article//a[contains(@href, "/articles?id=")]|//li[@class="article"]//a[contains(@href, "/articles?id=")]');
	for (var i=0; i<rows.length; i++) {
		var href = rows[i].href;
		var title = ZU.trimInternal(rows[i].textContent);
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
			var articles = new Array();
			for (var i in items) {
				articles.push(i);
			}
			ZU.processDocuments(articles, scrape);
		});
	} else {
		scrape(doc, url);
	}
}

function scrape(doc, url) {
	var translator = Zotero.loadTranslator('web');
	translator.setTranslator('951c027d-74ac-47d4-a107-9c3069ab7b48');//Embedded Metadata
	translator.setHandler("itemDone", function(obj, item) {
		//Decode HTML entities in title, e.g. &#039;
		item.title = ZU.unescapeHTML(item.title);
		if (ZU.xpathText(doc, '//meta[@name="citation_journal_abbrev"]/@content') == "Tyndale Bulletin") {
			item.ISSN = '2752-7042';
		}
		item.complete();
	});
	translator.getTranslatorObject(function(trans) {
		trans.doWeb(doc, url);
	});

}

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://tyndalebulletin.org/article/27745-hosea-4-and-11-and-the-structure-of-hosea",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "Hosea 4 and 11, and the Structure of Hosea",
				"creators": [
					{
						"firstName": "John",
						"lastName": "Goldingay",
						"creatorType": "author"
					}
				],
				"date": "2020/11/1",
				"DOI": "10.53751/001c.27745",
				"ISSN": "0082-7118",
				"abstractNote": "Hosea 4:1-3 pronounces an indictment on the entire world as a way of getting home a message to Ephraim. It opens a series of biddings in 4:1–9:9 that seek to get Ephraim to face the facts about itself and about the danger it is in. Hosea 9:10–13:16 [14:1] then comprises a series of reminders of past and present realities in the relationship between Israel and Yahweh. Within it, 11:1-11 is not a self-contained pericope marking mercy’s final victory over wrath, but part of 11:1–12:1 [2], which continues to urge Ephraim to choose between doom and hope.",
				"issue": "2",
				"journalAbbreviation": "Tyndale Bulletin",
				"language": "en",
				"libraryCatalog": "tyndalebulletin.org",
				"pages": "181-190",
				"publicationTitle": "Tyndale Bulletin",
				"url": "https://tyndalebulletin.org/article/27745-hosea-4-and-11-and-the-structure-of-hosea",
				"volume": "71",
				"attachments": [
					{
						"title": "Full Text PDF",
						"mimeType": "application/pdf"
					},
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [
					{
						"tag": "hosea"
					},
					{
						"tag": "minor prophets"
					},
					{
						"tag": "old testament"
					},
					{
						"tag": "prophets"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/
