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

}

module.exports = createMainServer;