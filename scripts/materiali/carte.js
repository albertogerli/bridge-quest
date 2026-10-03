// Carte, figure e mani disegnate dai dati: la carta mostrata è quella scritta,
// mai un'immagine da ricontrollare.
//
//   <span data-carte="S:AK32" style="--w:30px"></span>         mazzetto
//   <span data-carte="S:KQJ10" data-cede="0"></span>           la prima ceduta
//   <div data-figura="S:J109/AKQ"></div>                       Nord sopra, Sud sotto
//   <div data-mano="AQ8.76.K65.K10932"></div>                  picche.cuori.quadri.fiori
//   <div data-mano="654.32.." data-parziale></div>             solo i semi indicati
//   <div data-figura4="H:82/KJ754/Q96/A103"></div>             un seme fra i quattro (N/O/E/S)
//   <div data-smazzata="N;O;E;S" data-compatta></div>           smazzata intera, controllata
(function () {
  const SIMBOLO = { S: "♠", H: "♥", D: "♦", C: "♣" };
  // Le etichette dei posti seguono la lingua della pagina: <html lang="en">.
  const EN = document.documentElement.lang === "en";
  const INIZIALI = EN ? ["N", "W", "E", "S"] : ["N", "O", "E", "S"];
  const NOMI = EN ? "North;West;East;South" : "Nord;Ovest;Est;Sud";
  const ROSA = INIZIALI.map((l) => "<span>" + l + "</span>").join("");
  const ORDINE = "AKQJT98765432";

  function ranghi(testo) {
    const out = [];
    for (let i = 0; i < testo.length; i++) {
      if (testo[i] === "1" && testo[i + 1] === "0") { out.push("10"); i++; }
      else out.push(testo[i]);
    }
    for (const r of out) {
      const k = r === "10" ? "T" : r;
      if (!ORDINE.includes(k) && r !== "x") throw new Error("carta sconosciuta: " + r + " in " + testo);
    }
    return out;
  }

  function carta(seme, r, cls) {
    const el = document.createElement("span");
    el.className = "carta s-" + seme + (cls ? " " + cls : "");
    el.innerHTML = '<span class="r">' + r + '</span><span class="m">' + SIMBOLO[seme] + "</span>";
    return el;
  }

  function semeTesto(seme, testo) {
    const s = document.createElement("span");
    s.className = "s-" + seme;
    s.textContent = SIMBOLO[seme];
    const f = document.createDocumentFragment();
    f.append(s, document.createTextNode(" " + (testo || "—")));
    return f;
  }

  document.querySelectorAll("[data-carte]").forEach((el) => {
    const [seme, testo] = el.dataset.carte.split(":");
    const cede = (el.dataset.cede || "").split(",").filter(Boolean).map(Number);
    const evid = (el.dataset.evid || "").split(",").filter(Boolean).map(Number);
    el.classList.add("mazzetto");
    ranghi(testo).forEach((r, i) => {
      el.append(carta(seme, r, cede.includes(i) ? "cede" : evid.includes(i) ? "evid" : ""));
    });
  });

  document.querySelectorAll("[data-figura]").forEach((el) => {
    const [seme, coppia] = el.dataset.figura.split(":");
    const [nord, sud] = coppia.split("/");
    ranghi(nord); ranghi(sud);
    el.classList.add("figura");
    const lato = (chi, t) => {
      const d = document.createElement("div");
      d.className = "lato";
      const c = document.createElement("span"); c.className = "chi"; c.textContent = chi;
      const v = document.createElement("span"); v.append(semeTesto(seme, t));
      d.append(c, v);
      return d;
    };
    const rosa = document.createElement("div"); rosa.className = "rosa"; 
    el.append(lato("N", nord), rosa, lato("S", sud));
  });

  // Un seme fra i quattro giocatori: "S:82/KJ754/Q96/A103" = Nord/Ovest/Est/Sud.
  // "?" in un rango (es. "J??") mostra una carta che non si conosce.
  document.querySelectorAll("[data-figura4]").forEach((el) => {
    const [seme, testo] = el.dataset.figura4.split(":");
    const [n, o, e, s] = testo.split("/");
    const visti = [n, o, e, s].flatMap((t) => (t ? ranghi(t.replace(/\?/g, "")) : []));
    const doppi = visti.filter((r, i) => visti.indexOf(r) !== i);
    if (doppi.length) throw new Error("carta ripetuta nel seme: " + doppi.join(",") + " in " + testo);
    el.classList.add("figura4");
    const posto = (cls, chi, t) => {
      const d = document.createElement("div");
      d.className = "posto " + cls;
      const c = document.createElement("span"); c.className = "chi"; c.textContent = chi;
      const v = document.createElement("span"); v.className = "carte-seme";
      if (t === undefined || t === "") v.innerHTML = "&nbsp;";
      else v.append(semeTesto(seme, t));
      d.append(c, v);
      return d;
    };
    const centro = document.createElement("div"); centro.className = "rosa4";
    centro.innerHTML = ROSA;
    el.append(posto("n", INIZIALI[0], n), posto("o", INIZIALI[1], o), centro, posto("e", INIZIALI[2], e), posto("s", INIZIALI[3], s));
  });

  // Smazzata intera a croce: "N;O;E;S", ogni mano "picche.cuori.quadri.fiori".
  // Controlla 13 carte per mano e 52 carte diverse in tutto. Una mano vuota
  // ("") resta coperta.
  document.querySelectorAll("[data-smazzata]").forEach((el) => {
    const mani = el.dataset.smazzata.split(";");
    if (mani.length !== 4) throw new Error("smazzata senza quattro mani: " + el.dataset.smazzata);
    const tutte = [];
    el.classList.add("smazzata4");
    ["n", "o", "e", "s"].forEach((cls, i) => {
      const box = document.createElement("div");
      box.className = "posto " + cls;
      const chi = document.createElement("span"); chi.className = "chi";
      chi.textContent = (el.dataset.nomi || NOMI).split(";")[i];
      box.append(chi);
      if (mani[i]) {
        const m = document.createElement("div");
        m.dataset.mano = mani[i];
        // data-compatta: Nord e Sud su una riga sola, la croce diventa bassa.
        if ("compatta" in el.dataset && (cls === "n" || cls === "s")) m.classList.add("in-riga");
        mani[i].split(".").forEach((t, k) => ranghi(t).forEach((r) => tutte.push("SHDC"[k] + r)));
        box.append(m);
      }
      el.append(box);
    });
    const doppi = tutte.filter((c, i) => tutte.indexOf(c) !== i);
    if (doppi.length) throw new Error("carta in due mani: " + doppi.join(",") + " in " + el.dataset.smazzata);
    const centro = document.createElement("div"); centro.className = "rosa4";
    centro.innerHTML = ROSA;
    el.append(centro);
  });

  // data-parziale: una mano di cui si mostrano solo alcuni semi o alcune carte.
  document.querySelectorAll("[data-mano]").forEach((el) => {
    const semi = el.dataset.mano.split(".");
    if (semi.length !== 4) throw new Error("mano senza quattro semi: " + el.dataset.mano);
    const n = semi.reduce((t, s) => t + ranghi(s).length, 0);
    if (n !== 13 && !("parziale" in el.dataset)) throw new Error("mano di " + n + " carte: " + el.dataset.mano);
    el.classList.add("mano");
    ["S", "H", "D", "C"].forEach((seme, i) => {
      // In una mano parziale un seme vuoto è un seme che non si mostra.
      if ("parziale" in el.dataset && !semi[i]) return;
      const r = document.createElement("div"); r.className = "riga";
      const s = document.createElement("span"); s.className = "seme s-" + seme; s.textContent = SIMBOLO[seme];
      const t = document.createElement("span"); t.textContent = semi[i] || "—";
      r.append(s, t);
      el.append(r);
    });
  });
  // I simboli scritti nel testo («1♥ – 2♦», «10♥») prendono il colore del seme,
  // come le carte disegnate: in un'asta il rosso e il nero si leggono prima
  // delle lettere.
  const dentroSeme = (n) => n.parentElement && n.parentElement.closest("[class^='s-'], [class*=' s-'], script, style");
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const daColorare = [];
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (/[♠♥♦♣]/.test(n.nodeValue) && !dentroSeme(n)) daColorare.push(n);
  }
  const CLASSE = { "♠": "s-S", "♥": "s-H", "♦": "s-D", "♣": "s-C" };
  for (const n of daColorare) {
    // Un solo contenitore in linea per frase: in un riquadro a griglia o flex
    // ogni pezzo sciolto diventerebbe un elemento a sé, su una riga sua.
    const f = document.createElement("span");
    for (const parte of n.nodeValue.split(/([♠♥♦♣])/)) {
      if (!parte) continue;
      if (CLASSE[parte]) {
        const sp = document.createElement("span");
        sp.className = CLASSE[parte];
        sp.textContent = parte;
        f.append(sp);
      } else f.append(document.createTextNode(parte));
    }
    n.replaceWith(f);
  }
})();
