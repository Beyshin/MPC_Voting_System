const PrimaryDb = require("better-sqlite3");
const path = require("path");


class PrimaryDatabase {
    constructor() {
        const dbPath = path.join(__dirname, '..', '/data', `main.db`);
        this.connection = new PrimaryDb(dbPath);
        this.init();
    }

    init() {
        // UZYTKOWNICY
        this.connection.prepare(
            `CREATE TABLE IF NOT EXISTS Users(
                                                 user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                 mail TEXT NOT NULL UNIQUE,
                                                 login TEXT NOT NULL UNIQUE,
                                                 password TEXT NOT NULL
             );`
        ).run();

        // KANDYDACI
        this.connection.prepare(
            `CREATE TABLE IF NOT EXISTS Candidates(
                                                      candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                      first_name TEXT NOT NULL,
                                                      last_name TEXT NOT NULL
             );`
        ).run();

        // GLOSOWANIA
        this.connection.prepare(
            `CREATE TABLE IF NOT EXISTS Votings(
                                                   voting_id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                   name TEXT NOT NULL,
                                                   start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
             );`
        ).run();

        // ASOCJACYJNA KANDYDACI-GLOSOWANIE-LICZBA PIERWSZA P(N)
        this.connection.prepare(
            `CREATE TABLE IF NOT EXISTS Candidates_Votings(
                                                              candidate_id INTEGER NOT NULL,
                                                              voting_id INTEGER NOT NULL,
                                                              p_value INTEGER NOT NULL,
                                                              PRIMARY KEY(candidate_id, voting_id),
                FOREIGN KEY(voting_id) REFERENCES Votings(voting_id),
                FOREIGN KEY(candidate_id) REFERENCES Candidates(candidate_id),
                UNIQUE(voting_id, p_value)
                );`
        ).run();
    }

    insertUser(mail, login, password){
        const query = this.connection.prepare(
            "INSERT INTO Users( mail, login, password) VALUES (?,?,?)"
        )
        query.run(mail, login, password);
        console.log("Pomyslnie wstawiono user'a")
    }

    selectPassword(login){
        const query = this.connection.prepare(
            "SELECT password FROM Users WHERE login = ?"
        )
        return query.get(login);
    }


}

module.exports = PrimaryDatabase;