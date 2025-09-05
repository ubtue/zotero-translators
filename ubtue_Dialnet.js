{
	"translatorID": "30617d79-1aad-44d5-adf1-b30fa52b6a54",
	"label": "ubtue_Dialnet",
	"creator": "Philipp Zumstein",
	"target": "^https?://dialnet\\.unirioja\\.es/",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 99,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2025-09-05 06:58:24"
}

/*
	***** BEGIN LICENSE BLOCK *****
	
	Copyright © 2016 Philipp Zumstein
	
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
	if (url.indexOf('/servlet/articulo')>-1) {
		return "journalArticle";
	} else if (url.indexOf('/servlet/libro')>-1) {
		return "book";
	} else if (url.indexOf('/servlet/tesis')>-1) {
		return "thesis";
	} else if (getSearchResults(doc, true)) {
		return "multiple";
	}
}

function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	var rows = ZU.xpath(doc, '//p/span[@class="titulo"]/a');
	for (var i=0; i<rows.length; i++) {
		var href = rows[i].href;
		if (!href.includes('libro')) {
		var title = ZU.trimInternal(rows[i].textContent);
		if (!href || !title) continue;
		if (checkOnly) return true;
		found = true;
		items[href] = title;
		}

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

function getORCID(doc, item) {
	let authorSpans = doc.querySelectorAll('div[style*="margin-bottom"] > span');
	for (let span of authorSpans) {
		let authorLink = span.querySelector('a[href^="/servlet/autor"]');
		let orcidLink = span.querySelector('a[href^="https://orcid.org/"]');
		if (authorLink && orcidLink) {
			let authorName = authorLink.textContent.trim().replaceAll(',','');
			let orcidMatch = orcidLink.href.match(/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/i);
			if (orcidMatch) {
				let orcid = orcidMatch[1];
				item.notes.push({note: "orcid:" + orcid + " | " + authorName});
			}
		}
	}
	item.notes = Array.from(new Set(item.notes.map(JSON.stringify))).map(JSON.parse);
}

function normaliseTitle(title) {
	if (title) {
		let match = title.match(/^\s*((?:[A-Z][A-Z\.]*(?:\s+|$)){2,})(.*)/);
		if (match) {
			let upperTitle = match[1].trim();
			let rest = match[2].trim();
			let capitalized = ZU.capitalizeTitle(upperTitle, true);
			return capitalized + (rest ? " " + rest : "");
		}
	}
}

function scrape(doc, url) {
	var translator = Zotero.loadTranslator('web');
	// Embedded Metadata
	translator.setTranslator('951c027d-74ac-47d4-a107-9c3069ab7b48');
	translator.setHandler('itemDone', function (obj, item) {
		item.url = url;
		if (item.title && item.title.match(/^\s*((?:[A-Z][A-Z\.]*(?:\s+|$)){2,})(.*)/))
			item.title = normaliseTitle(item.title);
		// Delete generic abstract as "Información del artículo <title>"
		if (item.abstractNote && item.abstractNote.includes(item.title) && item.abstractNote.length<item.title.length+30 || item.abstractNote.match(/Autoría|Localización/)) {
			delete item.abstractNote;
		}
		// abstracts from DC
		let abstractNr = 0;
		let abstracts = doc.querySelectorAll('meta[name="DC.description"]');
		if (abstracts) {
			for (let abstract of abstracts) {
			if (abstractNr == 0) item.abstractNote = Zotero.Utilities.trimInternal(abstract.content);
			else item.notes.push('abs:' + Zotero.Utilities.trimInternal(abstract.content));
			abstractNr += 1;
			}
		}
		// in case of double issue e.g. "3-4" wrong issue number in Embedded Metadata e,g. "3" 
		var issue = ZU.xpathText(doc, '//*[@id="informacion"]//a[contains(text(), "Nº")]');
		if (issue) {
			var issueEntry = issue.split('Nº')[1].split(',')[0].trim();
			if (issueEntry) item.issue = issueEntry.replace('-','/');
		}
		// variable for other split seperator 'Fasc.''
		var multiIssue = ZU.xpathText(doc, '//*[@id="informacion"]//a[contains(text(), "Fasc.")]');
 		if (multiIssue) {
 			item.issue = multiIssue.split('Fasc.')[1].split(',')[0].trim();
 		}
		if (item.issue) {
			if (item.issue === item.volume) delete item.issue;
		}

		var citationPdfUrlMeta = doc.querySelector('li[id="noTexto"]');
			if (citationPdfUrlMeta) {
				if (!item.notes) {
						item.notes = [];
				}
				if (!item.notes.some(note => note.note && note.note.includes("no_pdf:Artikelseite enthält keinen Volltext"))) {
						item.notes.push({note: "no_pdf:Artikelseite enthält keinen Volltext"});
				}
			}
		
		if (item.title.match(/ISBN/ig)) item.tags.push("Book Review");
		let allTitle =doc.querySelectorAll('meta[name="DC.title"]');
		if (allTitle) {
			allTitle.forEach((additionalTitle, index) => {
			let alternativeTitle = ZU.trimInternal(additionalTitle.content);
			if (/^\s*((?:[A-Z][A-Z\.]*(?:\s+|$)){2,})(.*)/.test(alternativeTitle)) alternativeTitle = normaliseTitle(alternativeTitle);
			if (index === 0) item.title = alternativeTitle;
			else if (alternativeTitle !== item.title) item.notes.push('additional_title:' + alternativeTitle);
			});
		}
		if (item.ISSN = '0018-215X') {
			if (ZU.xpathText(doc, '//div[@class="resenas"]'))
				item.tags.push("Book Review")
			getORCID(doc, item)
		}
		if (item.tags) {
			for (let t of item.tags) {
				if (t.includes('Book Review')) {
					item.tags = item.tags.slice(-1);
				}
			}
		}
		if (!item.tags.includes('Book Review')) delete item.tags;
		item.attachments = [];
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
		"url": "https://dialnet.unirioja.es/servlet/libro?codigo=293780",
		"detectedItemType": "book",
		"items": [
			{
				"itemType": "book",
				"title": "Libres, buenos y justos como miembros de un mismo cuerpo: lecciones de teoría del derecho y de derecho natural",
				"creators": [
					{
						"firstName": "Julián Vara",
						"lastName": "Martín",
						"creatorType": "author"
					}
				],
				"date": "2007",
				"ISBN": "9788430945450",
				"language": "spa",
				"libraryCatalog": "dialnet.unirioja.es",
				"publisher": "Tecnos",
				"shortTitle": "Libres, buenos y justos como miembros de un mismo cuerpo",
				"url": "https://dialnet.unirioja.es/servlet/libro?codigo=293780",
				"attachments": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=3661304",
		"detectedItemType": "journalArticle",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "Juicios, discursos y acción política en grupos de jóvenes estudiantes universitarios de Bogotá",
				"creators": [
					{
						"firstName": "Martha Cecilia Lozano",
						"lastName": "Ardila",
						"creatorType": "author"
					},
					{
						"firstName": "Sara Victoria Alvarado",
						"lastName": "Salgado",
						"creatorType": "author"
					}
				],
				"date": "2011",
				"ISSN": "1692-715X",
				"abstractNote": "This article presents the outcome of research conducted between 2006 and 2009 on speeches\nand policy action in seven groups of young university students in Bogotá.\nTheoretical, epistemological and methodological research was supported by the approach of Hannah Arendt\n(2001a, 2001b), were supplemented by the insights of Kohn (2005), Brunet (2007), Sánchez (2003), Rosenthal\n(2006) and Fraser (1997, 2008).\nThe research was developed from four main categories: conceptions of political citizenship; constraints of\npolitics, democracy and citizenship; trigger political action by young people and forms of political action by\nyoung people. It concludes with the need for education for political participation and ethics in Colombia\nreconfiguration.",
				"issue": "1",
				"language": "spa",
				"libraryCatalog": "dialnet.unirioja.es",
				"pages": "101-113",
				"publicationTitle": "Revista Latinoamericana de Ciencias Sociales, Niñez y Juventud",
				"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=3661304",
				"volume": "9",
				"attachments": [],
				"notes": [
					"abs:En este artículo se presentan los resultados de la investigación llevada a cabo entre 2006 y\n2009 sobre discursos y acción política en siete grupos de jóvenes estudiantes universitarios de Bogotá.\nTeórica, epistemológica y metodológicamente, se sustentó la investigación en los planteamientos de Hannah\nArendt (2001a, 2001b), se complementaron con las comprensiones de Kohn (2005), Brunet (2007), Sánchez\n(2003), Greppi (2006) y Fraser (1997, 2008).\nEl trabajo se desarrolló desde cuatro categorías fundamentales: concepciones de política, ciudadanía;\ncondicionantes de la política, democracia y la ciudadanía; detonantes de la acción política del los colectivos de\njóvenes y las formas de acción política de los jóvenes y las jóvenes. Se Concluye con la necesidad de una educación\npara la participación política y la reconfiguración ética en Colombia.",
					"abs:Este artigo apresenta os resultados de uma pesquisa realizada entre 2006 e 2009, em discursos\ne ação política em sete grupos de jovens universitários em Bogotá.\nTeóricas, epistemológicas e metodológicas de pesquisa foi suportada pela abordagem de Hannah Arendt\n(2001a, 2001b), foram complementadas com as idéias de Kohn (2005), Brunet (2007), Sánchez (2003),\nRosenthal (2006) e Fraser (1997, 2008).\nO trabalho foi desenvolvido a partir de quatro categorias principais: as concepções de cidadania política;\nrestrições da política, da democracia e da cidadania; desencadear uma ação política por parte dos jovens e das\nformas de ação política dos jovens. Conclui-se com a necessidade de educação para a participação política e ética\nna reconfiguração da Colômbia."
				],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://dialnet.unirioja.es/buscar/documentos?querysDismax.DOCUMENTAL_TODO=politica",
		"detectedItemType": "multiple",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "https://dialnet.unirioja.es/ejemplar/381860",
		"detectedItemType": "multiple",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=7567487",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "Antropología filosófica de Karol Jósef Wojtyla",
				"creators": [
					{
						"firstName": "Vicente González",
						"lastName": "Radío",
						"creatorType": "author"
					}
				],
				"date": "2020",
				"ISSN": "0573-2018",
				"issue": "1-2",
				"language": "spa",
				"libraryCatalog": "dialnet.unirioja.es",
				"pages": "11-34",
				"publicationTitle": "Compostellanum: revista de la Archidiócesis de Santiago de Compostela",
				"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=7567487",
				"volume": "65",
				"attachments": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=7558938",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "Calasanz y Nikolsburg",
				"creators": [
					{
						"firstName": "Miguel Angel",
						"lastName": "Asiain",
						"creatorType": "author"
					}
				],
				"date": "2020",
				"ISSN": "0569-9789",
				"abstractNote": "El artículo es un estudio documentado sobre la fundación primera escolapia fuera de Italia, en Nikolsburg (ahora Mikulov, en la República Checa y en los años que contempla este estudio en Moravia. Fue pedida a San José de Calasanz por el Cardenal Francisco Dietrichstein (1570-1636), gobernador de Moravia, que había nacido en España por ser hijo del embajador moravo en Madrid. La fundación se llevó a cabo y fue mantenida por el Cardenal que siempre manifestó su agradecimiento a Calasanz. El estudio se centra solamente en los años de la fundación y primera consolidación (1631 a 1648). La fuentes documentales son básicamente los epistolarios calasancios ya publicados: Epistolario de Calasanz, dos Epistolarios de Cartas a él dirigidas y Epistolario de correspondencia entre escolapios durante la vida de Calasanz. Destacan los escolapios que fueron enviados y crearon la escuela, el internado y varias congregaciones asociativas para los escolares. La presencia escolapia acabó en 1884, al reclamar derechos propios sobre toda la obra los herederos del Cardenal",
				"language": "spa",
				"libraryCatalog": "dialnet.unirioja.es",
				"pages": "11-231",
				"publicationTitle": "Analecta calasanctiana: publicación semestral religioso cultural y de investigación histórica",
				"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=7558938",
				"volume": "123",
				"attachments": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=8362911",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "La Retorica del silenzio nelle Confessioni di Agostino di Ippona",
				"creators": [
					{
						"firstName": "Giorgio",
						"lastName": "Gilioli",
						"creatorType": "author"
					}
				],
				"date": "2021",
				"ISSN": "0569-9789",
				"abstractNote": "There were three main tasks of classical rhetoric: to instruct, delight and move the soul to action. In the Confessions it is noted that these are overcome by an unconventional use of the instruments of the ars in which the rhetor Augustine was a master, in order to pursue a further philosophical purpose: to say the ineffable. It is the use of a rhetorical word that is intended to be circular, tautochronous, oblique, poetic, oracular and paradoxical in its silent eloquence. Through a philosophical reading of the rhetorical fi gures we intend to highlight the circularity and tautochrony of this word which claims to invoke, praise and know the unknowable, but which cannot ignore faith and the intelligence of what it believes in. There are two ways in which these rhetorical tools are highlighted: fi rstly, through their obliquity, typical of a language that ceaselessly tries to overcome its limits, fi nding a sort of new path to “say with art”, second Quintilian’s defi nition of a fi gure of speech. Subsequently, through his unusual silence, precisely of a saying that says nothing in its claim to express the inexpressible and that, in this not saying, says more than if he had said a lot. It is therefore a rhetoric of silence, which does not accept not to say the unspeakable, pretending to overcome the limits imposed by a reductive discourse, which denies any possibility of saying what is considered ineffable par excellence, the Supreme Being. . A rhetoric that is the desperate voice of Augustine’s soul, and that does not give up, even at the cost of being reduced to saying through a mirror, in a confused way (1 Cor 13:12).Therefore, in this work, a philosophical study of the rhetorical techniques used by the bishop of Hipona develops, with particular attention to the fi gures of locution, used as a tool to overcome the anguish of a strictly apophatic language, so that the Christian mission could be realized of proclamation of the Incarnate Word.",
				"language": "ita",
				"libraryCatalog": "dialnet.unirioja.es",
				"pages": "475-497",
				"publicationTitle": "Analecta calasanctiana: publicación semestral religioso cultural y de investigación histórica",
				"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=8362911",
				"volume": "126",
				"attachments": [],
				"notes": [
					"abs:La retórica clásica habla de tres tareas principales: instruir, deleitar y mover el alma a la acción. En las Confesiones de San Agustín se advierte un uso poco convencional de los instrumentos del “ars” para perseguir un propósito filosófico ulterior: decir lo inefable. Uso de una palabra retórica que pretende ser circular, tautocrónica, oblicua, poética, oracular y paradójica en su elocuencia silenciosa. A través de una lectura filosófica de las fi guras retóricas pretendemos resaltar la circularidad y tautocronía de esta palabra que pretende invocar, alabar y conocer lo incognoscible, pero que no puede ignorar la fe y la inteligencia de aquello en lo que cree. Hay formas retóricas que destacan en la antigüedad: en primer lugar, la oblicuidad, propia de un lenguaje que intenta incesantemente superar sus límites, encontrando una suerte de camino nuevo para “decir con arte; segundo, una fi gura del discurso, según Quintiliano. A través de su insólito silencio, de un dicho que nada dice pero que pretende expresar lo inexpresable y que, en este no decir, dice más que si hubiera dicho mucho. Es La retórica del silencio, que no acepta el no decir lo indecible y, por ello, pretende superar los límites impuestos por un discurso reductivo, que niega la posibilidad de decir lo que se considera inefable por excelencia, el Ser Supremo. Una retórica que es la voz desesperada del alma de Agustín, y que no se rinde, aun viéndose obligado a decir a través de un espejo, de manera confusa (1 Cor 13,12). El artículo es un estudio filosófico de las técnicas retóricas empleadas por el obispo de Hipona, con especial atención a las fi guras de locución, utilizadas como herramienta para superar lo angosto de un lenguaje apofático, de modo que la misión cristiana de proclamación del Verbo Encarnado pueda ser realizada."
				],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=8715726",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "La Passione di Mario e Marta (BHL 5543): edizione e lettura critica",
				"creators": [
					{
						"firstName": "Laura",
						"lastName": "Vangone",
						"creatorType": "author"
					}
				],
				"date": "2022",
				"ISSN": "1124-1225",
				"language": "ita",
				"libraryCatalog": "dialnet.unirioja.es",
				"pages": "35-80",
				"publicationTitle": "Hagiographica",
				"shortTitle": "La Passione di Mario e Marta (BHL 5543)",
				"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=8715726",
				"volume": "29",
				"attachments": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=8398920",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "Cry of the Earth … Cry of the Poor",
				"creators": [
					{
						"firstName": "Jaazeal",
						"lastName": "Jakosalem",
						"creatorType": "author"
					}
				],
				"date": "2021",
				"ISSN": "1122-5661",
				"abstractNote": "Nuestro oikos es la Tierra. Pero este hogar, además, es también la morada de la Divinidad. Por ello, el plan de este Dios que ha querido habitar en su creación preveía que todas las criaturas vivientes existan en armonía las unas con las otras. La realidad, por el contrario, muestra que dicho plan no se está cumpliendo. Para hacer frente a esta realidad, el papa Francisco nos ofrece, en la Laudato Si’, pistas que propicien otra mirada a la creación, de forma que se construya una comunidad creacional. Esta propuesta acarrea serias repercusiones antropológicas, como son la de presentar al ser humano en comunión con el resto de las criaturas y la de apuntalar una acción político-ética de la inclusión, y no de la exclusión, dada la correspondencia existente entre la devastación de la tierra y la inequidad de la familia humana.",
				"language": "eng",
				"libraryCatalog": "dialnet.unirioja.es",
				"pages": "49-81",
				"publicationTitle": "Recollectio: annuarium historicum augustinianum",
				"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=8398920",
				"volume": "44",
				"attachments": [],
				"notes": [
					"abs:Our oikos is the earth. But this home is also the abode of the Divinity. Thus, the plan of this God who wanted to dwell in his creation foresaw that all living creatures exist in harmony with one another. The reality, on the contrary, shows that such plan is not being fulfilled. In order to face this reality, Pope Francis offers us in the Laudato Si’, ways that promote another way of looking at creation, that builds a creational community. This proposal has anthropological repercussions, like presenting the human being in communion with the rest of the creatures and supporting a politico-ethical action of inclusion, and not of exclusion, given the existing correspondence between the devastation of the earth and the iniquity of human family"
				],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=8749356",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "La novedad de la pedagogía de la fe",
				"creators": [
					{
						"firstName": "Miguel Ángel",
						"lastName": "Medina",
						"creatorType": "author"
					}
				],
				"date": "2022",
				"ISSN": "0212-1964",
				"language": "spa",
				"libraryCatalog": "dialnet.unirioja.es",
				"pages": "41-70",
				"publicationTitle": "Teología y catequesis",
				"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=8749356",
				"volume": "154",
				"attachments": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=8855888",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "Espacio público y simbología religiosa en el estado español",
				"creators": [
					{
						"firstName": "Fernando Amerigo",
						"lastName": "Cuervo-Arango",
						"creatorType": "author"
					}
				],
				"date": "2022",
				"ISSN": "1888-346X",
				"language": "spa",
				"libraryCatalog": "dialnet.unirioja.es",
				"pages": "9-28",
				"publicationTitle": "Bandue: revista de la Sociedad Española de Ciencias de las Religiones",
				"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=8855888",
				"volume": "14",
				"attachments": [],
				"notes": [
					"translatedTitle:Public Space and religious symbols in the Secular State of Spain"
				],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=8963458",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "Aquella fundación de la calle Santiago Nº 1",
				"creators": [
					{
						"firstName": "José Luis Corzo",
						"lastName": "Toral",
						"creatorType": "author"
					}
				],
				"date": "2022",
				"ISSN": "0569-9789",
				"abstractNote": "Al celebrar 50 años de la fundación de la Casa-escuela Santiago Uno (1971), el autor –ante otros cuatro de sus seis fundadores– recuerda y comenta tres aspectos: su dimensión escolapia como fundación de la Provincia de Castilla; aquel ambiente social, tras el concilio Vaticano II y el reciente mayo del 68, a solo 4 años de la muerte de Franco; y también la novedad pedagógica de la Casa, basada en los escritos de don Lorenzo Milani (1923-1967) y de su escuela en Barbiana (Florencia). Sobre lo escolapio anota las dificultades –y salidas– para un trabajo duradero con los pobres. En lo socio-cultural estima su vigor creativo o amortiguador. Y destaca en lo pedagógico su vínculo con la fe cristiana, desde una Teología de la educación muy necesaria hoy",
				"language": "spa",
				"libraryCatalog": "dialnet.unirioja.es",
				"pages": "29-36",
				"publicationTitle": "Analecta calasanctiana: publicación semestral religioso cultural y de investigación histórica",
				"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=8963458",
				"volume": "127",
				"attachments": [],
				"notes": [
					"abs:Upon celebrating the 50th anniversary of the foundation of Santiago One SchoolHouse(1971), the author –before other four of its founders– reminds and comments three aspects: its Piarist dimension as a foundation of the Castille Province; the social environment after Vatican Council II, the recent May of 68, just 4 years after the death of Franco, and also the pedagogical novelty of the House, based upon the writings of Mr. Lorenzo Milani (1923-1967) and his school in Barbiana (Florence). Regarding the Piarist, he stresses the diffi culties –and going out– for a lasting work with the poor. In the social-cultural level, he stresses its creative orcushion vigor. In the pedagogical level, he stresses its connection with the Christian faith, from a Theology of education, so necessary today."
				],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=6760758",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "Dal dialogo ecumenico al dialogo interreligioso. Orientare la riflessione sul dialogo interreligioso a partire da una lettura della Dichiarazione congiunta sulla Dottrina della giustificazione (DCDG)",
				"creators": [
					{
						"firstName": "Philipp G.",
						"lastName": "Renczes",
						"creatorType": "author"
					}
				],
				"date": "2018",
				"ISSN": "0392-2855",
				"language": "mul",
				"libraryCatalog": "dialnet.unirioja.es",
				"pages": "9-28",
				"publicationTitle": "Analecta Augustiniana",
				"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=6760758",
				"volume": "81",
				"attachments": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=9077514",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "Valoración teológica de los cristianos separados según la teología anterior al Concilio Vaticano II",
				"creators": [
					{
						"firstName": "Juan Carlos Fernández",
						"lastName": "Menes",
						"creatorType": "author"
					}
				],
				"date": "2023",
				"ISSN": "0036-3537",
				"abstractNote": "The article aims to trace the broad lines of Catholic theological thought emerging from the so-called Ecumenical Movement, how the reflection on belonging to the Church and the evaluation of separated Christians and of Churches and Communities not in com-munion with the Catholic Church is maturing, and how the concept vestigia Ecclesiae is first used by the World Council of Churches and later by Catholic theologians to designate those nuclear elements of the Church of Christ common to all Christian confessions. One could consider the whole reality, invisible and visible, which constitutes the true Church, and call “Church element” all that is essential or proper to the Church. There would be, in this case, “elements of the Church” of an invisible nature, such as the presence of the Holy Spirit, and “elements of the Church” of a visible nature, such as the apostolic suc-cession. The thought of some of these theologians is also presented in summary form, or the most significant works of others are quoted. A thought which, in a more mature form, enters and crystallises in the Conciliar Aula.",
				"issue": "2",
				"language": "spa",
				"libraryCatalog": "dialnet.unirioja.es",
				"pages": "251-297",
				"publicationTitle": "Salmanticensis",
				"url": "https://dialnet.unirioja.es/servlet/articulo?codigo=9077514",
				"volume": "70",
				"attachments": [],
				"notes": [
					"abs:El artículo pretende trazar las grandes líneas del pensamiento teológico católico que surgen del llamado Movimiento Ecuménico, cómo se va madurando la reflexión acerca de la pertenencia a la Iglesia y la valoración de los cristianos separados y de las Iglesias y Comunidades que no están en comunión con la Iglesia católica y cómo el concepto “ves-tigia Ecclesiae” es utilizado en primer lugar por el Consejo Mundial de las Iglesias y pos-teriormente por los teólogos católicos para designar esos elementos nucleares de la Iglesia de Cristo comunes a todas las confesiones cristianas. Se podría considerar la realidad en-tera, invisible y visible, que constituye la Iglesia verdadera, y llamar “elemento de Iglesia” a todo lo que es esencial o propio de la Iglesia. Habría, en este caso, “elementos de Iglesia” de naturaleza invisible, como la presencia del Espíritu Santo, y “elementos de Iglesia” de naturaleza visible, como la sucesión apostólica. También se presenta de forma sumaria el pensamiento de algunos de estos teólogos o se citan las obras más significativas de otros. Un pensamiento que, de forma más madura, entra y cristaliza en el Aula conciliar.",
					"translatedTitle:Theological Assessment of Separated Christians According to the Pre-Vatican II Council Theology"
				],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/
