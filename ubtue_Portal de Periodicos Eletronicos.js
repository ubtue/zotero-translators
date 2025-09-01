{
	"translatorID": "44e1cd2d-f0cb-43d9-95c2-653bd17b625f",
	"label": "ubtue_Portal de Periodicos Eletronicos",
	"creator": "Madeesh Kannan",
	"target": "^https?://periodicos.pucminas.br/",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 90,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2025-09-01 10:38:22"
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
	if (url.match(/\/issue\/view\//))
		return "multiple";
	else if (url.match(/\/article\/view\//)) {
		// placeholder, the OJS translator fills in the correct item type
		return "journalArticle";
	}
}

function getSearchResults(doc) {
	var items = {};
	var found = false;
	var rows = ZU.xpath(doc, '//div[@class="tocTitle"]/a')
	for (let i=0; i<rows.length; i++) {
		let href = rows[i].href;
		let title = ZU.trimInternal(rows[i].textContent);
		if (!href || !title) continue;
		found = true;
		items[href] = title;
	}
	return found ? items : false;
}

function postProcess(doc, item) {
	item.complete();
}

function invokeOJSTranslator(doc) {
	var translator = Zotero.loadTranslator("web");
	translator.setTranslator("a5d5ca83-b975-4abe-86c9-d956d7b9c8fa");
	translator.setDocument(doc);
	translator.setHandler("itemDone", function (t, i) {
		postProcess(doc, i);
	});
	translator.translate();
}

function doWeb(doc, url) {
	if (detectWeb(doc, url) === "multiple") {
		Zotero.selectItems(getSearchResults(doc), function (items) {
			if (!items) {
				return true;
			}
			var articles = [];
			for (var i in items) {
				articles.push(i);
			}
			ZU.processDocuments(articles, invokeOJSTranslator);
		});
	} else
		invokeOJSTranslator(doc);
}

/** BEGIN TEST CASES **/
var testCases = [
]
/** END TEST CASES **/
