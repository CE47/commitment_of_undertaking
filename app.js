/* Commitment of Undertaking — client-side document generator
 * Reads CSV/Excel, fills the TESDA template docx per row, and lets the
 * user download each document or all of them as a ZIP.
 * Everything runs in the browser (works on GitHub Pages).
 */

(function () {
  "use strict";

  var TEMPLATE_URL = "template.docx";
  var templateArrayBuffer = null; // cached template bytes
  var rows = []; // parsed & normalized rows: {name,address,mobile,email}

  // ---- Column matching -----------------------------------------------------
  // Flexible header matching so users don't need exact column names.
  var FIELD_ALIASES = {
    name:    ["name", "fullname", "full name", "scholar", "scholarname", "nameofscholar"],
    address: ["address", "residence", "homeaddress", "completeaddress"],
    mobile:  ["mobile", "mobileno", "mobilenumber", "contact", "contactno",
              "contactnumber", "phone", "phoneno", "telmobile", "telmobileno", "cellphone", "cp"],
    email:   ["email", "emailaddress", "e-mail", "emailadd", "mail"]
  };

  function normKey(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  // Build a map from each source header -> our field name
  function mapHeaders(headers) {
    var map = {}; // fieldName -> headerName
    headers.forEach(function (h) {
      var nk = normKey(h);
      Object.keys(FIELD_ALIASES).forEach(function (field) {
        if (map[field]) return;
        if (FIELD_ALIASES[field].indexOf(nk) !== -1) {
          map[field] = h;
        }
      });
    });
    // Fallback: partial contains match for any still-missing field
    headers.forEach(function (h) {
      var nk = normKey(h);
      Object.keys(FIELD_ALIASES).forEach(function (field) {
        if (map[field]) return;
        if (FIELD_ALIASES[field].some(function (a) { return nk.indexOf(a) !== -1 || a.indexOf(nk) !== -1; })) {
          map[field] = h;
        }
      });
    });
    return map;
  }

  // ---- File reading --------------------------------------------------------
  function readFile(file) {
    showStatus("", "");
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var data = new Uint8Array(e.target.result);
        var wb = XLSX.read(data, { type: "array" });
        var sheet = wb.Sheets[wb.SheetNames[0]];
        var json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (!json.length) {
          showStatus("The file appears to be empty.", "err");
          return;
        }
        var headers = Object.keys(json[0]);
        var hmap = mapHeaders(headers);

        var missing = ["name", "address", "mobile", "email"].filter(function (f) { return !hmap[f]; });
        if (hmap.name === undefined) {
          showStatus(
            "Could not find a 'Name' column. Found columns: " + headers.join(", "),
            "err"
          );
          return;
        }

        rows = json.map(function (r) {
          return {
            name:    String(hmap.name    ? r[hmap.name]    : "").trim(),
            address: String(hmap.address ? r[hmap.address] : "").trim(),
            mobile:  String(hmap.mobile  ? r[hmap.mobile]  : "").trim(),
            email:   String(hmap.email   ? r[hmap.email]   : "").trim()
          };
        }).filter(function (r) { return r.name || r.address || r.mobile || r.email; });

        if (!rows.length) {
          showStatus("No data rows found.", "err");
          return;
        }

        var note = "Loaded " + rows.length + " record(s).";
        if (missing.length) {
          note += " (Optional column(s) not detected: " + missing.join(", ") +
                  " — those fields will be left blank.)";
        }
        showStatus(note, "ok");
        renderTable();
      } catch (err) {
        console.error(err);
        showStatus("Could not read the file: " + err.message, "err");
      }
    };
    reader.onerror = function () { showStatus("Failed to read the file.", "err"); };
    reader.readAsArrayBuffer(file);
  }

  // ---- Template loading ----------------------------------------------------
  // Tries to fetch template.docx automatically. If that fails (e.g. the page
  // was opened via file:// which browsers block), it falls back to asking the
  // user to pick template.docx manually — so the page works either way.
  function loadTemplate() {
    return new Promise(function (resolve, reject) {
      if (templateArrayBuffer) { resolve(templateArrayBuffer); return; }
      PizZipUtils.getBinaryContent(TEMPLATE_URL, function (err, content) {
        if (!err && content) {
          templateArrayBuffer = content;
          resolve(content);
          return;
        }
        // Fetch blocked (likely file:// origin). Ask the user for the template.
        promptForTemplate().then(resolve).catch(reject);
      });
    });
  }

  // Show a manual template picker and resolve once the user selects it.
  function promptForTemplate() {
    return new Promise(function (resolve, reject) {
      var box = document.getElementById("templateFallback");
      var picker = document.getElementById("templatePicker");
      box.style.display = "block";
      showStatus(
        "Could not auto-load template.docx (this happens when the page is opened directly from disk). " +
        "Either run it through a local web server, or select template.docx below to continue.",
        "err"
      );
      picker.onchange = function () {
        if (!picker.files || !picker.files[0]) return;
        var fr = new FileReader();
        fr.onload = function (e) {
          templateArrayBuffer = e.target.result; // ArrayBuffer works with PizZip
          box.style.display = "none";
          showStatus("Template loaded. You can now download documents.", "ok");
          resolve(templateArrayBuffer);
        };
        fr.onerror = function () { reject(new Error("Failed to read template.docx")); };
        fr.readAsArrayBuffer(picker.files[0]);
      };
    });
  }

  // ---- Document generation -------------------------------------------------
  function generateDoc(row) {
    var zip = new PizZip(templateArrayBuffer);
    var doc = new window.docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{", end: "}" }
    });
    doc.render({
      name: row.name || "",
      address: row.address || "",
      mobile: row.mobile || "",
      email: row.email || ""
    });
    return doc.getZip().generate({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });
  }

  function safeFileName(name) {
    var base = (name || "scholar").replace(/[\\/:*?"<>|]+/g, "").trim() || "scholar";
    return "Commitment of Undertaking - " + base + ".docx";
  }

  function downloadOne(index) {
    loadTemplate().then(function () {
      try {
        var blob = generateDoc(rows[index]);
        saveAs(blob, safeFileName(rows[index].name));
      } catch (err) {
        console.error(err);
        showStatus("Failed to generate document: " + err.message, "err");
      }
    }).catch(function (err) {
      showStatus("Could not load template.docx (make sure it is deployed alongside the page): " + err, "err");
    });
  }

  function downloadAll() {
    var btn = document.getElementById("downloadAllBtn");
    btn.disabled = true;
    btn.textContent = "Generating…";
    loadTemplate().then(function () {
      var zip = new JSZip();
      var usedNames = {};
      rows.forEach(function (row) {
        var blob = generateDoc(row);
        var fname = safeFileName(row.name);
        // avoid duplicate filenames in the zip
        if (usedNames[fname]) {
          usedNames[fname] += 1;
          fname = fname.replace(/\.docx$/, "") + " (" + usedNames[fname] + ").docx";
        } else {
          usedNames[fname] = 1;
        }
        zip.file(fname, blob);
      });
      return zip.generateAsync({ type: "blob" });
    }).then(function (content) {
      saveAs(content, "Commitment of Undertaking - All.zip");
      btn.disabled = false;
      btn.textContent = "⬇ Download All (ZIP)";
    }).catch(function (err) {
      console.error(err);
      showStatus("Failed to build ZIP: " + err, "err");
      btn.disabled = false;
      btn.textContent = "⬇ Download All (ZIP)";
    });
  }

  // ---- UI rendering --------------------------------------------------------
  function renderTable() {
    var tbody = document.querySelector("#dataTable tbody");
    tbody.innerHTML = "";
    rows.forEach(function (row, i) {
      var tr = document.createElement("tr");

      function cell(val) {
        var td = document.createElement("td");
        if (val) {
          td.textContent = val;
        } else {
          var s = document.createElement("span");
          s.className = "tag-missing";
          s.textContent = "(blank)";
          td.appendChild(s);
        }
        return td;
      }

      var num = document.createElement("td");
      num.textContent = i + 1;
      tr.appendChild(num);
      tr.appendChild(cell(row.name));
      tr.appendChild(cell(row.address));
      tr.appendChild(cell(row.mobile));
      tr.appendChild(cell(row.email));

      var act = document.createElement("td");
      act.className = "actions";
      var b = document.createElement("button");
      b.className = "btn btn-primary";
      b.textContent = "⬇ .docx";
      b.addEventListener("click", function () { downloadOne(i); });
      act.appendChild(b);
      tr.appendChild(act);

      tbody.appendChild(tr);
    });

    document.getElementById("rowCount").textContent = rows.length + " record(s)";
    document.getElementById("resultsCard").style.display = rows.length ? "block" : "none";
  }

  function showStatus(text, kind) {
    var el = document.getElementById("statusMsg");
    el.className = "msg" + (kind ? " " + kind : "");
    el.textContent = text;
    if (!text) el.style.display = "none";
  }

  function clearAll() {
    rows = [];
    document.getElementById("fileInput").value = "";
    document.querySelector("#dataTable tbody").innerHTML = "";
    document.getElementById("resultsCard").style.display = "none";
    showStatus("", "");
  }

  // ---- Event wiring --------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    var drop = document.getElementById("drop");
    var input = document.getElementById("fileInput");

    drop.addEventListener("click", function () { input.click(); });
    input.addEventListener("change", function () {
      if (input.files && input.files[0]) readFile(input.files[0]);
    });

    ["dragenter", "dragover"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("dragover"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("dragover"); });
    });
    drop.addEventListener("drop", function (e) {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) readFile(e.dataTransfer.files[0]);
    });

    document.getElementById("downloadAllBtn").addEventListener("click", downloadAll);
    document.getElementById("clearBtn").addEventListener("click", clearAll);

    // Warm up the template in the background without prompting on load.
    PizZipUtils.getBinaryContent(TEMPLATE_URL, function (err, content) {
      if (!err && content) templateArrayBuffer = content;
    });
  });
})();
