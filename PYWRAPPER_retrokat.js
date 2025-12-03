{
	"translatorID": "8455a486-e268-49db-95b0-071fe098cf6a",
	"label": "PYWRAPPER_retrokat",
	"creator": "",
	"target": ".*pywrapper.*",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2025-12-02 14:38:19"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2025 YOUR_NAME <- TODO
	
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
	if (url.includes("pywrapper_retrokat.py") && url.includes("volume")) {
		return "multiple";
	}
	if (url.includes("pywrapper_retrokat.py")) {
		return "journalArticle";
	}
	return false;
}

async function doWeb(doc, url) {
    if (detectWeb(doc, url) === "multiple") {
        let spans = doc.getElementsByTagName("span");
        if (spans.length !== 1) {
            Z.debug("ERROR: Invalid length: " + spans.length);
            return;
        }
        let itemsArray;
        try {
            itemsArray = JSON.parse(spans[0].textContent.trim());
        } catch (e) {
            Z.debug("JSON parse error: " + e);
            return;
        }
        let items = {};
        for (let item of itemsArray) {
            items[item.title] = item;
        }
        let selected = await Zotero.selectItems(items);
        if (!selected) return;
        for (let title in selected) {
            scrape(items[title]);
        }
    } else {
        let spans = doc.getElementsByTagName("span");
        if (spans.length !== 1) {
            Z.debug("ERROR: Invalid length: " + spans.length);
            return;
        }
        let data;
        try {
            data = JSON.parse(spans[0].textContent.trim());
        } catch (e) {
            Z.debug("JSON parse error: " + e);
            return;
        }
        scrape(data);
    }
}

function scrape(data) {
	let itemType = data.itemType || "journalArticle";
	let item = new Zotero.Item(itemType);
	const simpleFields = [
		"title", "abstractNote", "publicationTitle", "volume", "issue",
		"pages", "date", "series", "seriesTitle", "seriesText",
		"journalAbbreviation", "language", "DOI", "ISSN", "shortTitle",
		"url", "accessDate", "archive", "archiveLocation",
		"libraryCatalog", "callNumber", "rights"
	];

	for (let field of simpleFields) {
		if (data[field]) item[field] = data[field];
	}
	if (Array.isArray(data.creators)) {
		for (let c of data.creators) {
			item.creators.push({
				firstName: c.firstName || "",
				lastName:  c.lastName  || "",
				creatorType: c.creatorType || "author"
			});
		}
	}
	if (Array.isArray(data.attachments)) {
		for (let att of data.attachments) {
			item.attachments.push(att);
		}
	}
	if (Array.isArray(data.notes)) {
		for (let noteObj of data.notes) {
			let n = (noteObj.note || "").replace(/<\/?.+?>/g, "");
			item.notes.push({ note: n });
		}
	}
	let newTags = [];
	if (Array.isArray(data.tags)) {
		newTags = data.tags.filter(t => typeof t === 'object' ? t.tag !== "Book Review" && t.tag !== "Reviews" : t !== "Book Review" && t !== "Reviews");
		if (data.tags.includes("Book Review") || data.tags.includes("Reviews")) {
			newTags.push({ tag: "Book Review" });
		}
		item.tags = newTags.map(t => (typeof t === 'object' && t.tag) ? t : { tag: t });
	}

	if (data.extra) {
		const orcidMatch = data.extra.match(/\b\d{4}-\d{4}-\d{4}-\d{3}[\dX]\b/);
		const orcidID = orcidMatch ? orcidMatch[0] : '';
		let nameMatch = data.extra.match(/\(([^)]+)\)/);
		if (!nameMatch) {
			const nameBeforeOrcid = data.extra.match(/ORCID\s*:\s*(.+?)\s*:/);
  			nameMatch = nameBeforeOrcid ? [null, nameBeforeOrcid[1].trim()] : null;
		}
		const extractedName = nameMatch ? nameMatch[1].trim() : '';
		const creatorName =	extractedName && extractedName.length > 0 ? extractedName : item.creators.length ? item.creators[0].firstName + ' ' + item.creators[0].lastName : '';
		item.notes.push({ note: 'orcid:' + orcidID + ' ' + ' | ' + ' ' + creatorName });
	}

	item.complete();
}

/** BEGIN TEST CASES **/
var testCases = [
]
/** END TEST CASES **/
