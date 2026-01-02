import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export const extractResumeText = async (filePath) => {
  try {
    
    const PDFExtract = require("pdf.js-extract").PDFExtract;
    const pdfExtract = new PDFExtract();
    
    if (!fs.existsSync(filePath)) {
      throw new Error('Resume file not found');
    }

    console.log("📄 Extracting text from PDF...");
        const data = await pdfExtract.extract(filePath, {});
        let fullText = "";
    data.pages.forEach(page => {
      page.content.forEach(item => {
        fullText += item.str + " ";
      });
      fullText += "\n";
    });
    
    if (!fullText || fullText.trim().length === 0) {
      throw new Error('PDF appears to be empty or contains only images');
    }

    console.log("✅ PDF parsed successfully");
    console.log(`📄 Extracted ${fullText.length} characters from ${data.pages.length} pages`);
    
    return cleanText(fullText);
  } catch (err) {
    console.error("❌ Error parsing PDF:", err);
    throw new Error(`Failed to parse PDF: ${err.message}`);
  }
};

function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\t/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();
}