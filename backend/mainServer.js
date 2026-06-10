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
        const P = 10007;

        try {
            const election = db.getElectionById(pollId);
            if (!election) {
                return res.status(404).send({ message: "Nie znaleziono głosowania" });
            }

            const [res1, res2, res3] = await Promise.all([
                fetch(`http://localhost:8000/dataFromPollId?id=${pollId}`).then(r => r.json()),
                fetch(`http://localhost:8001/dataFromPollId?id=${pollId}`).then(r => r.json()),
                fetch(`http://localhost:8002/dataFromPollId?id=${pollId}`).then(r => r.json())
            ]);

            if (!res1.encryptedTotals || !res2.encryptedTotals || !res3.encryptedTotals) {
                return res.status(400).send({ message: "Brak danych o głosach z serwerów obliczeniowych." });
            }

            const numCandidates = election.candidates.length;
            const finalResults = [];
            let totalVotes = 0;


            for (let i = 0; i < numCandidates; i++) {
                let candidateVotes = (res1.encryptedTotals[i] + res2.encryptedTotals[i] + res3.encryptedTotals[i]) % P;

                if (candidateVotes < 0) candidateVotes += P;

                finalResults.push({
                    firstName: election.candidates[i].firstName,
                    lastName: election.candidates[i].lastName,
                    votes: candidateVotes
                });

                totalVotes += candidateVotes;
            }

            console.log(`Wyniki zrekonstruowane pomyślnie dla głosowania ${pollId}`);

            res.status(200).send({
                electionTitle: election.title,
                results: finalResults,
                totalVotes: totalVotes,
                invalidVotes: 0
            });

        } catch (err) {
            console.error("Błąd podczas zliczania wyników:", err);
            res.status(500).send({ message: "Wystąpił błąd podczas obliczania wyników." });
        }
    });

};

module.exports = createMainServer;