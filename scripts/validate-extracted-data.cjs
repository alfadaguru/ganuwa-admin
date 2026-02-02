const fs = require('fs');
const path = require('path');

/**
 * Validation Script for Extracted Data
 * Checks all extracted JSON files for validity and completeness
 */

const outputDir = '/tmp';
const files = [
  'extracted-news.json',
  'extracted-press-releases.json',
  'extracted-mdas.json',
  'extracted-lgas.json',
  'extracted-services.json',
  'extracted-leaders.json',
  'extracted-projects.json',
];

console.log('========================================');
console.log('VALIDATING EXTRACTED DATA');
console.log('========================================\n');

let totalErrors = 0;
let totalWarnings = 0;
let totalItems = 0;

files.forEach(file => {
  const filePath = path.join(outputDir, file);
  console.log(`\nValidating: ${file}`);
  console.log('-------------------');

  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ERROR: File not found`);
      totalErrors++;
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    if (!Array.isArray(data)) {
      console.log(`❌ ERROR: Data is not an array`);
      totalErrors++;
      return;
    }

    console.log(`✓ Valid JSON with ${data.length} items`);
    totalItems += data.length;

    // Check for required fields based on file type
    let missingFields = 0;
    let emptyFields = 0;

    data.forEach((item, index) => {
      // Common checks
      if (file.includes('news') || file.includes('press')) {
        if (!item.title?.en) {
          console.log(`  ⚠ Item ${index + 1}: Missing title.en`);
          missingFields++;
        }
        if (!item.slug) {
          console.log(`  ⚠ Item ${index + 1}: Missing slug`);
          missingFields++;
        }
        if (!item.category) {
          console.log(`  ⚠ Item ${index + 1}: Missing category`);
          missingFields++;
        }
      }

      if (file.includes('mdas')) {
        if (!item.name?.en) {
          console.log(`  ⚠ Item ${index + 1}: Missing name.en`);
          missingFields++;
        }
        if (!item.type) {
          console.log(`  ⚠ Item ${index + 1}: Missing type`);
          missingFields++;
        }
        if (!item.acronym) {
          console.log(`  ⚠ Item ${index + 1}: Missing acronym`);
          emptyFields++;
        }
      }

      if (file.includes('lgas')) {
        if (!item.name?.en) {
          console.log(`  ⚠ Item ${index + 1}: Missing name.en`);
          missingFields++;
        }
        if (!item.code) {
          console.log(`  ⚠ Item ${index + 1}: Missing code`);
          missingFields++;
        }
        if (!item.zone) {
          console.log(`  ⚠ Item ${index + 1}: Missing zone`);
          missingFields++;
        }
      }

      if (file.includes('services')) {
        if (!item.name?.en) {
          console.log(`  ⚠ Item ${index + 1}: Missing name.en`);
          missingFields++;
        }
        if (!item.category) {
          console.log(`  ⚠ Item ${index + 1}: Missing category`);
          missingFields++;
        }
        if (!Array.isArray(item.requirements)) {
          console.log(`  ⚠ Item ${index + 1}: Requirements is not an array`);
          missingFields++;
        }
      }

      if (file.includes('leaders')) {
        if (!item.name) {
          console.log(`  ⚠ Item ${index + 1}: Missing name`);
          missingFields++;
        }
        if (!item.role) {
          console.log(`  ⚠ Item ${index + 1}: Missing role`);
          missingFields++;
        }
        if (!item.email) {
          console.log(`  ⚠ Item ${index + 1}: Missing email`);
          missingFields++;
        }
      }

      if (file.includes('projects')) {
        if (!item.title?.en) {
          console.log(`  ⚠ Item ${index + 1}: Missing title.en`);
          missingFields++;
        }
        if (!item.status) {
          console.log(`  ⚠ Item ${index + 1}: Missing status`);
          missingFields++;
        }
        if (typeof item.progress !== 'number') {
          console.log(`  ⚠ Item ${index + 1}: Progress is not a number`);
          missingFields++;
        }
      }
    });

    if (missingFields > 0) {
      console.log(`  ⚠ ${missingFields} missing required fields`);
      totalWarnings += missingFields;
    }

    if (emptyFields > 0) {
      console.log(`  ℹ ${emptyFields} empty optional fields`);
    }

    // File size check
    const stats = fs.statSync(filePath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);
    console.log(`  File size: ${fileSizeKB} KB`);

    // Check for duplicates
    const slugs = data.map(item => item.slug).filter(Boolean);
    const uniqueSlugs = new Set(slugs);
    if (slugs.length !== uniqueSlugs.size) {
      console.log(`  ⚠ WARNING: Duplicate slugs detected`);
      totalWarnings++;
    }

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    totalErrors++;
  }
});

console.log('\n========================================');
console.log('VALIDATION SUMMARY');
console.log('========================================');
console.log(`Total items validated: ${totalItems}`);
console.log(`Total errors: ${totalErrors}`);
console.log(`Total warnings: ${totalWarnings}`);

if (totalErrors === 0 && totalWarnings === 0) {
  console.log('\n✅ All files are valid and ready for import!');
} else if (totalErrors === 0) {
  console.log('\n⚠ Files are valid but have some warnings. Review before import.');
} else {
  console.log('\n❌ Some files have errors. Please fix before import.');
}

console.log('========================================\n');

process.exit(totalErrors > 0 ? 1 : 0);