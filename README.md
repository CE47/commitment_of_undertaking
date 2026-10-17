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

## Deploy to GitHub Pages

1. Create a new repository on GitHub (e.g. `commitment-of-undertaking`).
2. Upload these files to the repository root:
   - `index.html`
   - `app.js`
   - `template.docx`
   - `sample.csv`
   - `README.md`
   ```bash
   git init
   git add index.html app.js template.docx sample.csv README.md
   git commit -m "Commitment of Undertaking generator"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
3. On GitHub go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source = Deploy from a branch**,
   **Branch = `main`**, **folder = `/ (root)`**, then **Save**.
5. Wait ~1 minute. Your site will be live at:
   `https://<your-username>.github.io/<your-repo>/`

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
