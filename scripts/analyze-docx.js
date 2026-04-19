/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const admZip = require('adm-zip');

function extractStructure(filePath) {
    console.log(`Analyzing: ${filePath}`);
    const zip = new admZip(filePath);
    const content = zip.readAsText("word/document.xml");
    
    // Simple text extraction from XML tags
    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log("Text content (preview):", text.substring(0, 1000));
    
    // Try to find table markers
    const tablesCount = (content.match(/<w:tbl>/g) || []).length;
    console.log(`Tables found: ${tablesCount}`);
}

const templatesDir = "/Users/imac2jacques/Desktop/antigravity/integration/resources/templates/";
extractStructure(path.join(templatesDir, "grille E4 ccf .docx"));
extractStructure(path.join(templatesDir, "grille E6 ccf .docx"));
