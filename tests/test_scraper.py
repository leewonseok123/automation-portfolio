import csv

import pytest
import requests
import scraper

LIST_HTML = """
<article class="product_pod"><h3><a href="a-book_1/index.html" title="A">A</a></h3></article>
<article class="product_pod"><h3><a href="b-book_2/index.html" title="B">B</a></h3></article>
"""

DETAIL_HTML = """
<ul class="breadcrumb"><li><a href="/">Home</a></li><li><a href="/books">Books</a></li>
<li><a href="/c/poetry">Poetry</a></li><li class="active">A Book</li></ul>
<div class="product_main"><h1>A Book</h1><p class="star-rating Four"></p></div>
<div id="product_gallery"><img src="../../media/a.jpg"></div>
<table class="table">
  <tr><th>UPC</th><td>abc123</td></tr>
  <tr><th>Price (incl. tax)</th><td>£51.77</td></tr>
  <tr><th>Availability</th><td>In stock (22 available)</td></tr>
</table>
"""


def test_parse_list_resolves_relative_links():
    links = scraper.parse_list(LIST_HTML, "https://books.toscrape.com/catalogue/page-1.html")
    assert links == [
        "https://books.toscrape.com/catalogue/a-book_1/index.html",
        "https://books.toscrape.com/catalogue/b-book_2/index.html",
    ]


def test_parse_detail_normalizes_fields():
    url = "https://books.toscrape.com/catalogue/a-book_1/index.html"
    book = scraper.parse_detail(DETAIL_HTML, url)
    assert book.upc == "abc123"
    assert book.category == "Poetry"
    assert book.price_gbp == 51.77
    assert book.rating == 4
    assert book.stock == 22
    assert book.image_url == "https://books.toscrape.com/media/a.jpg"


def test_csv_has_bom_for_excel(tmp_path):
    book = scraper.parse_detail(DETAIL_HTML, "https://books.toscrape.com/catalogue/a/index.html")
    path = tmp_path / "out.csv"
    scraper.save_csv([book], path)
    assert path.read_bytes().startswith(b"\xef\xbb\xbf")
    with path.open(encoding="utf-8-sig") as f:
        assert next(csv.DictReader(f))["title"] == "A Book"


class FakeResp:
    def __init__(self, status, text="ok"):
        self.status_code = status
        self.text = text
        self.encoding = None

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(str(self.status_code))


def test_polite_session_retries_then_succeeds(monkeypatch):
    monkeypatch.setattr(scraper.time, "sleep", lambda _s: None)
    client = scraper.PoliteSession(min_delay=0, max_delay=0)
    replies = iter([FakeResp(503), FakeResp(429), FakeResp(200, "hello")])
    monkeypatch.setattr(client.session, "get", lambda *a, **k: next(replies))
    assert client.get("https://example.com") == "hello"
    assert client.retry_count == 2


def test_polite_session_gives_up(monkeypatch):
    monkeypatch.setattr(scraper.time, "sleep", lambda _s: None)
    client = scraper.PoliteSession(min_delay=0, max_delay=0, retries=2)
    monkeypatch.setattr(client.session, "get", lambda *a, **k: FakeResp(500))
    with pytest.raises(requests.HTTPError):
        client.get("https://example.com")
