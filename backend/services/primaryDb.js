const PrimaryDb = require("better-sqlite3");
const path = require("path");


class PrimaryDatabase {
    constructor() {
        const dbPath = path.join(__dirname, '..', '/data', `main.db`);
        this.connection = new PrimaryDb(dbPath);
        this.init();
    }

    init(){
        this.connection.prepare(
            `CREATE TABLE IF NOT EXISTS Users(
            user_id    INTEGER NOT NULL,
            mail TEXT NOT NULL UNIQUE,
            login    TEXT NOT NULL UNIQUE,
            password    TEXT NOT NULL,
            PRIMARY KEY(user_id AUTOINCREMENT)
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