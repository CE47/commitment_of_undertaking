# Commitment of Undertaking — Document Generator

A static web page that reads a **CSV or Excel** list of scholars and generates a
**`.docx` Commitment of Undertaking** for each one, exactly matching the official
TESDA "Annex K" template. It runs 100% in the browser — no server, no data upload —
so it can be hosted for free on **GitHub Pages**.

## What it does

1. You upload a CSV / `.xlsx` / `.xls` file containing scholar details.
2. The page detects the **Name, Address, Mobile, Email** columns (flexible matching).
3. It shows a table of everyone found.
4. You can **download one `.docx` per person**, or **Download All** as a single ZIP.

Each generated document uses your original template file, so the layout, fonts
(Arial Narrow), the "Annex K" header, the numbered commitments, and all wording are
preserved exactly — only the four detail fields are filled in.

## Files

| File | Purpose |
|------|---------|
| `index.html` | The page / UI |
| `app.js` | Parsing + document generation logic |
| `template.docx` | The Commitment of Undertaking template with placeholders |
| `sample.csv` | Example input you can try immediately |

> **Important:** `template.docx` must always be deployed next to `index.html`.
> The page fetches it at runtime.

## Input format

The first row must be column headers. Recognized columns (case/spacing/punctuation
insensitive):

- **Name** — also matches `Full Name`, `Name of Scholar`, `Scholar`
- **Address** — also matches `Residence`, `Home Address`, `Complete Address`
- **Mobile** — also matches `Mobile No`, `Contact No`, `Phone`, `Cellphone`, `CP`
- **Email** — also matches `Email Address`, `E-mail`, `Mail`

Only **Name** is strictly required; missing optional fields are left blank in the document.
See `sample.csv` for an example.

## Run locally

Because the page fetches `template.docx`, open it through a local web server
(not by double-clicking the file):

```bash
# Python 3
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Updating the template

If the official form changes, replace `template.docx` — but keep the four
placeholders in place:

- `{name}`  — where the scholar's name goes
- `{address}` — where the address goes
- `{mobile}` — after "Tel/Mobile No."
- `{email}` — after "Email Address"

You can edit them directly in Microsoft Word (type `{name}` etc. into the blanks)
and re-save as `template.docx`.

## Privacy

All processing happens in your browser. No file, name, or detail is ever sent to a
server.
