{
	"translatorID": "da81dd7b-8beb-469c-aeca-b973f697083b",
	"label": "ubtue_Journal_Religion_Film",
	"creator": "Mara Spieß",
	"target": "https://digitalcommons.unomaha.edu/jrf/vol",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2025-08-26 09:00:58"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2022 Mara Spieß

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


function detectWeb(doc, url) {
	const articlePattern = /\/vol\d+\/iss\d+\/\d+/;
	const multiplePattern = /\/vol\d+\/iss\d+\/$/;
	if (articlePattern.test(url)) {
		return 'journalArticle';
	}
	else if (multiplePattern.test(url)) {
		return 'multiple';
	}
	return false;
}

function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	var rows = doc.querySelectorAll('div.doc > p > a[href^="https://digitalcommons.unomaha.edu/jrf/"]');
	for (let row of rows) {
		let href = row.href;
		let title = ZU.trimInternal(row.textContent);
		if (!href || !title) continue;
		if (checkOnly) return true;
		found = true;
		items[href] = title;
	}
	return found ? items : false;
}

async function doWeb(doc, url) {
	if (detectWeb(doc, url) == 'multiple') {
		let items = await Zotero.selectItems(getSearchResults(doc, false));
		if (!items) return;
		for (let url of Object.keys(items)) {
			await scrape(await requestDocument(url));
		}
	}
	else {
		await scrape(doc, url);
	}
}

async function scrape(doc, url = doc.location.href) {
	let translator = Zotero.loadTranslator('web');
	// Embedded Metadata
	translator.setTranslator('951c027d-74ac-47d4-a107-9c3069ab7b48');
	translator.setDocument(doc);
	
	translator.setHandler('itemDone', (_obj, item) => {
		item.notes.push("articleid:" + item.pages);
		item.pages = "";
		item.complete();
	});

	let em = await translator.getTranslatorObject();
	
	await em.doWeb(doc, url);
}

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://digitalcommons.unomaha.edu/jrf/vol28/iss1/61/",
		"detectedItemType": "newspaperArticle",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "Mary Magdalene on Film in Twenty-first Century: A Feminist Theological Critique",
				"creators": [
					{
						"firstName": "Mary Ann",
						"lastName": "Beavis",
						"creatorType": "author"
					}
				],
				"date": "2024",
				"DOI": "10.32873/uno.dc.jrf.28.01.61",
				"ISSN": "1092-1311",
				"abstractNote": "Since the turn of the millennium, several films (and one popular TV series) featuring Mary Magdalene as a significant character, or even as the central character, have been produced. A few, specifically Son of God (2104), The Chosen (2017-), and Mary Magdalene (2019), gained a wide audience through some combination of theatrical release, television, and streaming services. Unlike earlier productions that unfailingly portrayed her conventionally as a penitent prostitute, these and other, less well-known films of recent decades have departed from this traditional Magdalene. This is no doubt due, among other things, to the influence of feminist theology and biblical studies, which since the 1980s, have definitively shown that there is no scriptural evidence that Mary Magdalene was either a prostitute, or in special need of repentance. Unfortunately, however, these productions tend to find another way to situate the Magdalene as abject relative to Jesus, and inevitably downplay the role of other women disciples in the Jesus movement. In addition, although most eschew the “penitent whore” stereotype, they tend to reiterate the “martyr/love story” narrative associated with prostitution in film.",
				"issue": "1",
				"language": "en",
				"libraryCatalog": "digitalcommons.unomaha.edu",
				"publicationTitle": "Journal of Religion & Film",
				"shortTitle": "Mary Magdalene on Film in Twenty-first Century",
				"url": "https://digitalcommons.unomaha.edu/jrf/vol28/iss1/61",
				"volume": "28",
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
						"tag": "Biblical Studies"
					},
					{
						"tag": "Biblical Women"
					},
					{
						"tag": "Feminist Theology"
					},
					{
						"tag": "Film"
					},
					{
						"tag": "Mary Magdalene"
					}
				],
				"notes": [
					"artikelID:61"
				],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/
