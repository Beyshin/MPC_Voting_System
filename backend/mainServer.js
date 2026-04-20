const express = require('express');
const cors = require('cors');
const PrimaryDatabase = require('./services/primaryDb');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const createMainServer = (port) => {
    const app = express();
    app.use(cors());
    app.use(express.json());

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

    app.post('/loginUser', (req, res) => {
        console.log("POST /loginUser");

        const login = req.body.login;
        const password = req.body.password;

        const hashedPassword = db.selectPassword(login).password;
        console.log("Hasło z bazy : " + hashedPassword);

        if(bcrypt.compareSync(password, hashedPassword)) {
            //zgadza sie
            console.log("HASLA SIE ZGADZAJA")
            res.status(200).send({message: "Zalogowano uzytkownika."});

        }else{
            //nie zgadza sie
            console.log("HASLA SIE NIE ZGADZAJA")
            res.status(500).send({message: "Hasła sie nie zgadzaja"});
        }
    })

}

module.exports = createMainServer;