{
	"translatorID": "207ee4d9-6ba4-45c3-b2b8-cdb5f16ef942",
	"label": "ubtue_RSS",
	"creator": "",
	"target": "rss",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 400,
	"inRepository": true,
	"translatorType": 1,
	"lastUpdated": "2026-11-12 10:12:26"
}

/*
        ***** BEGIN LICENSE BLOCK *****

        Copyright © 2026 University Library of Tuebingen

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

var rssInput;

const NS = {
    dc: "http://purl.org/dc/elements/1.1/"
};

function getInput() {
    if (rssInput !== undefined) {
        return rssInput;
    }
    rssInput = "";
    var line;
    while ((line = Z.read()) !== false) {
        rssInput += line;
    }
    return rssInput;
}

function detectImport() {
    var input = getInput();
    return /<(rss|feed)\b/i.test(input);
}

function text(node, tag) {
	let el = node.getElementsByTagName(tag)[0];
	return el ? el.textContent.trim() : "";
}

function attr(node, tag, attrName) {
    let el = node.getElementsByTagName(tag)[0];
    return el ? el.getAttribute(attrName) : "";
}

function dcText(node, tag) {
    let els = node.getElementsByTagNameNS(NS.dc, tag);
    return els.length ? els[0].textContent.trim() : "";
}

function first() {
    for (let i = 0; i < arguments.length; i++) {
        if (arguments[i]) {
            return arguments[i];
        }
    }
    return "";
}

function addAuthors(item, authorString) {
    if (!authorString) {
        return;
    }
    let authors = authorString.split(/\s*(?:,|;|\bund\b|\band\b)\s*/i);
    for (let author of authors) {
        author = author.trim();
        if (!author) {
            continue;
        }
        item.creators.push(ZU.cleanAuthor(author, "author"));
    }
}

function doImport() {
	let xml = "";
	let chunk;

	while ((chunk = Z.read()) !== false) {
		xml += chunk;
	}

	let doc = new DOMParser().parseFromString(xml, "text/xml");
    let items = doc.getElementsByTagName("item").length
            ? doc.getElementsByTagName("item")
            : doc.getElementsByTagName("entry");
    let language = text(doc, "language");

    for (let rssItem of items) {
        let item = new Zotero.Item("blogPost");
        item.title = text(rssItem, "title");
        addAuthors(item,
            first(
                text(rssItem, "author"),
                dcText(rssItem, "creator")
            )
        );
        item.url = first(
            text(rssItem, "link"),
            attr(rssItem, "link", "href")
        );
        let abstractNote = text(rssItem, "description");
        item.abstractNote = ZU.unescapeHTML(abstractNote);
        item.date = first(
            text(rssItem, "pubDate"),
            dcText(rssItem, "date"),
            text(rssItem, "published")
        );

        let categories = rssItem.getElementsByTagName("category");
        for (let i = 0; i < categories.length; i++) {
            let tag = categories[i].textContent.trim();
            if (tag) {
                item.tags.push(tag);
            }
        }
        let subjects =  rssItem.getElementsByTagNameNS(NS.dc, "subject");
        for (let i = 0; i < subjects.length; i++) {
            let tag = subjects[i].textContent.trim();
            if (tag) {
                item.tags.push(tag);
            }
        }
        if (language) item.language = language;
        let publisher = dcText(rssItem, "publisher");
        if (publisher) item.publisher = publisher;

        //itunes
        let itunes_author = text(rssItem, "itunes:author")
        if (itunes_author) {
           item.creators = [];
           addAuthors(item, itunes_author);
           item.itemType = 'podcast';
        }
        let video_id = text(rssItem, "yt:videoId");
        if (video_id) item.itemType = 'videoRecording';

        item.complete();
    }
}

/** BEGIN TEST CASES **/
var testCases = [
]
/** END TEST CASES **/

