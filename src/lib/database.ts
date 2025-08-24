import initSqlJs from 'sql.js';

export interface Donation {
  id?: number;
  name: string;
  amount: number;
  type: string;
  category: 'chanda' | 'sponsorship';
  created_at?: string;
}

export type SponsorshipType = 'విగ్రహం' | 'లాడు' | 'భోజనం' | 'టిఫిన్';
export type ChandaType = 'చందా' | 'విఘ్రహందాత' | 'ప్రసాదం' | 'వస్త్రం' | 'పుష్పం' | 'ఇతర';

let db: any = null;

export const initDatabase = async () => {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`
  });

  // Try to load existing database from localStorage
  const existingDb = localStorage.getItem('ganesh-donations-db');
  
  if (existingDb) {
    const data = new Uint8Array(JSON.parse(existingDb));
    db = new SQL.Database(data);
  } else {
    db = new SQL.Database();
    
    // Create donations table
    db.run(`
      CREATE TABLE IF NOT EXISTS donations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('chanda', 'sponsorship')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    saveDatabase();
  }

  return db;
};

const saveDatabase = () => {
  if (!db) return;
  
  const data = db.export();
  localStorage.setItem('ganesh-donations-db', JSON.stringify(Array.from(data)));
};

export const addDonation = async (donation: Omit<Donation, 'id' | 'created_at'>) => {
  const database = await initDatabase();
  
  database.run(
    'INSERT INTO donations (name, amount, type, category) VALUES (?, ?, ?, ?)',
    [donation.name, donation.amount, donation.type, donation.category]
  );
  
  saveDatabase();
};

export const updateDonation = async (id: number, donation: Omit<Donation, 'id' | 'created_at'>) => {
  const database = await initDatabase();
  
  database.run(
    'UPDATE donations SET name = ?, amount = ?, type = ?, category = ? WHERE id = ?',
    [donation.name, donation.amount, donation.type, donation.category, id]
  );
  
  saveDatabase();
};

export const deleteDonation = async (id: number) => {
  const database = await initDatabase();
  
  database.run('DELETE FROM donations WHERE id = ?', [id]);
  
  saveDatabase();
};

export const getAllDonations = async (): Promise<Donation[]> => {
  const database = await initDatabase();
  
  const stmt = database.prepare('SELECT * FROM donations ORDER BY created_at DESC');
  const donations: Donation[] = [];
  
  while (stmt.step()) {
    donations.push(stmt.getAsObject() as Donation);
  }
  
  stmt.free();
  return donations;
};

export const getDonationsByCategory = async (category: 'chanda' | 'sponsorship'): Promise<Donation[]> => {
  const database = await initDatabase();
  
  const stmt = database.prepare('SELECT * FROM donations WHERE category = ? ORDER BY created_at DESC');
  stmt.bind([category]);
  
  const donations: Donation[] = [];
  
  while (stmt.step()) {
    donations.push(stmt.getAsObject() as Donation);
  }
  
  stmt.free();
  return donations;
};

export const searchDonations = async (searchTerm: string): Promise<Donation[]> => {
  const database = await initDatabase();
  
  const stmt = database.prepare(
    'SELECT * FROM donations WHERE name LIKE ? ORDER BY created_at DESC'
  );
  stmt.bind([`%${searchTerm}%`]);
  
  const donations: Donation[] = [];
  
  while (stmt.step()) {
    donations.push(stmt.getAsObject() as Donation);
  }
  
  stmt.free();
  return donations;
};

export const getTotalAmount = async (): Promise<number> => {
  const database = await initDatabase();
  
  const stmt = database.prepare('SELECT SUM(amount) as total FROM donations');
  stmt.step();
  const result = stmt.getAsObject();
  stmt.free();
  
  return Number(result.total) || 0;
};

export const getTotalByCategory = async (category: 'chanda' | 'sponsorship'): Promise<number> => {
  const database = await initDatabase();
  
  const stmt = database.prepare('SELECT SUM(amount) as total FROM donations WHERE category = ?');
  stmt.bind([category]);
  stmt.step();
  const result = stmt.getAsObject();
  stmt.free();
  
  return Number(result.total) || 0;
};