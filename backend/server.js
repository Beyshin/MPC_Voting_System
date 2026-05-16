const express = require('express');
const cors = require('cors');
const Database = require('./services/secondaryDb');

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
        // Upewnij się, że w pliku głównym masz dodane: app.use(express.json());

        // Pobieramy prawdziwe dane wysłane z Reacta
        const userId = req.body.userId; // <--- Teraz pobieramy prawdziwe ID użytkownika
        const candidateVal = req.body.value; // <--- Zmiana z candidate_val na value!
        const votingId = req.body.votingId;

        console.log(`POST /vote | Server: ${ID} | User: ${userId} | Vote: ${candidateVal}`);

        // Zabezpieczenie przed brakującymi danymi (żeby nie wpisać znowu null'a)
        if (candidateVal === undefined || !userId) {
            return res.status(400).send({ message: "Brak wymaganych danych (userId lub value)" });
        }

        // Sprawdzamy czy TEN konkretny użytkownik już głosował w TYCH wyborach
        let rows = db.voteSelect(votingId, userId);

        if (rows.length > 0) {
            // Jeśli ktoś już zagłosował, nadpisujemy jego fragment
            db.voteUpdate(votingId, userId, candidateVal);
            console.log(`Zaktualizowano głos dla usera: ${userId}`);
        } else {
            // Jeżeli ktoś głosuje pierwszy raz
            db.voteInsert(votingId, userId, candidateVal);
            console.log(`Dodano nowy głos dla usera: ${userId}`);
        }

        res.status(200).send();
    });

    return app;
}

module.exports = createServer;