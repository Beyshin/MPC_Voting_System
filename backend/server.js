const express = require('express');
const cors = require('cors');
const Database = require('./services/db');

const createServer = (ID, port) =>{
    const app = express();
    app.use(cors());
    app.use(express.json());

    const db = new Database(ID);

    app.listen(port, () => {
        console.log(`Server nr ${ID} is running on port ${port}`);
    })

    app.get('/', function (req, res) {
        res.send(`Server number ${ID}`);
    })

    //TODO: Autentykacja

    //GET /testInsert
    //Testowy endpoint do wstawienia testowych danych (id_glosowania: 1337, id_uzytkownika: 1410, głos: $ID_serwera)
    //Do usuniecia w przyszłosci
    //STATUS 200 -> POPRAWNE DODANIE
    //STATUS 500 -> SERVER ERROR
    app.get('/testInsert', function (req, res) {
        console.log("GET /testInsert");
        try{
            db.testInsert();
            res.status(200).send("udalo sie dodac dane");
        }catch(err){
            res.status(500).send("nie udalo sie dodac danych: " + err);
        }
    })


    //GET /deleteData
    //Endpoint do flushowania tabeli z danych
    //STATUS 200 -> POPRAWNE USUNIECIE
    //STATUS 500 -> SERVER ERROR
    //TODO: Zmienic metode na DELETE
    app.get('/deleteData', function (req, res) {
        console.log("GET /deleteData");
        try {
            db.deleteData();
            res.status(200).send("udalo sie usunac dane");
        }catch(err){
            res.status(500).send("nie udalo sie usunac dane: " + err);
        }
    })

    //GET /listData
    //Wylistowanie wszystkich danych z tabeli (wszystkich głosów z kazdego głosowania)
    //STATUS 200 -> POPRAWNE WYLISTOWANIE
    //STATUS 500 -> SERVER ERROR
    app.get('/listData', function (req, res) {
        console.log("GET /listData");
        try{
            const data = db.getAllData();
            res.status(200).send(data);
        }catch(err){
            res.status(500).send("nie udalo sie uzyskac danych: " + err);
        }
    })


    //GET /dataFromPollId
    //Wylistowanie donych według parametru GET np /dataFromPollId?id=1337, zwróci jeden testowy rekord
    //STATUS 200 -> POPRAWNE WYLISTOWANIE
    //STATUS 500 -> SERVER ERROR
    //TODO: Mozna zmienic zeby tylko listowało wartości głosów, w celu wysłania samych wartości do serwera zliczającego
    app.get('/dataFromPollId', function (req, res) {
        const pollId = req.query.id;
        console.log("GET /dataFromPollId", pollId);
        try{
            const data = db.getAllDataByPollId(pollId);
            res.status(200).send(data);
        }catch(err){
            res.status(500).send(`nie udalo sie uzyskac danych o podanym id (${pollId}): ` + err);
        }
    })



    app.get('/health', (req, res) => {
        res.status(200).send("Server healthy");
    })


    app.post('/vote', (req, res) => {
        console.log(`POST /vote | Server: ${ID}`);

        //TODO: ZMIENIC PLACEHOLDERY USER_ID (123) NA USER_ID Z FRONTU
        //const userId = req.body.userId;
        const candidateId = req.body.candidateId;
        const votingId = req.body.votingId;
        let rows = db.voteSelect(votingId, 123);

        if(rows.length > 0){
            //jesli ktos juz zagłosował
            //TODO: UPDATE VOTE
            console.log("Tutaj musi byc UPDATE głosu");
        }else{
            //jezeli ktos glosuje pierwszy raz
            db.voteInsert(votingId, 123, candidateId);
        }

        //console.log(`Serwer nr ${ID} otrzymał payload: \n\tcandidateId :` + req.body.candidateId + `\n\tvotingId :` + req.body.votingId);
        res.status(200).send();
    })

    return app;
}

module.exports = createServer;