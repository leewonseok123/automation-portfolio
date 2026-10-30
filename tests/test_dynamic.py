import dynamic_scraper as ds
import pytest

ORIGINAL = """
<div class="quote"><span class="text">“Hello”</span><small class="author">Ann</small>
<a class="tag">a</a><a class="tag">b</a></div>
<div class="quote"><span class="text">“World”</span><small class="author">Bob</small></div>
"""

# 사이트 개편으로 클래스명이 바뀌었지만 schema.org 마크업은 남아 있는 경우
REDESIGNED = """
<article itemscope itemtype="http://schema.org/CreativeWork">
  <q itemprop="text">“Hello”</q><span itemprop="author">Ann</span>
  <meta itemprop="keywords" content="a,b"></article>
"""

BROKEN = "<div class='card'><p>“Hello”</p><em>Ann</em></div>"


def test_extract_original_markup():
    quotes, used = ds.extract_quotes(ORIGINAL)
    assert [(q.text, q.author, q.tags) for q in quotes] == [("“Hello”", "Ann", ["a", "b"]), ("“World”", "Bob", [])]
    assert used["item"] == "div.quote"


def test_fallback_selectors_survive_redesign():
    quotes, used = ds.extract_quotes(REDESIGNED)
    assert len(quotes) == 1
    assert quotes[0].author == "Ann"
    assert used["item"] != "div.quote"


def test_meta_keywords_split_into_tags():
    html = REDESIGNED.replace('<meta itemprop="keywords" content="a,b">', '<span itemprop="keywords">a,b</span>')
    quotes, _ = ds.extract_quotes(html)
    assert quotes[0].tags == ["a", "b"]


def test_broken_structure_is_detected():
    quotes, _ = ds.extract_quotes(BROKEN)
    with pytest.raises(ds.StructureChanged):
        ds.validate(quotes, 1, "test")


def test_validate_rejects_too_few():
    quotes, _ = ds.extract_quotes(ORIGINAL)
    with pytest.raises(ds.StructureChanged, match="최소 10건"):
        ds.validate(quotes, 10, "test")
