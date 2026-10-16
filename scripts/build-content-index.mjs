import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parseDocument } from "yaml";

const root = process.cwd();
const collections = [
  { folder: "content/articles", output: "content/articles-index.json", kind: "article" },
  { folder: "content/voices", output: "content/voices-index.json", kind: "voice" },
];

function parseMarkdown(source, filePath) {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)([\s\S]*)$/);
  if (!match) {
    throw new Error(`${filePath}: expected YAML frontmatter between --- markers`);
  }

  const document = parseDocument(match[1]);
  if (document.errors.length > 0) {
    throw new AggregateError(document.errors, `${filePath}: invalid YAML frontmatter`);
  }

  return { metadata: document.toJS(), body: match[2].trim() };
}

function isoDate(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid publication date: ${value}`);
  }
  return date.toISOString().slice(0, 10);
}

function requireString(value, field, filePath) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${filePath}: "${field}" is required`);
  }
  return value.trim();
}

function mediaUrl(value, field, filePath) {
  if (!value) return "";
  if (typeof value !== "string") {
    throw new Error(`${filePath}: "${field}" must be a media path or HTTPS URL`);
  }
  if (value.startsWith("/assets/uploads/") || value.startsWith("assets/uploads/")) {
    return value;
  }
  try {
    if (new URL(value).protocol === "https:") return value;
  } catch {}
  throw new Error(`${filePath}: "${field}" must point to /assets/uploads/ or use HTTPS`);
}

function bibtexEscape(value) {
  return value.replace(/[{}\\]/g, "\\$&");
}

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await markdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

async function buildCollection({ folder, output, kind }) {
  const directory = path.join(root, folder);
  const files = await markdownFiles(directory);
  const records = [];

  for (const filePath of files) {
    const relativePath = path.relative(root, filePath).split(path.sep).join("/");
    const { metadata, body } = parseMarkdown(await readFile(filePath, "utf8"), relativePath);
    const id = path.basename(filePath, ".md");

    if (kind === "article") {
      const articleType = requireString(metadata.article_type, "article_type", relativePath);
      const category = {
        "Open Access Research": "Research Articles",
        "Field Study": "Field Essays",
        Brief: "Essays",
      }[articleType];
      if (!category) {
        throw new Error(`${relativePath}: unsupported article_type "${articleType}"`);
      }

      records.push({
        id,
        category,
        tag: requireString(metadata.tag, "tag", relativePath),
        title: requireString(metadata.title, "title", relativePath),
        zone: requireString(metadata.biocultural_zone, "biocultural_zone", relativePath),
        abstract: requireString(metadata.abstract, "abstract", relativePath),
        author: requireString(metadata.authors, "authors", relativePath),
        year: isoDate(metadata.publication_date).slice(0, 4),
        location: requireString(metadata.location, "location", relativePath).toLocaleUpperCase("en"),
        doi: "Open Access · Field Archive",
        readTime: metadata.reading_time || "",
        date: isoDate(metadata.publication_date),
        pdfUrl: mediaUrl(metadata.pdf, "pdf", relativePath),
        body,
        apa: `${metadata.authors} (${isoDate(metadata.publication_date).slice(0, 4)}). ${metadata.title}. Indian Ocean Littoral Archive & Maritime Studies Hub.`,
        bibtex: `@article{${id},\n  author = {${bibtexEscape(metadata.authors)}},\n  title = {${bibtexEscape(metadata.title)}},\n  journal = {Indian Ocean Littoral Archive & Maritime Studies Hub},\n  year = {${isoDate(metadata.publication_date).slice(0, 4)}}\n}`,
      });
    } else {
      records.push({
        id,
        narrator: requireString(metadata.narrator, "narrator", relativePath),
        community: requireString(metadata.community, "community", relativePath),
        audio: mediaUrl(metadata.audio_file || metadata.audio_url, "audio", relativePath),
        duration: metadata.duration || "",
        transcript: metadata.transcript || body,
        body,
      });
    }
  }

  const outputPath = path.join(root, output);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(records, null, 2)}\n`);
  console.log(`Indexed ${records.length} ${kind} record(s) -> ${output}`);
}

async function build() {
  for (const collection of collections) {
    await buildCollection(collection);
  }
}

await build();

if (process.argv.includes("--watch")) {
  for (const { folder } of collections) {
    const directory = path.join(root, folder);
    const { watch } = await import("node:fs");
    watch(directory, { recursive: true }, () => {
      build().catch((error) => {
        console.error("Content index rebuild failed:", error);
        process.exitCode = 1;
      });
    });
  }
  console.log("Watching CMS Markdown folders for changes.");
}
