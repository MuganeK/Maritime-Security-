# Indian Ocean Littoral Archive & Maritime Studies Hub

**MSPH — Open Scholarship, Coastal Heritage & Littoral Commons**

An open-access academic repository and public scholarship portal for Indian Ocean littoral studies, maritime heritage, indigenous ecological knowledge, and coastal resource literacy.

## Content management

Decap CMS provides an editor at `/admin` for Articles & Field Studies and Coastal Voices / Oral Histories. Editors authenticate through Netlify Identity and Git Gateway; media uploads are stored in `assets/uploads/`. CMS entries are Markdown files with YAML frontmatter in `content/articles/` and `content/voices/`.

The frontend reads generated indexes at `content/articles-index.json` and `content/voices-index.json`. The build script validates the CMS files and regenerates these indexes. Article cards retain their existing search, category filters, APA citation, and BibTeX download actions; full Markdown articles and transcripts are rendered with Marked and sanitized with DOMPurify.

### Local editing

1. Install Node.js and run `npm install`.
2. Start the local CMS API proxy in one terminal: `npx decap-server`.
3. Start the content index watcher in another terminal: `npm run watch:content`.
4. Start Live Server from the repository root, then open `/admin/`.
5. Sign in to the local CMS proxy and publish a draft. The watcher rebuilds the content indexes when CMS Markdown files change.

To rebuild the indexes once, run `npm run build:content`.

### Netlify deployment

1. Import this repository into Netlify. `netlify.toml` runs `npm run build` and publishes the generated `dist/` directory.
2. In the Netlify site settings, enable **Identity** and set registration to invite-only.
3. Enable **Git Gateway** under Identity services.
4. Invite each contributor/editor through Identity. They can then sign in at `https://<your-site>.netlify.app/admin/`.
5. CMS changes are committed to the configured `main` branch. Netlify rebuilds the content indexes on each commit.

The configured `git-gateway` backend requires Netlify Identity and Git Gateway. The site itself can be hosted as static files elsewhere, but `/admin` publishing through this backend is available only when served by the configured Netlify site. Hosting the CMS on GitHub Pages instead requires changing to a separately configured GitHub OAuth backend/proxy.

## Project structure

```text
├── admin/
│   ├── index.html                 # Decap CMS loader
│   └── config.yml                 # Backend and collection schemas
├── assets/
│   └── uploads/                   # CMS-uploaded PDFs, audio, and imagery
├── content/
│   ├── articles/                  # Article and field-study Markdown
│   ├── voices/                    # Oral-history Markdown
│   ├── articles-index.json        # Generated frontend index
│   └── voices-index.json          # Generated frontend index
├── scripts/
│   └── build-content-index.mjs    # Validates and indexes CMS Markdown
├── Maritime-Security-Policy-Hub.html
├── netlify.toml
└── package.json
```
