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

            db.insertUser(mail, login, hashedPassword);

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

    app.get('/checkAuth', (req, res) => {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).send({ isLoggedIn: false, message: "Nie jesteś zalogowany." });
        }

        try {
            //TODO: ZMIENIC KLUCZ
            const decoded = jwt.verify(token, "ALEXANDRIA");

            res.status(200).send({
                isLoggedIn: true,
                user: { login: decoded.login }
            });

        } catch (error) {
            res.clearCookie('token');
            res.status(401).send({ isLoggedIn: false, message: "Sesja wygasła." });
        }
    });

    app.post('/logout', (req, res) => {

        res.clearCookie('token', {
            httpOnly: true,
            secure: true,
            sameSite: "strict"
        });

        res.status(200).send({ message: "Wylogowano pomyślnie." });
    });

    // CRT - obliczenie reszt
    app.post('/calculateCRT', (req, res) => {
        console.log("POST /calculateCRT");
        try {
            const votingId = req.body.votingId;
            let candidateVal = req.body.candidate_val;
            const frontendPrimes = req.body.p_values;

            if (candidateVal === undefined || candidateVal === null) {
                return res.status(400).send({ message: "Brak wartości candidate_val" });
            }

            candidateVal = Number(candidateVal);
            if (Number.isNaN(candidateVal)) {
                return res.status(400).send({ message: "candidate_val musi być liczbą" });
            }

            const dbPrimes = db.getVotingPrimesForVoting(votingId);
            let primes = [];
            if (dbPrimes && dbPrimes.length > 0) {
                primes = dbPrimes.map((p) => Number(p.p_value ?? p));
            } else if (Array.isArray(frontendPrimes) && frontendPrimes.length > 0) {
                primes = frontendPrimes.map((p) => Number(p)).filter((p) => !Number.isNaN(p));
            }

            if (!primes || primes.length === 0) {
                return res.status(404).send({ message: "Nie znaleziono liczb pierwszych dla tego głosowania. Prześlij p_values lub załaduj dane z bazy." });
            }

            const remainders = primes.map(p => ({
                p_value: p,
                remainder: candidateVal % p
            }));

            res.status(200).send({
                votingId: votingId,
                candidateVal: candidateVal,
                remainders: remainders
            });
        } catch (err) {
            console.log("Błąd przy obliczaniu CRT: " + err);
            res.status(500).send({ message: "Błąd przy obliczaniu CRT: " + err.message });
        }
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

            // 3. Rekonstruujemy głosy użytkowników
            const reconstructedVotes = {}; 

            const processServerData = (serverData) => {
                serverData.forEach(row => {
                    if (!reconstructedVotes[row.user_id]) {
                        reconstructedVotes[row.user_id] = 0;
                    }
                    reconstructedVotes[row.user_id] += row.value;
                });
            };

            processServerData(res1);
            processServerData(res2);
            processServerData(res3);
            console.log("Zrekonstruowane głosy użytkowników:", reconstructedVotes);

            // 4. Przygotowujemy tablicę wyników
            const results = {};
            election.candidates.forEach(c => {
                results[c.id] = {
                    firstName: c.firstName,
                    lastName: c.lastName,
                    primeValue: Number(c.primeValue),
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