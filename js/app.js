(function () {
  "use strict";

  var FLAT = [];
  CHAPTERS.forEach(function (ch) {
    ch.subchapters.forEach(function (sub) {
      FLAT.push(sub);
    });
  });

  function findSub(id) {
    return FLAT.find(function (s) { return s.id === id; });
  }

  function flatIndex(id) {
    return FLAT.findIndex(function (s) { return s.id === id; });
  }

  function posterHead(chapterNum, subNum) {
    return (
      '<div class="phead-wrap"><div class="poster-head">' +
      '<div class="k-line"><span class="k-main"><span class="k-word">Kapitel </span>' + chapterNum + '</span><span class="k-suffix"></span></div>' +
      '<div class="n-line"><span class="n-main">– ' + chapterNum + '</span><span class="n-suffix">.' + subNum + '</span></div>' +
      '</div></div>'
    );
  }

  var ARROW_LEFT = '<img class="nav-arrow flip" src="images/icon-arrow.png" alt="" />';
  var ARROW_RIGHT = '<img class="nav-arrow" src="images/icon-arrow.png" alt="" />';

  // -------------------------------------------------
  // Text size (persisted)
  // -------------------------------------------------
  var SCALE_KEY = "zudj-text-scale";
  var SCALE_MIN = 0.8, SCALE_MAX = 1.6, SCALE_STEP = 0.1;

  function getScale() {
    var v = parseFloat(localStorage.getItem(SCALE_KEY));
    return isNaN(v) ? 1 : v;
  }
  function setScale(v) {
    v = Math.min(SCALE_MAX, Math.max(SCALE_MIN, v));
    localStorage.setItem(SCALE_KEY, v);
    document.documentElement.style.setProperty("--reader-scale", v);
  }
  setScale(getScale());

  document.getElementById("size-minus").addEventListener("click", function () {
    setScale(getScale() - SCALE_STEP);
  });
  document.getElementById("size-plus").addEventListener("click", function () {
    setScale(getScale() + SCALE_STEP);
  });
  document.getElementById("size-reset").addEventListener("click", function () {
    setScale(1);
  });

  document.getElementById("btn-home").addEventListener("click", function () {
    location.hash = "#/";
  });

  function currentSubId() {
    var m = /^#\/(\d\.\d)$/.exec(location.hash);
    return m ? m[1] : null;
  }

  // -------------------------------------------------
  // Views
  // -------------------------------------------------
  var view = document.getElementById("view");
  var controls = document.getElementById("text-controls");

  function fitLogo() {
    var block = view.querySelector(".logo-block");
    var home = view.querySelector(".home");
    if (!block || !home) return;

    var cs = getComputedStyle(home);
    var avail = home.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    avail = Math.min(avail, 160);

    var probe = document.createElement("span");
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.whiteSpace = "nowrap";
    probe.style.fontFamily = getComputedStyle(block).fontFamily;
    probe.style.fontWeight = "700";
    probe.style.textTransform = "uppercase";
    probe.style.fontSize = "200px";
    probe.textContent = "Zwischen";
    document.body.appendChild(probe);
    var width200 = probe.getBoundingClientRect().width;
    document.body.removeChild(probe);

    var size = (avail / width200) * 200;
    size = Math.max(26, Math.min(size, 150));
    block.style.fontSize = size + "px";
    block.classList.add("fitted");
  }

  function fitGrid() {
    var grid = view.querySelector(".entries-grid");
    var logoRow = view.querySelector(".logo-row");
    if (!grid) return;

    grid.style.width = "";
    var cs = getComputedStyle(grid);
    var cols = cs.gridTemplateColumns.split(" ").map(parseFloat);
    var gap = parseFloat(cs.columnGap) || 0;
    var width = cols.reduce(function (a, b) { return a + b; }, 0) + gap * (cols.length - 1);

    grid.style.width = width + "px";
    if (logoRow) {
      logoRow.style.width = width + "px";
    }
  }

  function positionHomeIcon() {
    var reader = view.querySelector(".reader");
    if (!reader) return;
    var r = reader.getBoundingClientRect();
    var pl = parseFloat(getComputedStyle(reader).paddingLeft) || 0;
    btnHome.style.left = (r.left + pl) + "px";
  }

  var fitTimer;
  window.addEventListener("resize", function () {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(function () {
      fitLogo();
      fitGrid();
      positionHomeIcon();
    }, 100);
  });

  function renderHome() {
    controls.classList.remove("visible");
    controls.setAttribute("aria-hidden", "true");

    var html = '';
    html += '<div class="home">';
    html += '<div class="logo-row"><div class="logo-block"><h1 class="l1">Zwischen</h1>';
    html += '<h1 class="l2"><span>Uns</span><span>Die</span></h1>';
    html += '<h1 class="l3">Jahre</h1></div></div>';

    html += '<div class="entries-grid">';
    FLAT.forEach(function (sub) {
      html += '<button class="entry" data-id="' + sub.id + '">';
      html += '<div class="entry-inner">';
      html += posterHead(sub.chapterNum, sub.subNum);
      html += '<p class="entry-question">' + sub.question + '</p>';
      html += '</div></button>';
    });
    html += '</div>';

    html += '</div>';
    view.innerHTML = html;

    view.querySelectorAll(".entry").forEach(function (btn) {
      btn.addEventListener("click", function () {
        location.hash = "#/" + btn.getAttribute("data-id");
      });
    });

    fitGrid();
    fitLogo();
    window.scrollTo(0, 0);
  }

  function renderReader(id) {
    var sub = findSub(id);
    if (!sub) {
      location.hash = "#/";
      return;
    }

    controls.classList.add("visible");
    controls.setAttribute("aria-hidden", "false");

    var idx = flatIndex(id);
    var prev = FLAT[idx - 1];
    var next = FLAT[idx + 1];

    var html = '<div class="reader">';
    html += posterHead(sub.chapterNum, sub.subNum);
    html += '<h2 class="sub-heading">' + sub.title + '</h2>';
    sub.paragraphs.forEach(function (p) {
      html += '<p>' + p + '</p>';
    });

    html += '<div class="reader-nav">';
    if (prev) {
      html += '<button class="nav-btn prev" data-id="' + prev.id + '">';
      html += ARROW_LEFT;
      html += '<span class="nav-text"><span class="nav-id">' + prev.id + '</span>';
      html += '<span class="nav-label">' + prev.title + '</span></span></button>';
    } else {
      html += '<button class="nav-btn prev" disabled></button>';
    }
    if (next) {
      html += '<button class="nav-btn next" data-id="' + next.id + '">';
      html += ARROW_RIGHT;
      html += '<span class="nav-text"><span class="nav-id">' + next.id + '</span>';
      html += '<span class="nav-label">' + next.title + '</span></span></button>';
    } else {
      html += '<button class="nav-btn next" disabled></button>';
    }
    html += '</div></div>';

    view.innerHTML = html;

    view.querySelectorAll(".nav-btn[data-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        location.hash = "#/" + btn.getAttribute("data-id");
      });
    });

    positionHomeIcon();
    window.scrollTo(0, 0);
  }

  var btnHome = document.getElementById("btn-home");

  function route() {
    var id = currentSubId();
    if (id) {
      btnHome.style.display = "";
      renderReader(id);
    } else {
      btnHome.style.display = "none";
      renderHome();
    }
  }

  window.addEventListener("hashchange", route);
  route();
})();
