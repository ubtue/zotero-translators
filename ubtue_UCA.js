{
	"translatorID": "484ff6d9-eccd-4933-a489-509ebbe9e14c",
	"label": "ubtue_UCA",
	"creator": "Hjordis Lindeboom",
	"target": "repositorio[.]uca[.]edu.ar",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2025-10-08 07:49:26"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2025 Hjordis Lindeboom

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
	//developed & tested for Sapientia
	if (doc.querySelector('meta[name="citation_title"]')) {
		return "journalArticle";
	}
	if (doc.querySelectorAll('td[headers="t3"] > strong > a[href*="/handle/"]').length > 1) {
		return "multiple";
	}

	return false;
}

function getSearchResults(doc, checkOnly) {
	const items = {};
	const rows = doc.querySelectorAll('td[headers="t3"] > strong > a[href*="/handle/"]');
	for (let row of rows) {
		const href = row.href;
		const title = row.textContent.trim();
		if (!href || !title) continue;
		if (checkOnly) return true;
		items[href] = title;
	}
	return checkOnly ? false : items;
}

function normalise_keywords(item) {
	for (let i = 0; i < item.tags.length; i++) {
		let keyword = item.tags[i].tag;
		if (keyword === keyword.toLocaleUpperCase()) {
			let normalised = ZU.capitalizeTitle(keyword, true);
			item.tags[i].tag = normalised;
		}
	}
}

function romanToArabic(roman) {
	const map = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };
	let total = 0, prev = 0;
	for (let i = roman.length - 1; i >= 0; i--) {
		let ch = roman[i].toUpperCase();
		let val = map[ch] || 0;
		if (val < prev) {
			total -= val;
		} else {
			total += val;
		}
		prev = val;
	}
	return total;
}

function doWeb(doc, url) {
	if (detectWeb(doc, url) === "multiple") {
		const items = getSearchResults(doc, false);
		Zotero.selectItems(items, function (selectedItems) {
			if (!selectedItems) return;
			const urls = Object.keys(selectedItems);
			Zotero.Utilities.processDocuments(urls, scrape);
		});
	} else {
		scrape(doc, url);
	}
}

async function scrape(doc, url = doc.location.href) {
	let translator = Zotero.loadTranslator('web');
	translator.setTranslator('951c027d-74ac-47d4-a107-9c3069ab7b48'); // Embedded Metadata
	translator.setDocument(doc);
	translator.setHandler("itemDone", function (t, item) {
		if (item.abstractNote) {
			let metaAbstracts = ZU.xpath(doc, '//meta[@name="DCTERMS.abstract"]');
			for (let meta of metaAbstracts) {
				let content = meta.getAttribute("content");
				if (!content) continue;
				let cleanedContent = content.replace(/^(Resumen:|Abstract:)\s*/i, '').trim();
				let cleanedItemAbstract = item.abstractNote.replace(/^(Resumen:|Abstract:)\s*/i, '').trim();
				if (cleanedContent !== cleanedItemAbstract) {
					item.notes.push('abs: ' + cleanedContent);
				} else {
					item.abstractNote = cleanedContent;
				}
			}
		}
		let breadcrumbItems = ZU.xpath(doc, '//ol[contains(@class, "breadcrumb")]/li');
		if (breadcrumbItems.length) {
			let lastItem = breadcrumbItems[breadcrumbItems.length - 1];
			let text = ZU.trimInternal(lastItem.textContent || "");
			let volIssueRegex = /Vol\.?\s*([IVXLCDM]+(?:[-–‑\-][IVXLCDM]+)?)\s+nro\.?\s*([\d-–‑\-]+)/i;
			let m = volIssueRegex.exec(text);
			if (m) {
				let volPart = m[1];
				let issuePart = m[2];
				let volumeValue;
				if (/[-–‑\-]/.test(volPart)) {
					let parts = volPart.split(/[-–‑\-]/);
					let v1 = romanToArabic(parts[0]);
					let v2 = romanToArabic(parts[1]);
					volumeValue = `${v1}/${v2}`;
				} else {
					volumeValue = romanToArabic(volPart).toString();
				}
				item.volume = volumeValue;

				let issueValue = issuePart.replace(/^0+/, '').replace(/[-–‑]/g, '/');
				item.issue = issueValue;
			}
		}
		item.tags = []
		let metaKeywords = ZU.xpath(doc, '//meta[@name="DC.subject"]');
		for (let tag of metaKeywords) {
			let keyword = tag.getAttribute("content");
			if (!keyword) continue;
			keyword = keyword.trim();
			if (keyword.toLowerCase() === "reseñas") {
				item.tags.push({ tag: "Book Review" });
			} else {
				item.tags.push({ tag: keyword });
			}
		}
		normalise_keywords(item);
		item.complete();
	});
	translator.translate();
}

/** BEGIN TEST CASES **/
var testCases = [
]
/** END TEST CASES **/
