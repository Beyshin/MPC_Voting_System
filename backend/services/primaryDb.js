const PrimaryDb = require("better-sqlite3");
const path = require("path");

class PrimaryDatabase {
  constructor() {
    const dbPath = path.join(__dirname, "..", "/data", `main.db`);
    this.connection = new PrimaryDb(dbPath);
    this.init();
  }

  init() {
    this.connection
      .prepare(
        `CREATE TABLE IF NOT EXISTS Users(
          user_id INTEGER PRIMARY KEY AUTOINCREMENT,
          mail TEXT NOT NULL UNIQUE,
          login TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL
        );`,
      )
      .run();

    this.connection
      .prepare(
        `CREATE TABLE IF NOT EXISTS Candidates(
          candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL
        );`,
      )
      .run();

    this.connection
      .prepare(
        `CREATE TABLE IF NOT EXISTS Votings(
          voting_id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          title TEXT,
          level TEXT,
          date_range TEXT,
          description TEXT,
          status TEXT,
          start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`,
      )
      .run();

    this.connection
      .prepare(
        `CREATE TABLE IF NOT EXISTS VotingPrimes(
          voting_prime_id INTEGER PRIMARY KEY AUTOINCREMENT,
          voting_id INTEGER NOT NULL,
          p_value INTEGER NOT NULL,
          UNIQUE(voting_id, p_value),
          FOREIGN KEY(voting_id) REFERENCES Votings(voting_id)
        );`,
      )
      .run();

    this.connection
      .prepare(
        `CREATE TABLE IF NOT EXISTS Candidates_Votings(
          candidate_id INTEGER NOT NULL,
          voting_id INTEGER NOT NULL,
          prime_value INTEGER,
          p_value INTEGER,
          PRIMARY KEY(candidate_id, voting_id),
          FOREIGN KEY(voting_id) REFERENCES Votings(voting_id),
          FOREIGN KEY(candidate_id) REFERENCES Candidates(candidate_id),
          UNIQUE(voting_id, prime_value),
          UNIQUE(voting_id, p_value)
        );`,
      )
      .run();

    this.ensureColumnExists("Votings", "title TEXT");
    this.ensureColumnExists("Votings", "level TEXT");
    this.ensureColumnExists("Votings", "date_range TEXT");
    this.ensureColumnExists("Votings", "description TEXT");
    this.ensureColumnExists("Votings", "status TEXT");
    this.ensureColumnExists("Candidates_Votings", "prime_value INTEGER");
    this.ensureColumnExists("Candidates_Votings", "p_value INTEGER");

    this.migrateCandidatePrimeColumns();
    this.hasCandidatePrimeValue = this.hasColumn("Candidates_Votings", "prime_value");
    this.seedInitialData();
  }

  ensureColumnExists(table, columnDefinition) {
    const [columnName] = columnDefinition.split(" ");
    const columns = this.connection.prepare(`PRAGMA table_info(${table})`).all();
    const exists = columns.some((col) => col.name === columnName);
    if (!exists) {
      this.connection.prepare(`ALTER TABLE ${table} ADD COLUMN ${columnDefinition}`).run();
    }
  }

  hasColumn(table, columnName) {
    const columns = this.connection.prepare(`PRAGMA table_info(${table})`).all();
    return columns.some((col) => col.name === columnName);
  }

  insertUser(mail, login, password) {
    const query = this.connection.prepare(
      "INSERT INTO Users(mail, login, password) VALUES (?,?,?)",
    );
    query.run(mail, login, password);
    console.log("Pomyslnie wstawiono user'a");
  }

  selectPassword(login) {
    const query = this.connection.prepare(
      "SELECT password FROM Users WHERE login = ?",
    );
    return query.get(login);
  }

  getElections() {
    const query = this.connection.prepare(
      `SELECT voting_id AS id,
              name,
              title,
              level,
              date_range AS dateRange,
              description,
              status
       FROM Votings
       ORDER BY voting_id`);
    return query.all();
  }

  getElectionById(votingId) {
    const electionQuery = this.connection.prepare(
      `SELECT voting_id AS id,
              name,
              title,
              level,
              date_range AS dateRange,
              description,
              status
       FROM Votings
       WHERE voting_id = ?`);
    const election = electionQuery.get(votingId);
    if (!election) {
      return null;
    }

    const usePrimeValueColumn = this.hasCandidatePrimeValue;
    const candidateSql = usePrimeValueColumn
      ? `SELECT c.candidate_id AS id,
                 c.first_name AS firstName,
                 c.last_name AS lastName,
                 COALESCE(cv.prime_value, cv.p_value) AS primeValue
            FROM Candidates c
            JOIN Candidates_Votings cv ON c.candidate_id = cv.candidate_id
            WHERE cv.voting_id = ?
            ORDER BY c.candidate_id`
      : `SELECT c.candidate_id AS id,
                 c.first_name AS firstName,
                 c.last_name AS lastName,
                 cv.p_value AS primeValue
            FROM Candidates c
            JOIN Candidates_Votings cv ON c.candidate_id = cv.candidate_id
            WHERE cv.voting_id = ?
            ORDER BY c.candidate_id`;

    const candidatesQuery = this.connection.prepare(candidateSql);
    election.candidates = candidatesQuery.all(votingId);

    return election;
  }

  getVotingPrimesForVoting(votingId) {
    const query = this.connection.prepare(
      `SELECT p_value FROM VotingPrimes WHERE voting_id = ? ORDER BY voting_prime_id`);
    return query.all(votingId);
  }

  getPrimeValuesForVoting(votingId) {
    return this.getVotingPrimesForVoting(votingId);
  }

  insertVoting(name, title, level, date_range, description, status) {
    const query = this.connection.prepare(
      `INSERT INTO Votings(name, title, level, date_range, description, status)
       VALUES (?, ?, ?, ?, ?, ?)`);
    const result = query.run(name, title, level, date_range, description, status);
    return result.lastInsertRowid;
  }

  insertVotingPrime(votingId, pValue) {
    const query = this.connection.prepare(
      `INSERT OR IGNORE INTO VotingPrimes(voting_id, p_value)
       VALUES (?, ?)`);
    query.run(votingId, pValue);
  }

  insertCandidate(firstName, lastName) {
    const query = this.connection.prepare(
      `INSERT OR IGNORE INTO Candidates(first_name, last_name)
       VALUES (?, ?)`);
    query.run(firstName, lastName);
    const idQuery = this.connection.prepare(
      `SELECT candidate_id AS id FROM Candidates WHERE first_name = ? AND last_name = ?`);
    return idQuery.get(firstName, lastName).id;
  }

  insertCandidateVoting(candidateId, votingId, primeValue) {
    if (this.hasCandidatePrimeValue) {
      const query = this.connection.prepare(
        `INSERT OR IGNORE INTO Candidates_Votings(candidate_id, voting_id, prime_value, p_value)
         VALUES (?, ?, ?, ?)`);
      query.run(candidateId, votingId, primeValue, primeValue);
    } else {
      const query = this.connection.prepare(
        `INSERT OR IGNORE INTO Candidates_Votings(candidate_id, voting_id, p_value)
         VALUES (?, ?, ?)`);
      query.run(candidateId, votingId, primeValue);
    }
  }

  migrateCandidatePrimeColumns() {
    const columns = this.connection.prepare(`PRAGMA table_info(Candidates_Votings)`).all();
    const hasPrimeValue = columns.some((col) => col.name === "prime_value");
    const hasPValue = columns.some((col) => col.name === "p_value");

    if (hasPrimeValue && hasPValue) {
      this.connection
        .prepare(`UPDATE Candidates_Votings SET prime_value = p_value WHERE prime_value IS NULL AND p_value IS NOT NULL`)
        .run();
    }
  }

  seedInitialData() {
    // const count = this.connection.prepare(`SELECT COUNT(*) AS count FROM Votings`).get().count;
    // if (count > 0) {
    //   return;
    // }

    const sampleElections = [
      {
        name: "krajowe-2137",
        title: "Wybory Krajowe 2025",
        level: "Krajowe",
        date_range: "12.03 - 15.04.2025",
        description: "Wybory do Sejmu RP, które odbędą się w kwietniu 2025 roku.",
        status: "Aktywne",
        candidates: [
          { firstName: "Adam", lastName: "Pierwszy", primeValue: 1000000007 },
          { firstName: "Paweł", lastName: "Drugi", primeValue: 1000000009 }
        ],
        votingPrimes: [1000003, 1000033, 1000037]
      },
      {
        name: "lokalne-glosowanie-420",
        title: "Referendum Spółdzielcze Częstochowa",
        level: "Lokalne",
        date_range: "14.03 - 15.04.2025",
        description: "",
        status: "Aktywne",
        candidates: [
          { firstName: "Adam", lastName: "Pierwszy", primeValue: 1000000007 },
          { firstName: "Paweł", lastName: "Drugi", primeValue: 1000000009 },
          { firstName: "Mariusz", lastName: "Trzeci", primeValue: 1000000021 }
        ],
        votingPrimes: [1000003, 1000033, 1000037]
      }
    ];

    for (const election of sampleElections) {
      const votingId = this.insertVoting(
        election.name,
        election.title,
        election.level,
        election.date_range,
        election.description,
        election.status,
      );

      for (const candidate of election.candidates) {
        const candidateId = this.insertCandidate(candidate.firstName, candidate.lastName);
        this.insertCandidateVoting(candidateId, votingId, candidate.primeValue);
      }

      for (const pValue of election.votingPrimes) {
        this.insertVotingPrime(votingId, pValue);
      }
    }
  }
}

module.exports = PrimaryDatabase;
