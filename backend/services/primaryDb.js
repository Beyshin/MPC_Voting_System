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
                                                     privilege_level INTEGER NOT NULL,
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
                `CREATE TABLE IF NOT EXISTS Candidates_Votings(
                                                                  candidate_id INTEGER NOT NULL,
                                                                  voting_id INTEGER NOT NULL,
                                                                  PRIMARY KEY(candidate_id, voting_id),
                    FOREIGN KEY(voting_id) REFERENCES Votings(voting_id),
                    FOREIGN KEY(candidate_id) REFERENCES Candidates(candidate_id)
                    );`
            )
            .run();

        this.seedInitialData();
    }

    insertUser(mail, login, password, privilege_level) {
        const query = this.connection.prepare(
            "INSERT INTO Users(mail, login, password, privilege_level) VALUES (?,?,?,?)",
        );
        query.run(mail, login, password, privilege_level);
        console.log("Pomyslnie wstawiono user'a");
    }

    selectUserByLogin(login){
        const query = this.connection.prepare(
            "SELECT user_id, privilege_level, password FROM Users WHERE login = ?",
        );

        return query.get(login);
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

        const candidateSql = `SELECT c.candidate_id AS id,
                                     c.first_name AS firstName,
                                     c.last_name AS lastName
                              FROM Candidates c
                                       JOIN Candidates_Votings cv ON c.candidate_id = cv.candidate_id
                              WHERE cv.voting_id = ?
                              ORDER BY c.candidate_id`;

        const candidatesQuery = this.connection.prepare(candidateSql);
        election.candidates = candidatesQuery.all(votingId);

        return election;
    }

    insertVoting(name, title, level, date_range, description, status) {
        const query = this.connection.prepare(
            `INSERT INTO Votings(name, title, level, date_range, description, status)
             VALUES (?, ?, ?, ?, ?, ?)`);
        const result = query.run(name, title, level, date_range, description, status);
        return result.lastInsertRowid;
    }

    setVotingInactive(votingId) {
        const query = this.connection.prepare(
            `UPDATE Votings SET status = 'Nieaktywne' WHERE voting_id = ?`,
        )

        query.run(votingId);
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

    insertCandidateVoting(candidateId, votingId) {
        const query = this.connection.prepare(
            `INSERT OR IGNORE INTO Candidates_Votings(candidate_id, voting_id)
         VALUES (?, ?)`);
        query.run(candidateId, votingId);
    }

    seedInitialData() {
        const count = this.connection.prepare(`SELECT COUNT(*) AS count FROM Votings`).get().count;
        if (count > 0) {
          return;
        }

        this.insertUser("admin@admin.com", "admin", "$2b$10$qmHFR24PSCX.Okx7JTNdbex02cL1WQz7abt3K9cQdOLlO711Lr6P2", 2);


        const sampleElections = [
            {
                name: "Najlepszy wykładowca",
                title: "Najlepszy wykładowca PCz",
                level: "Ogólnouczelniane",
                date_range: "10.06.2026",
                description: "Wybory, które raz na zawsze zdecydują kto jest ulubieńcem studentów.",
                status: "Aktywne",
                candidates: [
                    { firstName: "dr Artur", lastName: "Jakubski"},
                    { firstName: "dr inż. Jacek", lastName: "Piątkowski"},
                    { firstName: "dr inż. Andrzej", lastName: "Grosser"},
                    { firstName: "dr inż. Grzegorz", lastName: "Grodzki"},
                    { firstName: "dr inż. Grzegorz", lastName: "Michalski"},
                ],
            },
            {
                name: "Najlepsza rasa psa",
                title: "Najlepsza rasa psa 2026",
                level: "Międzygalaktyczne",
                date_range: "16.06.2026",
                description: "Głosowanie, które rostrzygnie, która z poniższych ras jest najlepsza.",
                status: "Aktywne",
                candidates: [
                    { firstName: "Border", lastName: "Collie"},
                    { firstName: "Owczarek", lastName: "Niemiecki"},
                    { firstName: "Jamnik", lastName: "" },
                    { firstName: "Shih", lastName: "tzu" },
                    { firstName: "Golden", lastName: "Retriver" },
                    { firstName: "Beagle", lastName: "" },
                    { firstName: "Pudel", lastName: "Duży" },
                    { firstName: "Labrador", lastName: "" },
                    { firstName: "Shiba", lastName: "Inu" }
                ],
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
                this.insertCandidateVoting(candidateId, votingId);
            }
        }
    }
}

module.exports = PrimaryDatabase;