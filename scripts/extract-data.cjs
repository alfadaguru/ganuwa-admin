const fs = require('fs');
const path = require('path');

/**
 * Data Extraction Script
 * This script extracts hardcoded data from React source files (.tsx)
 * and transforms it to match the backend API schema format.
 */

const outputDir = '/tmp';

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Starting data extraction...\n');

// ========================================
// Extract News Articles from NewsPage.tsx
// ========================================
function extractNews() {
  const newsArticles = [
    {
      title: 'Governor Launches N50 Billion Infrastructure Development Program',
      excerpt: 'Kano State Government unveils ambitious infrastructure plan to construct 500km of roads, upgrade water systems, and modernize public facilities across all 44 LGAs.',
      category: 'infrastructure',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=500&q=80&fit=crop',
      date: 'December 15, 2024',
      author: 'Ministry of Information',
      views: '12,500',
      readTime: '5 min read',
      featured: true,
    },
    {
      title: 'Free Healthcare Program Reaches 100,000 Beneficiaries',
      excerpt: 'The state\'s free healthcare initiative has successfully provided medical services to over 100,000 citizens in its first six months of operation.',
      category: 'health',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=500&q=80&fit=crop',
      date: 'December 14, 2024',
      author: 'Ministry of Health',
      views: '8,300',
      readTime: '4 min read',
      featured: true,
    },
    {
      title: 'Kano Partners with Tech Giants for Digital Education Initiative',
      excerpt: 'State government signs MoU with leading technology companies to equip 1,000 schools with digital learning tools and internet connectivity.',
      category: 'education',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=500&q=80&fit=crop',
      date: 'December 13, 2024',
      author: 'Ministry of Education',
      views: '15,700',
      readTime: '6 min read',
      featured: true,
    },
    {
      title: 'Governor Receives Delegation from World Bank on Agricultural Development',
      excerpt: 'High-level discussions focus on securing funding for modern agricultural practices and supporting local farmers.',
      category: 'government',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&h=500&q=80&fit=crop',
      date: 'December 12, 2024',
      author: 'Government House Press',
      views: '9,200',
      readTime: '3 min read',
      featured: false,
    },
    {
      title: 'New Industrial Park to Create 5,000 Jobs in Kano',
      excerpt: 'Construction begins on state-of-the-art industrial facility expected to attract local and international investors.',
      category: 'development',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&q=80&fit=crop',
      date: 'December 11, 2024',
      author: 'Ministry of Commerce',
      views: '11,400',
      readTime: '5 min read',
      featured: false,
    },
    {
      title: 'Kano Metro Line Project Enters Phase Two',
      excerpt: 'Major progress on mass transit system with completion of 15km track and commissioning of modern stations.',
      category: 'infrastructure',
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=500&q=80&fit=crop',
      date: 'December 10, 2024',
      author: 'Ministry of Works',
      views: '13,600',
      readTime: '4 min read',
      featured: false,
    },
    {
      title: 'State Government Awards Scholarships to 500 Students',
      excerpt: 'Governor presents scholarship awards to outstanding students for tertiary education at home and abroad.',
      category: 'education',
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=500&q=80&fit=crop',
      date: 'December 9, 2024',
      author: 'Scholarship Board',
      views: '7,800',
      readTime: '3 min read',
      featured: false,
    },
    {
      title: 'New Mother & Child Hospitals Open in Three LGAs',
      excerpt: 'State-of-the-art healthcare facilities equipped with modern medical equipment begin operations.',
      category: 'health',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=500&q=80&fit=crop',
      date: 'December 8, 2024',
      author: 'Ministry of Health',
      views: '6,900',
      readTime: '4 min read',
      featured: false,
    },
    {
      title: 'Kano Signs Investment Agreement Worth $200 Million',
      excerpt: 'Major breakthrough as state secures foreign direct investment for renewable energy projects.',
      category: 'government',
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=500&q=80&fit=crop',
      date: 'December 7, 2024',
      author: 'Investment Promotion Agency',
      views: '14,200',
      readTime: '5 min read',
      featured: false,
    },
  ];

  const transformedNews = newsArticles.map(article => {
    const fullContent = `${article.excerpt}

This is a detailed article about ${article.title.toLowerCase()}. The content would normally include comprehensive details about the news story, including background information, quotes from officials, statistics, and impact on citizens.

Key points include:
- Significant impact on Kano State development
- Collaboration with relevant stakeholders
- Expected benefits for citizens
- Timeline and implementation details

For more information, please contact ${article.author}.`;

    return {
      title: { en: article.title, ha: '' },
      slug: article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      excerpt: { en: article.excerpt, ha: '' },
      content: { en: fullContent, ha: '' },
      category: article.category,
      featuredImage: article.image,
      author: article.author,
      publishedAt: new Date(article.date).toISOString(),
      status: 'published',
      isFeatured: article.featured,
      isActive: true,
      views: parseInt(article.views.replace(/,/g, '')),
      tags: [article.category, 'kano-state', 'government'],
    };
  });

  fs.writeFileSync(
    path.join(outputDir, 'extracted-news.json'),
    JSON.stringify(transformedNews, null, 2)
  );

  console.log(`✓ Extracted ${transformedNews.length} news articles`);
}

// ========================================
// Extract Press Releases
// ========================================
function extractPressReleases() {
  const pressReleases = [
    {
      title: 'Statement on 2025 Budget Presentation',
      date: 'December 16, 2024',
      category: 'government',
    },
    {
      title: 'Update on COVID-19 Vaccination Program',
      date: 'December 15, 2024',
      category: 'health',
    },
    {
      title: 'Road Construction Schedule for Q1 2025',
      date: 'December 14, 2024',
      category: 'infrastructure',
    },
  ];

  const transformedReleases = pressReleases.map(release => {
    const content = `Official press release regarding ${release.title.toLowerCase()}.

This press release provides important information and updates from the Kano State Government. Citizens and stakeholders are advised to take note of the details provided.

For media inquiries, please contact the Ministry of Information.`;

    return {
      title: { en: release.title, ha: '' },
      slug: release.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      excerpt: { en: `Official statement: ${release.title}`, ha: '' },
      content: { en: content, ha: '' },
      category: 'press-release',
      featuredImage: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&h=500&q=80&fit=crop',
      author: 'Government House Press',
      publishedAt: new Date(release.date).toISOString(),
      status: 'published',
      isFeatured: false,
      isActive: true,
      views: 0,
      tags: ['press-release', release.category, 'official-statement'],
    };
  });

  fs.writeFileSync(
    path.join(outputDir, 'extracted-press-releases.json'),
    JSON.stringify(transformedReleases, null, 2)
  );

  console.log(`✓ Extracted ${transformedReleases.length} press releases`);
}

// ========================================
// Extract MDAs
// ========================================
function extractMDAs() {
  const ministries = [
    {
      name: 'Ministry of Finance',
      description: 'Managing state finances, revenue generation, and fiscal policies',
      commissioner: 'Hon. Muhammad Sani Yusuf',
      email: 'finance@kanostate.gov.ng',
      phone: '+234 64 123 4501',
    },
    {
      name: 'Ministry of Works and Infrastructure',
      description: 'Development and maintenance of roads, bridges, and public infrastructure',
      commissioner: 'Engr. Mu\'azu Magaji',
      email: 'works@kanostate.gov.ng',
      phone: '+234 64 123 4502',
    },
    {
      name: 'Ministry of Education',
      description: 'Overseeing primary, secondary, and tertiary education in the state',
      commissioner: 'Dr. Umar Doguwa',
      email: 'education@kanostate.gov.ng',
      phone: '+234 64 123 4503',
    },
    {
      name: 'Ministry of Health',
      description: 'Providing healthcare services and managing health facilities',
      commissioner: 'Dr. Aminu Ibrahim Tsanyawa',
      email: 'health@kanostate.gov.ng',
      phone: '+234 64 123 4504',
    },
    {
      name: 'Ministry of Agriculture',
      description: 'Promoting agricultural development and food security',
      commissioner: 'Alhaji Sadiq Balarabe Mahmud',
      email: 'agriculture@kanostate.gov.ng',
      phone: '+234 64 123 4505',
    },
    {
      name: 'Ministry of Commerce and Industry',
      description: 'Fostering trade, commerce, and industrial development',
      commissioner: 'Alhaji Baffa Babba Dan-agundi',
      email: 'commerce@kanostate.gov.ng',
      phone: '+234 64 123 4506',
    },
    {
      name: 'Ministry of Justice',
      description: 'Ensuring justice and upholding the rule of law',
      commissioner: 'Barr. Haruna Isah Dederi',
      email: 'justice@kanostate.gov.ng',
      phone: '+234 64 123 4507',
    },
    {
      name: 'Ministry of Water Resources',
      description: 'Managing water supply and sanitation services',
      commissioner: 'Engr. Aliyu Isa Danja',
      email: 'water@kanostate.gov.ng',
      phone: '+234 64 123 4508',
    },
    {
      name: 'Ministry of Environment',
      description: 'Environmental protection and waste management',
      commissioner: 'Dr. Kabiru Ibrahim',
      email: 'environment@kanostate.gov.ng',
      phone: '+234 64 123 4509',
    },
    {
      name: 'Ministry of Women Affairs',
      description: 'Empowering women and promoting gender equality',
      commissioner: 'Dr. Zahra\'u Muhammad Pindiga',
      email: 'women@kanostate.gov.ng',
      phone: '+234 64 123 4510',
    },
    {
      name: 'Ministry of Local Government',
      description: 'Coordinating and supporting local government administration',
      commissioner: 'Alhaji Murtala Sule Garo',
      email: 'localgovt@kanostate.gov.ng',
      phone: '+234 64 123 4511',
    },
    {
      name: 'Ministry of Rural Development',
      description: 'Promoting development in rural areas',
      commissioner: 'Alhaji Sani Umar Minjibir',
      email: 'rural@kanostate.gov.ng',
      phone: '+234 64 123 4512',
    },
  ];

  const agencies = [
    {
      name: 'Kano State Internal Revenue Service (KIRS)',
      description: 'Tax collection and revenue generation',
    },
    {
      name: 'Kano State Information Technology Development Agency (KASITDA)',
      description: 'Digital transformation and ICT development',
    },
    {
      name: 'Kano State Urban Planning and Development Authority (KNUPDA)',
      description: 'Urban planning and development control',
    },
    {
      name: 'Kano State Water Board',
      description: 'Water supply and distribution',
    },
    {
      name: 'State Universal Basic Education Board (SUBEB)',
      description: 'Basic education management and development',
    },
    {
      name: 'Kano State Emergency Management Agency (SEMA)',
      description: 'Disaster management and emergency response',
    },
    {
      name: 'Kano State Social Investment Programme',
      description: 'Poverty alleviation and social welfare programs',
    },
    {
      name: 'Kano State Child Protection Agency',
      description: 'Child welfare and protection services',
    },
  ];

  // Transform ministries
  const transformedMinistries = ministries.map(ministry => {
    const acronym = ministry.name
      .split(' ')
      .filter(word => word !== 'of' && word !== 'and')
      .map(word => word[0])
      .join('')
      .toUpperCase();

    return {
      name: { en: ministry.name, ha: '' },
      acronym: acronym,
      type: 'ministry',
      description: { en: ministry.description, ha: '' },
      head: {
        name: ministry.commissioner,
        title: 'Commissioner',
        email: ministry.email,
        phone: ministry.phone,
      },
      contactInfo: {
        email: ministry.email,
        phone: ministry.phone,
        address: 'Kano State Secretariat, Kano, Nigeria',
        website: `https://kanostate.gov.ng/mdas/${ministry.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      isActive: true,
    };
  });

  // Transform agencies
  const transformedAgencies = agencies.map(agency => {
    const acronymMatch = agency.name.match(/\(([A-Z]+)\)/);
    const acronym = acronymMatch ? acronymMatch[1] : agency.name
      .split(' ')
      .filter(word => word !== 'of' && word !== 'and')
      .map(word => word[0])
      .join('')
      .toUpperCase();

    return {
      name: { en: agency.name, ha: '' },
      acronym: acronym,
      type: 'agency',
      description: { en: agency.description, ha: '' },
      head: {
        name: 'Director General',
        title: 'Director General',
        email: `info@${acronym.toLowerCase()}.gov.ng`,
        phone: '+234 64 123 4500',
      },
      contactInfo: {
        email: `info@${acronym.toLowerCase()}.gov.ng`,
        phone: '+234 64 123 4500',
        address: 'Kano State, Nigeria',
        website: `https://kanostate.gov.ng/mdas/${agency.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      isActive: true,
    };
  });

  const allMDAs = [...transformedMinistries, ...transformedAgencies];

  fs.writeFileSync(
    path.join(outputDir, 'extracted-mdas.json'),
    JSON.stringify(allMDAs, null, 2)
  );

  console.log(`✓ Extracted ${transformedMinistries.length} ministries and ${transformedAgencies.length} agencies`);
}

// ========================================
// Extract LGAs
// ========================================
function extractLGAs() {
  const lgas = [
    { name: 'Ajingi', headquarters: 'Ajingi', population: '182,000', zone: 'central', area: '496 km²' },
    { name: 'Albasu', headquarters: 'Albasu', population: '198,000', zone: 'central', area: '486 km²' },
    { name: 'Bagwai', headquarters: 'Bagwai', population: '203,000', zone: 'central', area: '502 km²' },
    { name: 'Bebeji', headquarters: 'Bebeji', population: '253,000', zone: 'central', area: '610 km²' },
    { name: 'Bichi', headquarters: 'Bichi', population: '365,000', zone: 'central', area: '718 km²' },
    { name: 'Bunkure', headquarters: 'Bunkure', population: '202,000', zone: 'central', area: '488 km²' },
    { name: 'Dala', headquarters: 'Dala', population: '421,000', zone: 'metro', area: '16 km²' },
    { name: 'Dambatta', headquarters: 'Dambatta', population: '314,000', zone: 'central', area: '732 km²' },
    { name: 'Dawakin Kudu', headquarters: 'Dawakin Kudu', population: '253,000', zone: 'central', area: '436 km²' },
    { name: 'Dawakin Tofa', headquarters: 'Dawakin Tofa', population: '278,000', zone: 'central', area: '442 km²' },
    { name: 'Doguwa', headquarters: 'Doguwa', population: '195,000', zone: 'southern', area: '485 km²' },
    { name: 'Fagge', headquarters: 'Fagge', population: '587,000', zone: 'metro', area: '19 km²' },
    { name: 'Gabasawa', headquarters: 'Gabasawa', population: '172,000', zone: 'central', area: '412 km²' },
    { name: 'Garko', headquarters: 'Garko', population: '223,000', zone: 'southern', area: '520 km²' },
    { name: 'Garun Mallam', headquarters: 'Garun Mallam', population: '289,000', zone: 'central', area: '522 km²' },
    { name: 'Gaya', headquarters: 'Gaya', population: '324,000', zone: 'southern', area: '720 km²' },
    { name: 'Gezawa', headquarters: 'Gezawa', population: '268,000', zone: 'central', area: '520 km²' },
    { name: 'Gwale', headquarters: 'Gwale', population: '389,000', zone: 'metro', area: '17 km²' },
    { name: 'Gwarzo', headquarters: 'Gwarzo', population: '262,000', zone: 'central', area: '532 km²' },
    { name: 'Kabo', headquarters: 'Kabo', population: '204,000', zone: 'central', area: '452 km²' },
    { name: 'Kano Municipal', headquarters: 'Kano City', population: '572,000', zone: 'metro', area: '17 km²' },
    { name: 'Karaye', headquarters: 'Karaye', population: '259,000', zone: 'central', area: '479 km²' },
    { name: 'Kibiya', headquarters: 'Kibiya', population: '197,000', zone: 'southern', area: '462 km²' },
    { name: 'Kiru', headquarters: 'Kiru', population: '288,000', zone: 'central', area: '582 km²' },
    { name: 'Kumbotso', headquarters: 'Kumbotso', population: '427,000', zone: 'metro', area: '158 km²' },
    { name: 'Kunchi', headquarters: 'Kunchi', population: '178,000', zone: 'southern', area: '445 km²' },
    { name: 'Kura', headquarters: 'Kura', population: '231,000', zone: 'central', area: '512 km²' },
    { name: 'Madobi', headquarters: 'Madobi', population: '254,000', zone: 'central', area: '497 km²' },
    { name: 'Makoda', headquarters: 'Makoda', population: '183,000', zone: 'central', area: '412 km²' },
    { name: 'Minjibir', headquarters: 'Minjibir', population: '255,000', zone: 'central', area: '452 km²' },
    { name: 'Nasarawa', headquarters: 'Nasarawa', population: '501,000', zone: 'metro', area: '68 km²' },
    { name: 'Rano', headquarters: 'Rano', population: '268,000', zone: 'southern', area: '532 km²' },
    { name: 'Rimin Gado', headquarters: 'Rimin Gado', population: '232,000', zone: 'central', area: '448 km²' },
    { name: 'Rogo', headquarters: 'Rogo', population: '264,000', zone: 'central', area: '564 km²' },
    { name: 'Shanono', headquarters: 'Shanono', population: '218,000', zone: 'central', area: '512 km²' },
    { name: 'Sumaila', headquarters: 'Sumaila', population: '288,000', zone: 'southern', area: '602 km²' },
    { name: 'Takai', headquarters: 'Takai', population: '245,000', zone: 'metro', area: '428 km²' },
    { name: 'Tarauni', headquarters: 'Tarauni', population: '412,000', zone: 'metro', area: '31 km²' },
    { name: 'Tofa', headquarters: 'Tofa', population: '190,000', zone: 'central', area: '452 km²' },
    { name: 'Tsanyawa', headquarters: 'Tsanyawa', population: '201,000', zone: 'central', area: '468 km²' },
    { name: 'Tudun Wada', headquarters: 'Tudun Wada', population: '385,000', zone: 'metro', area: '22 km²' },
    { name: 'Ungogo', headquarters: 'Ungogo', population: '567,000', zone: 'metro', area: '49 km²' },
    { name: 'Warawa', headquarters: 'Warawa', population: '185,000', zone: 'central', area: '442 km²' },
    { name: 'Wudil', headquarters: 'Wudil', population: '256,000', zone: 'central', area: '484 km²' },
  ];

  const zoneMap = {
    metro: 'Kano Metropolitan',
    central: 'Central Zone',
    southern: 'Southern Zone',
  };

  const transformedLGAs = lgas.map(lga => {
    return {
      name: { en: lga.name, ha: '' },
      code: lga.name.substring(0, 3).toUpperCase(),
      headquarters: lga.headquarters,
      zone: zoneMap[lga.zone],
      population: parseInt(lga.population.replace(/,/g, '')),
      area: parseFloat(lga.area.replace(/[^\d.]/g, '')),
      description: {
        en: `${lga.name} Local Government Area is located in the ${zoneMap[lga.zone]} of Kano State, with headquarters at ${lga.headquarters}.`,
        ha: '',
      },
      chairman: {
        name: 'Local Government Chairman',
        title: 'Chairman',
        email: `chairman@${lga.name.toLowerCase().replace(/\s+/g, '')}.gov.ng`,
        phone: '+234 64 123 4500',
      },
      contactInfo: {
        email: `info@${lga.name.toLowerCase().replace(/\s+/g, '')}.gov.ng`,
        phone: '+234 64 123 4500',
        address: `${lga.headquarters}, Kano State, Nigeria`,
      },
      isActive: true,
    };
  });

  fs.writeFileSync(
    path.join(outputDir, 'extracted-lgas.json'),
    JSON.stringify(transformedLGAs, null, 2)
  );

  console.log(`✓ Extracted ${transformedLGAs.length} LGAs`);
}

// ========================================
// Extract Services
// ========================================
function extractServices() {
  const services = [
    {
      title: 'Pay Personal Income Tax',
      description: 'File and pay your personal income tax returns online quickly and securely.',
      category: 'taxation',
      status: 'online',
      requirements: ['Valid ID', 'Tax ID Number', 'Income Statement'],
    },
    {
      title: 'Business Premises Tax',
      description: 'Pay annual business premises tax for commercial properties and establishments.',
      category: 'taxation',
      status: 'online',
      requirements: ['Business Registration', 'Property Documents', 'Previous Tax Receipt'],
    },
    {
      title: 'Vehicle Registration & Tax',
      description: 'Register your vehicle and pay annual road tax online.',
      category: 'taxation',
      status: 'online',
      requirements: ['Vehicle Documents', 'Insurance Certificate', 'Valid ID'],
    },
    {
      title: 'Apply for Certificate of Occupancy',
      description: 'Apply for C of O for your land or property in Kano State.',
      category: 'property',
      status: 'online',
      requirements: ['Land Documents', 'Survey Plan', 'Tax Clearance', 'Application Fee'],
    },
    {
      title: 'Land Title Search',
      description: 'Search and verify land ownership records and title documents.',
      category: 'property',
      status: 'online',
      requirements: ['Property Address', 'Search Fee', 'Valid ID'],
    },
    {
      title: 'Building Plan Approval',
      description: 'Submit and track building plan approval applications.',
      category: 'property',
      status: 'hybrid',
      requirements: ['Architectural Plans', 'Land Documents', 'Engineering Reports'],
    },
    {
      title: 'Business Registration',
      description: 'Register your new business with the Kano State government.',
      category: 'business',
      status: 'online',
      requirements: ['Business Name', 'Valid ID', 'Business Address', 'Registration Fee'],
    },
    {
      title: 'Trade Permit & License',
      description: 'Obtain permits and licenses for commercial activities.',
      category: 'business',
      status: 'hybrid',
      requirements: ['Business Registration', 'Tax Clearance', 'Premises Inspection'],
    },
    {
      title: 'SME Support & Grants',
      description: 'Access grants and support programs for small and medium enterprises.',
      category: 'business',
      status: 'application',
      requirements: ['Business Plan', 'Financial Statements', 'Tax Returns'],
    },
    {
      title: 'Health Insurance Registration',
      description: 'Enroll in the Kano State Health Insurance Scheme.',
      category: 'health',
      status: 'online',
      requirements: ['Valid ID', 'Passport Photo', 'Registration Fee'],
    },
    {
      title: 'Hospital Appointment Booking',
      description: 'Book appointments at government hospitals and health centers.',
      category: 'health',
      status: 'online',
      requirements: ['Patient ID', 'Health Insurance Card (Optional)'],
    },
    {
      title: 'Medical Certificate Request',
      description: 'Request medical fitness certificates for employment or travel.',
      category: 'health',
      status: 'hybrid',
      requirements: ['Valid ID', 'Passport Photo', 'Medical Tests'],
    },
    {
      title: 'School Admission Portal',
      description: 'Apply for admission into government primary and secondary schools.',
      category: 'education',
      status: 'online',
      requirements: ['Birth Certificate', 'Previous School Records', 'Passport Photos'],
    },
    {
      title: 'Scholarship Application',
      description: 'Apply for state government scholarships and bursaries.',
      category: 'education',
      status: 'online',
      requirements: ['Academic Records', 'Admission Letter', 'Financial Statement'],
    },
    {
      title: 'Teachers Verification',
      description: 'Verify teaching credentials and certificates.',
      category: 'education',
      status: 'online',
      requirements: ['Certificate', 'Valid ID', 'Reference Number'],
    },
    {
      title: 'Drivers License Application',
      description: 'Apply for or renew your driver\'s license.',
      category: 'transport',
      status: 'hybrid',
      requirements: ['Valid ID', 'Passport Photos', 'Medical Certificate', 'License Fee'],
    },
    {
      title: 'Vehicle Registration',
      description: 'Register new or used vehicles with Kano State.',
      category: 'transport',
      status: 'hybrid',
      requirements: ['Vehicle Documents', 'Insurance', 'Customs Papers (if imported)'],
    },
    {
      title: 'Birth Certificate',
      description: 'Register births and obtain birth certificates.',
      category: 'civil',
      status: 'hybrid',
      requirements: ['Hospital Birth Record', 'Parents\' IDs', 'Marriage Certificate'],
    },
    {
      title: 'Marriage Certificate',
      description: 'Register marriages and obtain marriage certificates.',
      category: 'civil',
      status: 'hybrid',
      requirements: ['Valid IDs', 'Passport Photos', 'Witnesses', 'Registration Fee'],
    },
    {
      title: 'National ID Card',
      description: 'Apply for or collect your National Identity Card.',
      category: 'civil',
      status: 'hybrid',
      requirements: ['Valid ID', 'Passport Photos', 'Proof of Address'],
    },
  ];

  const categoryMap = {
    taxation: 'Tax Services',
    property: 'Property & Land',
    business: 'Business Services',
    health: 'Health Services',
    education: 'Education',
    transport: 'Transport',
    civil: 'Civil Registration',
  };

  const transformedServices = services.map(service => {
    return {
      name: { en: service.title, ha: '' },
      slug: service.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      category: categoryMap[service.category] || service.category,
      description: {
        en: service.description,
        ha: '',
      },
      requirements: service.requirements,
      howToApply: {
        en: `To apply for ${service.title}, please visit our online portal or any of our service centers. Ensure you have all required documents ready.`,
        ha: '',
      },
      processingTime: '5-10 business days',
      fee: 'Variable (see fee schedule)',
      isOnline: service.status === 'online' || service.status === 'hybrid',
      status: 'active',
      isActive: true,
    };
  });

  fs.writeFileSync(
    path.join(outputDir, 'extracted-services.json'),
    JSON.stringify(transformedServices, null, 2)
  );

  console.log(`✓ Extracted ${transformedServices.length} services`);
}

// ========================================
// Extract Leaders
// ========================================
function extractLeaders() {
  const leaders = [
    {
      name: 'Engr. Abba Kabir Yusuf',
      position: 'Executive Governor',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&q=80&fit=crop',
      bio: 'Leading Kano State with a vision for inclusive development, economic prosperity, and improved quality of life for all citizens.',
    },
    {
      name: 'Comrade Aminu Abdussalam Gwarzo',
      position: 'Deputy Governor',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&q=80&fit=crop',
      bio: 'Supporting the Governor in implementing policies and overseeing key government initiatives across the state.',
    },
  ];

  const transformedLeaders = leaders.map(leader => {
    return {
      name: leader.name,
      position: {
        en: leader.position,
        ha: '',
      },
      role: leader.position === 'Executive Governor' ? 'governor' : 'deputy-governor',
      bio: {
        en: leader.bio,
        ha: '',
      },
      photo: leader.image,
      email: leader.position === 'Executive Governor'
        ? 'governor@kanostate.gov.ng'
        : 'deputygovernor@kanostate.gov.ng',
      phone: '+234 64 123 4500',
      socialMedia: {
        twitter: '#',
        facebook: '#',
        instagram: '#',
      },
      isActive: true,
      order: leader.position === 'Executive Governor' ? 1 : 2,
    };
  });

  fs.writeFileSync(
    path.join(outputDir, 'extracted-leaders.json'),
    JSON.stringify(transformedLeaders, null, 2)
  );

  console.log(`✓ Extracted ${transformedLeaders.length} government leaders`);
}

// ========================================
// Extract Projects
// ========================================
function extractProjects() {
  const projects = [
    {
      title: 'Kano Metro Line Expansion',
      description: 'Modern mass transit system connecting major commercial and residential areas across Kano metropolis with 50km of rail network.',
      category: 'infrastructure',
      status: 'ongoing',
      progress: 65,
      budget: '₦85 Billion',
      location: 'Kano Metropolitan',
      startDate: 'Jan 2023',
      endDate: 'Dec 2025',
      contractor: 'China Civil Engineering Construction',
      beneficiaries: '2.5 Million',
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=500&q=80&fit=crop',
      highlights: ['15 Modern stations', 'Electric trains', 'Park & Ride facilities', '24/7 Operations'],
    },
    {
      title: 'Specialist Hospital Complex',
      description: 'State-of-the-art 500-bed specialist hospital with advanced medical equipment and telemedicine capabilities.',
      category: 'health',
      status: 'ongoing',
      progress: 78,
      budget: '₦45 Billion',
      location: 'Nassarawa GRA',
      startDate: 'Mar 2022',
      endDate: 'Sep 2024',
      contractor: 'Julius Berger Nigeria',
      beneficiaries: '5 Million',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=500&q=80&fit=crop',
      highlights: ['Cancer treatment center', 'Cardiac care unit', 'Digital health records', 'Training facilities'],
    },
    {
      title: 'Smart Schools Initiative',
      description: 'Renovation and digitalization of 500 public schools with computer labs, libraries, and modern facilities.',
      category: 'education',
      status: 'ongoing',
      progress: 45,
      budget: '₦25 Billion',
      location: 'All 44 LGAs',
      startDate: 'Jun 2023',
      endDate: 'Dec 2025',
      contractor: 'Multiple Contractors',
      beneficiaries: '1.2 Million',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=500&q=80&fit=crop',
      highlights: ['Computer labs', 'Science equipment', 'Solar power systems', 'Teacher training'],
    },
    {
      title: 'Challawa-Bompai Road Reconstruction',
      description: 'Complete reconstruction of 25km major arterial road with street lights, drainage, and pedestrian walkways.',
      category: 'infrastructure',
      status: 'completed',
      progress: 100,
      budget: '₦12 Billion',
      location: 'Challawa-Bompai Corridor',
      startDate: 'Jan 2022',
      endDate: 'Dec 2023',
      contractor: 'RCC Nigeria Limited',
      beneficiaries: '500,000',
      image: 'https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=800&h=500&q=80&fit=crop',
      highlights: ['LED street lights', 'Covered drainages', 'Bus stops', '3-year warranty'],
    },
    {
      title: 'Rural Water Supply Project',
      description: 'Installation of 200 solar-powered boreholes and water distribution networks in rural communities.',
      category: 'water',
      status: 'ongoing',
      progress: 60,
      budget: '₦8 Billion',
      location: '30 Rural LGAs',
      startDate: 'Aug 2023',
      endDate: 'Jul 2025',
      contractor: 'Hydro Plus Solutions',
      beneficiaries: '800,000',
      image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=500&q=80&fit=crop',
      highlights: ['Solar-powered systems', 'Community management', 'Water quality testing', 'Maintenance training'],
    },
    {
      title: 'Independent Power Project',
      description: '100MW gas-fired power plant to improve electricity supply across the state.',
      category: 'energy',
      status: 'planned',
      progress: 15,
      budget: '₦150 Billion',
      location: 'Tiga Industrial Area',
      startDate: 'Jan 2025',
      endDate: 'Dec 2027',
      contractor: 'TBD - Under Procurement',
      beneficiaries: '3 Million',
      image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=500&q=80&fit=crop',
      highlights: ['100MW capacity', 'Natural gas powered', '24/7 supply', 'Job creation'],
    },
    {
      title: 'Aminu Kano Teaching Hospital Upgrade',
      description: 'Major renovation and equipment upgrade of the state\'s premier teaching hospital.',
      category: 'health',
      status: 'completed',
      progress: 100,
      budget: '₦15 Billion',
      location: 'Kano City',
      startDate: 'May 2021',
      endDate: 'Aug 2023',
      contractor: 'Triacta Nigeria Limited',
      beneficiaries: '8 Million',
      image: 'https://images.unsplash.com/photo-1587351021355-a479a299d2f9?w=800&h=500&q=80&fit=crop',
      highlights: ['Modern equipment', 'ICU expansion', 'Staff quarters', 'Parking facilities'],
    },
    {
      title: 'Kano Technology Hub',
      description: 'World-class innovation center for tech startups, training, and digital transformation.',
      category: 'infrastructure',
      status: 'ongoing',
      progress: 85,
      budget: '₦10 Billion',
      location: 'Hotoro GRA',
      startDate: 'Feb 2023',
      endDate: 'Nov 2024',
      contractor: 'KASITDA',
      beneficiaries: '50,000',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=500&q=80&fit=crop',
      highlights: ['Co-working spaces', 'Training centers', 'High-speed internet', 'Innovation labs'],
    },
  ];

  const parseDate = (dateStr) => {
    const [month, year] = dateStr.split(' ');
    const monthMap = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };
    return new Date(parseInt(year), monthMap[month], 1).toISOString();
  };

  const transformedProjects = projects.map(project => {
    return {
      title: { en: project.title, ha: '' },
      slug: project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: {
        en: project.description,
        ha: '',
      },
      category: project.category,
      status: project.status,
      progress: project.progress,
      budget: project.budget,
      location: project.location,
      startDate: parseDate(project.startDate),
      endDate: parseDate(project.endDate),
      contractor: project.contractor,
      beneficiaries: project.beneficiaries,
      featuredImage: project.image,
      highlights: project.highlights,
      isActive: true,
      isFeatured: project.progress > 50,
    };
  });

  fs.writeFileSync(
    path.join(outputDir, 'extracted-projects.json'),
    JSON.stringify(transformedProjects, null, 2)
  );

  console.log(`✓ Extracted ${transformedProjects.length} projects`);
}

// Run all extraction functions
extractNews();
extractPressReleases();
extractMDAs();
extractLGAs();
extractServices();
extractLeaders();
extractProjects();

console.log('\n========================================');
console.log('DATA EXTRACTION COMPLETE');
console.log('========================================\n');
console.log('All extracted data has been saved to /tmp/ directory:');
console.log('  - /tmp/extracted-news.json (9 articles)');
console.log('  - /tmp/extracted-press-releases.json (3 releases)');
console.log('  - /tmp/extracted-mdas.json (20 MDAs)');
console.log('  - /tmp/extracted-lgas.json (44 LGAs)');
console.log('  - /tmp/extracted-services.json (20 services)');
console.log('  - /tmp/extracted-leaders.json (2 leaders)');
console.log('  - /tmp/extracted-projects.json (8 projects)');
console.log('\nPlease review these files before proceeding with data insertion.');
console.log('========================================\n');