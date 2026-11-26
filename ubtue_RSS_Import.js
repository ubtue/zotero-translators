{
	"translatorID": "207ee4d9-6ba4-45c3-b2b8-cdb5f16ef977",
	"label": "ubtue_RSS_Import",
	"creator": "",
	"target": "rss",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
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

function doImport() {
    let xml = "";
    let chunk;

    while ((chunk = Z.read()) !== false) {
        xml += chunk;
    }
  
    let doc = new DOMParser().parseFromString(xml, "text/xml");
    let items = doc.getElementsByTagName("item");

    let rssItems = Array.from(doc.getElementsByTagName("item"));
    let index = 0;

    // call ubtue_RSS translator
    var translator = Zotero.loadTranslator("import");
    translator.setTranslator("207ee4d9-6ba4-45c3-b2b8-cdb5f16ef942");
    translator.setString(xml);
    translator.setHandler("itemDone", function (t, item) {
        let rssItem = rssItems[index++];
        if (!rssItem) {
            item.complete();
            return;
        }
        if (item.url.indexOf("theopodcast") !== -1) {
            let audioUrl = attr(rssItem, "enclosure", "url");
            if (audioUrl) item.url = audioUrl;
        }
        item.complete();
	});
    translator.translate();
}

/** BEGIN TEST CASES **/
var testCases = [
]
/** END TEST CASES **/

