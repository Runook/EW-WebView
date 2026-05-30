/**
 * 一次性导入历史客户清单 (CustomerList-fixed.xlsx) 到 customers 表。
 *
 * 用法：
 *   PGHOST=... PGUSER=... PGPASSWORD=... PGDATABASE=... PGPORT=5432 \
 *   node scripts/importCustomers.js <path-to-xlsx>
 *
 * 规则：
 *   - 读取 "Contacts" sheet（列：Customer / Bill To / Emails / Phones / Address / Source）
 *   - 按 company_name 大小写不敏感去重：已存在则跳过
 *   - 解析 email / phone / city / state / zip（尽力而为）
 */
const path = require('path');
const XLSX = require('xlsx');
const { Client } = require('pg');

const xlsxPath = process.argv[2] || path.join(__dirname, '../../output/CustomerList-fixed.xlsx');

const firstEmail = (s) => {
  const m = String(s || '').match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return m ? m[0] : null;
};
const firstPhone = (s) => {
  const m = String(s || '').match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  return m ? m[0].trim() : null;
};
const parseCityStateZip = (s) => {
  const m = String(s || '').match(/([A-Za-z][A-Za-z .'\-]+?),\s*([A-Z]{2})\s+(\d{5})(?:-\d{4})?/);
  if (!m) return {};
  return { city: m[1].trim(), state: m[2], zip: m[3] };
};
// 去掉地址开头重复的公司名
const cleanAddress = (addr, company) => {
  let a = String(addr || '').trim();
  if (!a) return null;
  const c = String(company || '').trim();
  if (c && a.toUpperCase().startsWith(c.toUpperCase())) {
    a = a.slice(c.length).trim();
  }
  return a || null;
};

async function main() {
  const wb = XLSX.readFile(xlsxPath);
  const sheet = wb.Sheets['Contacts'] || wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const header = rows[0];
  const idx = (name) => header.findIndex((h) => String(h).trim().toLowerCase() === name.toLowerCase());

  const iCustomer = idx('Customer');
  const iBill = idx('Bill To / Full Details');
  const iEmails = idx('Emails');
  const iPhones = idx('Phones');
  const iAddr = idx('Address / Notes');

  const client = new Client({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: parseInt(process.env.PGPORT || '5432', 10),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // 已存在公司名（小写）
  const existing = await client.query('SELECT LOWER(company_name) AS n FROM customers');
  const seen = new Set(existing.rows.map((r) => r.n));

  let inserted = 0, skipped = 0, dupInFile = 0;
  const batch = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const company = String(row[iCustomer] || '').trim();
    if (!company) { skipped++; continue; }
    const key = company.toLowerCase();
    if (seen.has(key)) { if (existing.rows.find(r=>r.n===key)) skipped++; else dupInFile++; continue; }
    seen.add(key);

    const emails = iEmails >= 0 ? row[iEmails] : '';
    const phones = iPhones >= 0 ? row[iPhones] : '';
    const addrRaw = iAddr >= 0 ? row[iAddr] : '';
    const billRaw = iBill >= 0 ? row[iBill] : '';

    const email = firstEmail(emails) || firstEmail(billRaw);
    const phone = firstPhone(phones) || firstPhone(billRaw);
    const addr = cleanAddress(addrRaw, company);
    const { city, state, zip } = parseCityStateZip(addrRaw || billRaw);

    batch.push({
      company_name: company.slice(0, 255),
      contact_email: email ? email.slice(0, 255) : null,
      contact_phone: phone ? phone.slice(0, 50) : null,
      billing_address: addr ? addr.slice(0, 500) : null,
      billing_city: city ? city.slice(0, 100) : null,
      billing_state: state || null,
      billing_zipcode: zip || null,
      notes: '历史客户清单导入 (CustomerList)',
    });
  }

  // 分批插入
  const chunkSize = 100;
  for (let i = 0; i < batch.length; i += chunkSize) {
    const chunk = batch.slice(i, i + chunkSize);
    const values = [];
    const params = [];
    chunk.forEach((c, j) => {
      const b = j * 8;
      values.push(`($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8})`);
      params.push(c.company_name, c.contact_email, c.contact_phone, c.billing_address,
                  c.billing_city, c.billing_state, c.billing_zipcode, c.notes);
    });
    await client.query(
      `INSERT INTO customers
        (company_name, contact_email, contact_phone, billing_address, billing_city, billing_state, billing_zipcode, notes)
       VALUES ${values.join(',')}`,
      params
    );
    inserted += chunk.length;
  }

  console.log(`✅ 导入完成：新增 ${inserted} 条，跳过(已存在) ${skipped} 条，文件内重复 ${dupInFile} 条`);
  await client.end();
}

main().catch((e) => { console.error('导入失败:', e); process.exit(1); });
