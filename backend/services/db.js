const DB = require("better-sqlite3");
const path = require("path");


class Database {
    constructor(serverID){
        const dbPath = path.join(__dirname, '..', '/data', `server${serverID}.db`);
        this.id = serverID;
        this.connection = new DB(dbPath);
        this.init();
    }

    init(){
        this.connection.prepare(
            `CREATE TABLE IF NOT EXISTS data(
                poll_id INTEGER,
                user_id INTEGER,
                value INTEGER,
                PRIMARY KEY(poll_id, user_id)
                )`
        ).run();
    }


    voteSelect(votingId, userId){
        const query = this.connection.prepare(
            `SELECT * FROM data WHERE user_id = ? AND poll_id = ?`,
        )

        return query.all(userId, votingId);
    }

    voteInsert(votingId, userId, value){
        try {
            const query = this.connection.prepare(
                `INSERT INTO data(poll_id, user_id, value)
                 VALUES (?, ?, ?)`
            )
            query.run(votingId, userId, value);
            console.log(`Poprawnie wstawiono głos ${votingId} ${userId} ${value}!`)
        }catch(err){
            console.log(`Bład podczas wstawiania głosu | ${err}`)
            return;
        }
    }

    testInsert(){
        const query = this.connection.prepare(
            `INSERT INTO data(poll_id, user_id, value) VALUES (?,?,?)`
        )
        query.run(1337, 1410, this.id);
    }

    deleteData(){
        const query = this.connection.prepare(
            `DELETE FROM data`,
        )

        query.run();
    }

    getAllData(){
        const query = this.connection.prepare(
            `SELECT * FROM data`
        )
        return query.all();
    }

    getAllDataByPollId(pollId){
        const query = this.connection.prepare(
            `SELECT * FROM data WHERE poll_id = ?`,
        )
        return query.all(pollId);
    }



}


module.exports = Database;
