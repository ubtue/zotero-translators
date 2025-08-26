{
	"translatorID": "10ac2a96-3196-4911-bd08-a2d3cb0532c9",
	"label": "ubtue_Uni_Graz",
	"creator": "Paula Hähndel",
	"target": "https://unipub.uni-graz.at",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2025-08-26 11:22:20"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2023 Universitätsbibliothek Tübingen.  All rights reserved.
	Modified 2023 by Paula Hähndel
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
	if (getSearchResults(doc)) {
		return "multiple";
	}
	else {
		return "journalArticle";
	}
	//return false;
}

function getSearchResults(doc) {
	var items = {};
	var found = false;
	var rows = ZU.xpath(doc, '//li[contains(@class, "Article")]/a[span[span]]');
	for (let i = 0; i < rows.length; i++) {
		let href = rows[i].href;
		let title = ZU.trimInternal(rows[i].textContent.match(/: ?([^\n]+)/)[1]);
		if (!href || !title) continue;
		found = true;
		items[href] = title;
	}
	return found ? items : false;
}

function invokeEmbeddedMetadataTranslator(doc, url) {
	let translator = Zotero.loadTranslator("web");
	translator.setTranslator("951c027d-74ac-47d4-a107-9c3069ab7b48");
	translator.setDocument(doc);
	translator.setHandler("itemDone", function (t, item) {
		item.itemType = 'journalArticle';
		if (ZU.xpathText(doc, '//table[contains(@id, "Abstract")]')) {
			let abss = ZU.xpathText(doc, '//table[contains(@id, "Abstract")]').split(/(Abstract|Zusammenfassung)/);
			item.abstractNote = abss[2];
			for (let i = 2; i<abss.length/2; i++) {
				item.notes.push({'note': 'abs:' + abss[2*i]});
			}
		}
		let issueinfo = ZU.xpathText(doc, '//div[@class="valueDiv-3"]');
		if (issueinfo) {
			if (!item.volume && issueinfo.match(/Jahrgang (\d+)/)) item.volume = issueinfo.match(/Jahrgang (\d+)/)[1];
			if (!item.issue && issueinfo.match(/Heft (\d+)/)) item.issue = issueinfo.match(/Heft (\d+)/)[1];
			if (!item.pages && issueinfo.match(/Seiten? ([^\s,]+)/)) {
				item.pages = issueinfo.match(/Seiten? ([^\s,]+)/)[1];
				item.pages = item.pages.trim().replace(/^([^-]+)-\\1$/, '$1');
			}
		}
		if (ZU.xpathText(doc, '//tr[@id="mods_IdentifierDoi"]//td[@class="value "]')) {
			item.DOI = ZU.xpathText(doc, '//tr[@id="mods_IdentifierDoi"]//td[@class="value "]');
		}
		if (ZU.xpathText(doc, '//tr[@id="mods_subject"]//td[@class="value "]//span[@class="mods-topic"]')) {
			tags = ZU.xpathText(doc, '//tr[@id="mods_subject"]//td[@class="value "]//span[@class="mods-topic"]').split('/,');
			for (let i in tags) {
				item.tags.push(tags[i].trim());
			}
		}
		if (item.publicationTitle == "Limina") {
			item.ISSN = "2617-1953";
		}
		if (ZU.xpath(doc, '//tr[@id="mods_name-roleTerm_Author"]')) {
			authors = ZU.xpath(doc, '//tr[@id="mods_name-roleTerm_Author"]');
			for (let i in authors) {
				if(authors[i].innerHTML.includes("orcid")) {
					let name = authors[i].innerHTML.match(/>([^<]*),\s?([^<]*)<\/a>\s?<a\shref=\s?"https?:\/\/orcid/);
					firstname = name[2];
					lastname = name[1];
					orcid = authors[i].innerHTML.match(/<a\shref=\s?"https?:\/\/orcid\.org\/(\d{4}-\d{4}-\d{4}-\d{3}(?:\d|X|x))/)[1];
					item.notes.push({"note": "orcid:" + orcid + " | " + firstname + " " + lastname});
				}
			}
		}
		item.attachments = [];
		item.complete();
	});
	translator.translate();
}

function doWeb(doc, url) {
	if (detectWeb(doc, url) === "multiple") {
		Zotero.selectItems(getSearchResults(doc), function (items) {
			if (!items) {
				return true;
			}
			let articles = [];
			for (let i in items) {
				articles.push(i);
			}
			ZU.processDocuments(articles, invokeEmbeddedMetadataTranslator);
		});
	} else invokeEmbeddedMetadataTranslator(doc, url);
}

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://unipub.uni-graz.at/limina/periodical/titleinfo/8653624",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "https://unipub.uni-graz.at/limina/periodical/titleinfo/8653631",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "Radikale Gegenwart: Anmerkungen zu den aktuellen Konstellationen und Perspektivender akademischen katholischen Theologie",
				"creators": [
					{
						"firstName": "Rainer",
						"lastName": "Bucher",
						"creatorType": "author"
					}
				],
				"date": "2023",
				"DOI": "10.25364/17.6:2023.1.4",
				"ISSN": "2617-1953",
				"abstractNote": "Wo steht die akademische katholische Theologie im deutschen Sprachraum? Worum geht es ihr? Will man diese Frage nicht moralisierend behandeln, muss man sie topologisch fassen: Wo sind wir, die wir Theologie treiben, und in welchen Machtkonstellationen tun wir es? Dabei stellt sich von unserem Fach her eine drängende Frage: Geht es der Theologie um die akademische Form ihrer Themen oder um ihre Themen in akademischer Form? Nur Letzteres hätte irgendeinen religiösen Sinn und existentielle Bedeutung. Natürlich stellt sich diese Frage nach Nietzsche erst jenseits antiquarischer oder gar monumentalisch-triumphaler Traditionsverwaltung und selbst noch jenseits eines kritisch-akademischen Habitus, der zwar nicht der Dummheit des Traditionalismus oder gar den Untaten der Repression erliegt, aber doch recht schnell seinen Frieden macht mit der eigenen intellektuellen Selbstbehauptung und sich zu früh beruhigt in seinem Sieg gegen jene, die zu besiegen notwendig, aber nicht hinreichend ist. Der Aufsatz reflektiert die Machtkonstellationen der Theologie in ihrer gesellschaftlichen, universitären und kirchlichen Verortung. Und er fragt schließlich, wohin der Weg einer nicht kolonialisierten akademischen Theologie führen könnte, die wieder wird, was sie schon einmal war: ein authentisches Lehramt der Kirche und die produktive Verunsicherung ­eines bisweilen allzu irritationsresistenten Wissenschaftsbetriebes.",
				"issue": "1",
				"language": "en",
				"libraryCatalog": "unipub.uni-graz.at",
				"pages": "46-65",
				"publicationTitle": "Limina",
				"shortTitle": "Radikale Gegenwart",
				"url": "http://unipub.uni-graz.at/limina/8653631",
				"volume": "6",
				"attachments": [],
				"tags": [
					{
						"tag": "Orte der Theologie"
					},
					{
						"tag": "Perspektiven der Theologie als Irritationspotential von Kirche"
					},
					{
						"tag": "Wissenschaft und Geselschaft"
					},
					{
						"tag": "gesellschaftliche,"
					},
					{
						"tag": "katholische Theologie an Universitäten"
					},
					{
						"tag": "universitäre und kirchliche Kontexte der Theologie"
					}
				],
				"notes": [
					{
						"note": "abs:Where is academic Catholic theology situated in the German-speaking countries? What is its position? If we want to avoid moralising stances, we can turn to topological approaches: Where are we, those who practice theology, located? What are the power structures within which we operate? The core question that determines the position of our discipline must be answered first: Is theology’s main concern the academic process that is applied to its subject matter, or how its subject matter can be academically processed? Only the latter is worthwhile for religion and its existential meaning. This Nietzschean question presupposes that we have moved beyond an antiquated or even monumentalising and triumphal preservation of tradition. It also presupposes that we have abandoned a critical academic habitus that might not succumb to the fallacies of traditionalism or might not commit the crimes of repression, but still perpetuates intellectual self-affirmation and rests on the laurels of having won its battles, although not conclusively. This essay reflects on the power constellations that shape theology’s place within society, the university and the church. It also looks to the future and asks what the path of a decolonised, academic theology could look like – a theology that returns to what it once was: the authentic teaching of the Gospel and the stimulating disruption of at times disruption-resistant academia."
					}
				],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://unipub.uni-graz.at/limina/periodical/titleinfo/8653630",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "„Keiner fragt – Theologen antworten“: Die Zukunft der Theologie erfordert einen Blick von außen",
				"creators": [
					{
						"firstName": "Guido",
						"lastName": "Hunze",
						"creatorType": "author"
					}
				],
				"date": "2023",
				"DOI": "10.25364/17.6:2023.1.3",
				"ISSN": "2617-1953",
				"abstractNote": "Warum sie für Universität, Gesellschaft und den mündigen Menschen wichtig ist, kann die Theologie gut begründen und greift dabei auf soziologische, philosophische, kulturanthropologische, historische, psychologische und bildungstheoretische Hintergründe zurück. Gleichwohl hat sich die Wirkung solcher Begründungsskizzen als sehr kurzreichweitig erwiesen. Das Erklären nach außen hin, warum Theologie wichtig ist, führt nicht dazu, dass Rektorate oder gesellschaftliche Akteure besorgt sind bezüglich eines Rückbaus der Theologie an Universitäten. Auch der Rückgang der Zahl der Studieninteressierten bleibt davon unberührt. Offenkundig ist das Problem nicht in der theoretischen Selbstmodellierung des Faches zu suchen, vielmehr wird die Theologie als Wissenschaft nicht so erlebt, wie es ihre Wissenschaftstheorie und ihre gesellschaftliche Selbstbegründung erwarten ließen.Daher ist es notwendig, einen Blick auf die Wahrnehmung von Theologie in der Gesellschaft zu werfen. Dabei zeigt sich, dass unterbestimmt ist, wer „Religion“ im öffentlichen Diskurs repräsentiert: Welche Rolle kommt dabei Kirche, Theologie und erkennbar religiösen Personen zu? Umgekehrt ist zu fragen, wie die Theologie dieses „Außen“ des öffentlichen Diskurses wahrnimmt und wie sie ihre eigene(n) Rolle(n) darin professionell ausgestaltet. Mit dieser Verhältnisbestimmung von Außen- und Innensicht lassen sich Bedarfe ausmachen, von denen die Zukunft der Theologie an staatlichen Universitäten abhängt, und Wirkfaktoren identifizieren, um diese Bedarfe zu beeinflussen.",
				"issue": "1",
				"language": "en",
				"libraryCatalog": "unipub.uni-graz.at",
				"pages": "18-45",
				"publicationTitle": "Limina",
				"shortTitle": "„Keiner fragt – Theologen antworten“",
				"url": "http://unipub.uni-graz.at/limina/8653630",
				"volume": "6",
				"attachments": [],
				"tags": [
					{
						"tag": "Fakultät"
					},
					{
						"tag": "Gesellschaft"
					},
					{
						"tag": "Kirche"
					},
					{
						"tag": "Lehramtsausbildung"
					},
					{
						"tag": "Religion"
					},
					{
						"tag": "Theologie"
					},
					{
						"tag": "Universität"
					},
					{
						"tag": "Wissenschaft"
					},
					{
						"tag": "Wissenschaftlichkeit"
					},
					{
						"tag": "Wissenschaftskommunikation"
					},
					{
						"tag": "Wissenschaftstransfer"
					},
					{
						"tag": "Zukunft"
					},
					{
						"tag": "church"
					},
					{
						"tag": "faculty"
					},
					{
						"tag": "future"
					},
					{
						"tag": "humanities"
					},
					{
						"tag": "public"
					},
					{
						"tag": "religion"
					},
					{
						"tag": "science"
					},
					{
						"tag": "science communication"
					},
					{
						"tag": "society"
					},
					{
						"tag": "teacher education"
					},
					{
						"tag": "teacher training"
					},
					{
						"tag": "theology"
					},
					{
						"tag": "university"
					},
					{
						"tag": "Öffentlichkeit"
					}
				],
				"notes": [
					{
						"note": "abs:Theology can extensively demonstrate why it plays an important role for universities, society as a whole, and individuals, with reference to sociological, philosophical, cultural-anthropological, historical, psychological and educational examples and reasoning. However, these approaches to outlining theology’s importance have proven ineffective. Explaining to the external world why theology is important has not caused university and public decision-makers to show concern for shrinking theology departments. Likewise, student numbers continue their downward trend.It is clear that the problem is not situated in theology’s theoretical self-modelling. Rather, academic theology is not experienced in the same way as expected based on its scientific theory and social self-justification. It is therefore necessary to ask how society looks at theology. What we find is that there is no consensus on who represents “religion” in public discourse: What role do the church, theology and publicly visible, religious persons play in this discourse? On the other hand, theology must also reflect internally on how it perceives the “exterior” of public discourse, and how it shapes its own role(s) and professional approach. Examining this intersection of the external and internal can reveal factors that determine the future of theology at universities as well as effective approaches to leverage these factors."
					},
					{
						"note": "orcid:0009-0002-1634-576X | Guido Hunze | taken from website"
					}
				],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/
