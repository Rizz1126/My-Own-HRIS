/* eslint-disable no-useless-escape */
/**
 * ATS CV Parser Service
 * Supports reading uploaded PDF/DOCX files and extracting structured data client-side.
 * Future: replace parseCVFile() with a real API call → POST /api/recruitment/parse-cv (multipart/form-data)
 */

export async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result || '');
    reader.onerror = () => reject(new Error('Failed to read file'));
    // For PDFs: text extraction works for searchable PDFs; image-based PDFs need OCR
    reader.readAsText(file);
  });
}

/**
 * Parse a CV from an uploaded File object.
 * Simulates async processing (replace body with API call for production).
 * @param {File} file
 * @returns {Promise<CVData>}
 */
export async function parseCVFile(file) {
  try {
    const text = await readFileAsText(file);
    // Simulate processing delay
    await new Promise(r => setTimeout(r, 700));

    // If file is PDF/binary and text extraction yielded nothing meaningful,
    // fall back to filename-based parsing so the user can still add the candidate
    const extractedText = text.trim().length > 30 ? text : `CV from file: ${file.name}`;
    const result = extractFromText(extractedText, file.name);

    // If we still couldn't get a name, derive it from the filename
    if (!result.name || result.name.trim().length === 0) {
      const base = file.name
        .replace(/\.(pdf|docx|doc|txt)$/i, '')
        .replace(/[_\-]/g, ' ')
        .replace(/\s?(cv|resume|portfolio)\s?/gi, '')
        .trim();
      result.name = base.length > 1
        ? base.replace(/\b\w/g, c => c.toUpperCase())
        : 'Unknown Candidate';
    }

    return result;
  } catch (error) {
    // If reading the file failed entirely, return a safe default so the modal
    // still opens and the user can fill the form manually
    console.warn('CV parsing error (non-critical):', error);
    const base = file.name
      .replace(/\.(pdf|docx|doc|txt)$/i, '')
      .replace(/[_\-]/g, ' ')
      .replace(/\s?(cv|resume|portfolio)\s?/gi, '')
      .trim();
    return {
      name: base.length > 1 ? base.replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown Candidate',
      email: '',
      phone: '',
      location: '',
      summary: '',
      skills: [],
      experience: [],
      education: [],
      rawFileName: file.name,
    };
  }
}

/**
 * Legacy: Parse CV from plain text (kept for backward compatibility).
 * @param {string} cvText
 * @returns {Promise<CVData>}
 */
export async function parseCV(cvText) {
  await new Promise(r => setTimeout(r, 800));
  return extractFromText(cvText);
}

/**
 * @typedef {Object} CVData
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string} location
 * @property {string} summary
 * @property {string[]} skills
 * @property {Experience[]} experience
 * @property {string[]} education
 * @property {string} rawFileName
 */

function extractFromText(text, fileName = '') {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  return {
    name: extractName(lines, fileName),
    email: extractEmail(text),
    phone: extractPhone(text),
    location: extractLocation(text),
    summary: extractSummary(lines),
    skills: extractSkills(text),
    experience: extractExperience(lines),
    education: extractEducation(lines),
    rawFileName: fileName,
  };
}

function extractName(lines, fileName = '') {
  const headerPatterns = /^(curriculum vitae|cv|resume|daftar riwayat hidup)/i;
  for (const line of lines.slice(0, 4)) {
    if (!headerPatterns.test(line) && line.length > 2 && line.length < 60 && !/@/.test(line) && !/^\d/.test(line)) {
      return toTitleCase(line);
    }
  }
  // Fallback: try to extract name from filename (e.g. "john_doe_cv.pdf" → "John Doe")
  if (fileName) {
    const base = fileName.replace(/\.(pdf|docx|doc|txt)$/i, '').replace(/[_\-]/g, ' ').replace(/\s?(cv|resume|portfolio)\s?/gi, '').trim();
    if (base.length > 1) return toTitleCase(base);
  }
  return '';
}

function extractEmail(text) {
  const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return m ? m[0].toLowerCase() : '';
}

function extractPhone(text) {
  const m = text.match(/(\+62|62|0)[0-9\s\-()]{8,14}/);
  return m ? m[0].replace(/\s/g, '') : '';
}

function extractLocation(text) {
  const cityPatterns = ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Medan', 'Bali', 'Denpasar', 'Semarang', 'Malang', 'Makassar', 'Bogor', 'Depok', 'Tangerang', 'Bekasi', 'Solo', 'Padang'];
  for (const city of cityPatterns) {
    if (new RegExp(city, 'i').test(text)) return city;
  }
  return '';
}

function extractSummary(lines) {
  const summaryKeywords = /^(summary|objective|profile|about|ringkasan|profil|deskripsi diri|professional summary)/i;
  for (let i = 0; i < lines.length; i++) {
    if (summaryKeywords.test(lines[i])) {
      const parts = [];
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        if (/^(experience|education|skills|work|pengalaman|pendidikan|keahlian)/i.test(lines[j])) break;
        parts.push(lines[j]);
      }
      return parts.join(' ').slice(0, 500);
    }
  }
  return '';
}

function extractSkills(text) {
  const techSkills = [
    'JavaScript','TypeScript','Python','Java','Go','Rust','PHP','Ruby','Swift','Kotlin','C++','C#',
    'React','Vue','Angular','Next.js','Nuxt.js','Node.js','Express','Django','FastAPI','Spring','Laravel','NestJS',
    'MySQL','PostgreSQL','MongoDB','Redis','Elasticsearch','Firebase','Supabase','SQLite','BigQuery',
    'Docker','Kubernetes','AWS','GCP','Azure','CI/CD','Git','GitHub','GitLab','Terraform','Ansible','Linux',
    'Figma','Adobe XD','Sketch','Photoshop','Illustrator','Canva','InVision',
    'Excel','Power BI','Tableau','SQL','R','MATLAB','SPSS','Google Data Studio',
    'Agile','Scrum','Kanban','JIRA','Confluence','Trello','Notion',
    'SEO','SEM','Google Analytics','Meta Ads','TikTok Ads','Email Marketing','Content Strategy',
    'Machine Learning','Deep Learning','TensorFlow','PyTorch','Scikit-learn',
    'Prometheus','Grafana','ELK Stack','Datadog',
    'REST API','GraphQL','gRPC','WebSocket','Microservices','Micro-Frontend',
    'Leadership','Communication','Problem Solving','Critical Thinking','Teamwork','Project Management',
  ];
  return techSkills.filter(skill => new RegExp(`\\b${skill}\\b`, 'i').test(text));
}

function extractExperience(lines) {
  const expSection = [];
  const expKeywords = /^(experience|work experience|pengalaman kerja|riwayat pekerjaan|employment history|professional experience)/i;
  const stopKeywords = /^(education|skills|projects|awards|references|certifications|pendidikan|keahlian|prestasi)/i;

  let inSection = false;
  for (const line of lines) {
    if (expKeywords.test(line)) { inSection = true; continue; }
    if (inSection && stopKeywords.test(line)) break;
    if (inSection && line.length > 5) expSection.push(line);
  }

  const experiences = [];
  for (let i = 0; i < expSection.length; i += 3) {
    const chunk = expSection.slice(i, i + 3);
    if (chunk[0]) {
      experiences.push({
        company: chunk[0] || '',
        role: chunk[1] || '',
        period: chunk[2] || '',
        desc: '',
      });
    }
  }
  return experiences.slice(0, 5);
}

function extractEducation(lines) {
  const eduKeywords = /^(education|pendidikan|riwayat pendidikan|academic background|educational background)/i;
  const stopKeywords = /^(experience|skills|projects|awards|references|keahlian|pengalaman)/i;
  const edu = [];
  let inSection = false;
  for (const line of lines) {
    if (eduKeywords.test(line)) { inSection = true; continue; }
    if (inSection && stopKeywords.test(line)) break;
    if (inSection && line.length > 3) edu.push(line);
  }
  return edu.slice(0, 4);
}

function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
