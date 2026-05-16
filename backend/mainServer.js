const express = require('express');
const cors = require('cors');
const PrimaryDatabase = require('./services/primaryDb');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');

const bcrypt = require('bcrypt');
const saltRounds = 10;

const createMainServer = (port) => {
    const app = express();
    app.use(cors({
        //TODO: ZMIENIC CORSA
        origin: ["http://localhost:5173", "http://localhost:5174"],
        credentials: true
    }));
    app.use(express.json());
    app.use(cookieParser());

    const db = new PrimaryDatabase();

    app.listen(port, () => {
        console.log(`Main server listening on port ${port}`);
    })

    app.get('/elections', (req, res) => {
        console.log('GET /elections');
        try {
            const elections = db.getElections();
            res.status(200).send(elections);
        } catch (err) {
            console.log('Błąd przy pobieraniu wyborów: ' + err);
            res.status(500).send({ message: err.message });
        }
    });

    app.get('/elections/:id', (req, res) => {
        console.log('GET /elections/' + req.params.id);
        try {
            const election = db.getElectionById(req.params.id);
            if (!election) {
                return res.status(404).send({ message: 'Nie znaleziono głosowania' });
            }
            res.status(200).send(election);
        } catch (err) {
            console.log('Błąd przy pobieraniu głosowania: ' + err);
            res.status(500).send({ message: err.message });
        }
    });

    app.post('/registerUser', (req, res) => {
        console.log("POST /registerUser");

        try{
            const mail = req.body.mail;
            const login = req.body.login;
            const password = req.body.password;

            const hashedPassword = bcrypt.hashSync(password, saltRounds);
            console.log("Posolone hasło: ", hashedPassword);

            db.insertUser(mail, login, hashedPassword, 1);

            res.status(200).send({message: "Zarejestrowano uzytkownika."});
        }catch(err){
            res.status(500).send({message: err.message});
        }


    })

    app.post('/loginUser', async(req, res) => {
        console.log("POST /loginUser");

        const login = req.body.login;
        const password = req.body.password;

        try {
            const hashedPassword = db.selectPassword(login).password;
            //console.log("Hasło z bazy : " + hashedPassword);

            const isMatching = await bcrypt.compare(password, hashedPassword);
            if (isMatching) {
                //zgadza sie
                console.log("HASLA SIE ZGADZAJA")

                //TODO: ZMIENIC SECRET
                const token = jwt.sign({login: login}, "ALEXANDRIA", {expiresIn: "1h"});

                res.cookie("token", token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "strict",
                    maxAge: 60 * 60 * 1000 // godzina
                });

                res.status(200).send({message: "Zalogowano uzytkownika."});

            } else {
                //nie zgadza sie
                console.log("HASLA SIE NIE ZGADZAJA")
                res.status(401).send({message: "Hasła sie nie zgadzaja"});
            }
        }catch(err){
            console.log("Błąd podczas logowania: " + err);
            res.status(500).send({message: "Wystąpił bład serwera"});
        }
    })

    app.get('/checkAuth', async (req, res) => {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).send({ isLoggedIn: false, message: "Nie jesteś zalogowany." });
        }

        try {
            //TODO: ZMIENIC KLUCZ
            const decoded = jwt.verify(token, "ALEXANDRIA");
            const user = await db.selectUserByLogin(decoded.login);
            res.status(200).send({
                isLoggedIn: true,
                user: { login: decoded.login, id: user.user_id, privilegeLevel: user.privilege_level}
            });

        } catch (error) {
            res.clearCookie('token');
            res.status(401).send({ isLoggedIn: false, message: "Sesja wygasła." });
        }
    });

    app.post('/deactivateVoting', (req, res) => {
        console.log("POST /deactivateVoting");

        const votingId = req.body.votingId;
        if(votingId != undefined){
            db.setVotingInactive(votingId);
            console.log("Otrzymano id: " + req.body.votingId);
            res.status(200).send({message:"Udalo sie"});
        }else{
            res.status(401);
        }

    })


    app.post('/logout', (req, res) => {

        res.clearCookie('token', {
            httpOnly: true,
            secure: true,
            sameSite: "strict"
        });

        res.status(200).send({ message: "Wylogowano pomyślnie." });
    });

    // Endpoint do zliczania wyników głosowania
    app.get('/results/:id', async (req, res) => {
        const pollId = req.params.id;

        try {
            // 1. Pobieramy informacje o kandydatach
            const election = db.getElectionById(pollId);
            if (!election) {
                return res.status(404).send({ message: "Nie znaleziono głosowania" });
            }

            // 2. Pobieramy fragmenty głosów z 3 serwerów
            const [res1, res2, res3] = await Promise.all([
                fetch(`http://localhost:8000/dataFromPollId?id=${pollId}`).then(r => r.json()),
                fetch(`http://localhost:8001/dataFromPollId?id=${pollId}`).then(r => r.json()),
                fetch(`http://localhost:8002/dataFromPollId?id=${pollId}`).then(r => r.json())
            ]);

            const reconstructedVotes = {};

            const processServerData = (serverData) => {
                serverData.forEach(row => {
                    if (reconstructedVotes[row.user_id] === undefined) {
                        reconstructedVotes[row.user_id] = 0n;
                    }
                    reconstructedVotes[row.user_id] += BigInt(row.value);
                });
            };

            processServerData(res1);
            processServerData(res2);
            processServerData(res3);
            console.log("Zrekonstruowane głosy użytkowników (BigInt):", reconstructedVotes);

            // 4. Przygotowujemy tablicę wyników
            const results = {};
            election.candidates.forEach(c => {
                results[c.id] = {
                    firstName: c.firstName,
                    lastName: c.lastName,
                    primeValue: BigInt(c.pValue),
                    votes: 0
                };
            });

            let invalidVotes = 0;

            // 5. Sprawdzamy zrekonstruowane głosy
            Object.entries(reconstructedVotes).forEach(([userId, sumValue]) => {
                const votedCandidate = Object.values(results).find(c => c.primeValue === sumValue);
                if (votedCandidate) {
                    votedCandidate.votes += 1;
                } else {
                    invalidVotes += 1;
                }
            });

            // 6. Zwracamy wyniki głosowania
            res.status(200).send({
                electionTitle: election.title,
                results: Object.values(results).map(c => ({
                    firstName: c.firstName,
                    lastName: c.lastName,
                    votes: c.votes
                })),
                invalidVotes: invalidVotes,
                totalVotes: Object.keys(reconstructedVotes).length
            });

        } catch (err) {
            console.error("Błąd podczas zliczania wyników:", err);
            res.status(500).send({ message: "Wystąpił błąd podczas obliczania wyników." });
        }
    });

};

module.exports = createMainServer;