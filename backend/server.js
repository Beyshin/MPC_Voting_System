const express = require('express');
const cors = require('cors');
const Database = require('./services/secondaryDb');

const P = 10007;

const createServer = (ID, port) =>{
    const app = express();

    const corsOptions = {
        origin: 'https://glosowanie.alexandria-pcz.com',
        credentials: true,
        optionsSuccessStatus: 200
    }
    app.use(cors(corsOptions));

    app.use(express.json());

    const db = new Database(ID);

    app.listen(port, '0.0.0.0', () => {
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
        const pollId = req.query.id; // <-- Brakowało tej linijki!
        console.log("GET /dataFromPollId (MPC Aggregation)", pollId);

        try {
            const data = db.getAllDataByPollId(pollId);

            // Zabezpieczenie: jeśli nikt jeszcze nie zagłosował
            if (!data || data.length === 0) {
                return res.status(200).send({ pollId, encryptedTotals: [] });
            }

            const numCandidates = JSON.parse(data[0].value).length;
            let encryptedTotals = new Array(numCandidates).fill(0);

            data.forEach(row => {
                const userShares = JSON.parse(row.value);
                for (let i = 0; i < numCandidates; i++) {
                    encryptedTotals[i] = (encryptedTotals[i] + userShares[i]) % P;
                }
            });
            res.status(200).send({ pollId, encryptedTotals });

        } catch(err) {
            console.error(err);
            res.status(500).send(`Nie udalo sie zsumowac danych o id (${pollId}): ` + err);
        }
    })



    app.get('/health', (req, res) => {
        res.status(200).send("Server healthy");
    })

    app.post('/vote', (req, res) => {
        const { userId, votingId, shares } = req.body;

        // Sprawdzamy czy mamy shares zamist candidateVal
        if (!shares || !Array.isArray(shares) || !userId) {
            return res.status(400).send({ message: "Brak wymaganych danych (userId lub tablicy shares)" });
        }

        const sharesString = JSON.stringify(shares);

        // Zmiana w logach: logujemy wektor zamiast starej wartości
        console.log(`POST /vote | Server: ${ID} | User: ${userId} | Shares: ${sharesString}`);

        let rows = db.voteSelect(votingId, userId);

        if (rows.length > 0) {
            // Wszędzie poniżej podmieniamy candidateVal na sharesString
            db.voteUpdate(votingId, userId, sharesString);
            console.log(`Zaktualizowano udziały dla usera: ${userId}`);
        } else {
            db.voteInsert(votingId, userId, sharesString);
            console.log(`Dodano nowe udziały dla usera: ${userId}`);
        }

        res.status(200).send();
    });

    return app;
}

module.exports = createServer;