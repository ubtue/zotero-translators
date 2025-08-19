{
	"translatorID": "8d4364fa-3672-46fe-8646-014ae6e166a0",
	"label": "ubtue_foi_et_vie",
	"creator": "Paula Hähndel",
	"target": "https?://www.foi-et-vie.fr/",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2025-08-06 11:27:05"
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
	if (url.includes('/article.php?code=')) {
		return "journalArticle";
	}

	if (url.includes('/review.php?code=')) {
		return "multiple";
	}

	return false;
}

function getSearchResults(doc) {
	var items = {};
	var found = false;
	var rows = ZU.xpath(doc, '//div[@class="toc"]//a[@class="normal"]');
	for (let i = 0; i < rows.length; i++) {
		let href = rows[i].href;
		let title = rows[i].textContent;
		if (!href || !title) continue;
		found = true;
		items[href] = title;
	}
	return found ? items : false;
}

function GetMetaData(articles, doc, url) {
	let rows = ZU.xpath(doc, '//div[@class="toc"]/ul/li');

	/*let hefte = ZU.xpath(doc, '//div/ul/li[a]');
	let heftdois = {};
	for (let r in hefte){
		heft = hefte[r].innerHTML;
		if (heft.includes("Heft") && heft.match(/^<a href="#" data-pages="\[(?:\d+,?)+\]">Heft/)) {
			heftnr = heft.match(/Heft (\d+)/)[1];
			heftdois[heftnr] = heft.match(/<a class="fa noul" href="[^\s"]+/g);
			for (let i in heftdois[heftnr]) {
				heftdois[heftnr][i] = heftdois[heftnr][i].match(/<a class="fa noul" href="([^\s"]+)/)[1];
			}
		}
	}
	let reviewdois = [];
	for (let r in rows){
		review = rows[r].innerHTML;
		if(review.includes("Rezension")) {
			if (review.match(/^<a href="#" data-pages="\[(?:\d+,?)+\]">Rezension/)) {
				reviewdoi = review.match(/<a class="fa noul" href="[^\s"]+/g);
				for (let i in reviewdoi) {
					reviewdois.push(reviewdoi[i].match(/<a class="fa noul" href="([^\s"]+)/)[1]);
				}
			}
		}
	}
	let journal = ZU.xpathText(doc, '//div//dl');*/
	let date = url.match(/=(\d{4})_/)[1];
	let issuenr = url.match(/_0*(\d+)/)[1];
	let volumenr = parseInt(date)-1897;
	let infos = ZU.xpathText(doc, '//div[@id="Breadcrumb"]/a'); Z.debug(infos)

	for (let a in articles) {
		item = new Zotero.Item('journalArticle');
		item.url = a;
		item.title = articles[a];
		let row = "";
		let r = 0;
		while (r < rows.length){
			row = rows[r].innerHTML;
			r++;
			if (row.includes(a.substring(a.lastIndexOf("/")+1))) {
				break;
			}
		}
		names = row.match(/author=[^"]+"/g);
		for (let j in names) {
			name = names[j].match(/author=([^"]+)"/)[1];
			let firstname = "";
			let lastname = "";
			if (name.match(/,?[^,]+/)) {
				lastname = name.match(/,?([^,]+)/)[1].trim();
			}
			if (name.match(/,[^,]+/)) {
				firstname = name.match(/,([^,]+)/)[1].trim();
			}
			item.creators.push({"firstName": firstname, "lastName": lastname, "creatorType": "author"})
		}
		item.volume = volumenr;
		item.date = date;
		item.issue = issuenr;
		let firstpage = row.match(/firstPage">(\d+)</)[1];
		let lastpage = "unknown"
		if (r < rows.length) {
			lastpage = parseInt(rows[r].innerHTML.match(/firstPage">(\d+)</)[1])-1;
		}
		item.pages = firstpage + "-" + lastpage;
		item.pages = item.pages.trim().replace(/^([^-]+)-\\1$/, '$1');
		item.ISSN = "0015-5357";
		item.attachments = [];
		item.complete();
	}
	//translator.translate();
}

function scrapeSingleArticle(doc, url) {
	let item = new Zotero.Item("journalArticle");

	let breadcrumb = ZU.xpath(doc, '//div[@id="Breadcrumb"]/a');
	if (breadcrumb.length) {
		item.title = breadcrumb[breadcrumb.length - 1].textContent.trim();
		let dateText = breadcrumb[1].textContent;
		if (dateText) {
			let date = dateText.match(/\d+/);
			if (date) {
				item.date = date[0];
				let volumenr = parseInt(date)-1897;
				item.volume = volumenr;
			}
		}
	}

	let codeMatch = url.match(/code=(\d+)/);
	if (codeMatch) {
		let code = codeMatch[1];
		let xpath = `//div[@class="navbar-header"]//ul[contains(@class,"leaders")]/li[span[a[contains(@href,"article.php?code=${code}")]]]`
		let articleLi = ZU.xpath(doc, xpath)[0];
		if (articleLi) {
			let authorLinks = ZU.xpath(articleLi, './/a[contains(@class,"author")]');
			for (let a of authorLinks) {
				let authorName = a.textContent.trim();

				if (authorName) {
					if (authorName.includes(',')) {
						let parts = authorName.split(',');
						if (parts.length === 2) {
							item.creators.push({
								firstName: parts[1].trim(),
								lastName: parts[0].trim(),
								creatorType: "author"
							});
						}
					} else {
						let parts = authorName.split(' ');
						if (parts.length === 1) {
							item.creators.push({
								firstName: "",
								lastName: parts[0],
								creatorType: "author"
							});
						} else {
							let lastName = parts.pop();
							let firstName = parts.join(' ');
							item.creators.push({
								firstName: firstName.trim(),
								lastName: lastName.trim(),
								creatorType: "author"
							});
						}
					}
				}
			}

			let firstPageText = ZU.xpathText(articleLi, './/span[contains(@class,"firstPage")]');
			let firstPage = parseInt(firstPageText, 10)
			let paginationLis = ZU.xpath(doc, '//ul[contains(@class, "pagination")]/li');
			let lastPage = null;

			for (let i = paginationLis.length - 1; i >= 0; i--) {
				let li = paginationLis[i];
				let pageText = null;

				let a = li.querySelector('a');
				if (a) {
					pageText = a.textContent.trim();
				} else {
					pageText = li.textContent.trim();
				}

				if (pageText && /^\d+$/.test(pageText)) {
					lastPage = firstPage + parseInt(pageText, 10) - 1;
					break;
				}
			}

			if (firstPage && lastPage) {
				item.pages = firstPage + "-" + lastPage;
			} else
				item.pages = firstPage;
		}

		let breadcrumbLinks = ZU.xpath(doc, '//div[@id="Breadcrumb"]/a');
		let issueLink = null;
		for (let link of breadcrumbLinks) {
			if (link.href.includes('review.php?code=')) {
				issueLink = link;
				break;
			}
		}
		if (issueLink) {
			let issueMatch = issueLink.href.match(/code=\d{4}_(\d+(?:-\d+)?)/);
			if (issueMatch) {
				let issueString = issueMatch[1];
				let parts = issueString.split('-').map(part => part.replace(/^0+/, '') || '0');
				item.issue = parts.join('/');
			}
		}
	}

	let keywordLinks = ZU.xpath(
		doc,
		`//div[contains(@class,"navbar-header")]//div[contains(@class,"btn-group")
			and .//a[contains(normalize-space(string(.)), "Sur le même thème")]]
			/ul[contains(@class,"dropdown-menu")]/li/a`
		);
	if (keywordLinks.length) {
		item.tags = [];
		for (let k of keywordLinks) {
			let keyword = k.textContent.trim();
			if (keyword) {
				item.tags.push(keyword);
			}
		}
	}

	item.ISSN = "0015-5357";
	item.url = url;

	item.complete();
}



function doWeb(doc, url) {
	let type = detectWeb(doc, url);

	if (type === "multiple") {
		Zotero.selectItems(getSearchResults(doc), function (items) {
			if (!items) return true;
			GetMetaData(items, doc, url);
		});
	} else if (type === "journalArticle") {
		scrapeSingleArticle(doc, url);
	}
}

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://www.foi-et-vie.fr/archive/review.php?code=2022_04",
		"items": "multiple"
	}
]
/** END TEST CASES **/
