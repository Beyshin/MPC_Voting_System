import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    // Definiujemy etapy testu (np. stopniowe zwiększanie ruchu)
    stages: [
        { duration: '30s', target: 50 },  // W 30 sekund zwiększ do 50 użytkowników jednocześnie
        { duration: '1m', target: 50 },   // Utrzymaj 50 użytkowników przez minutę
        { duration: '10s', target: 0 },   // Schodzenie do zera
    ],
};

const P = 10007;
const numCandidates = 3; // Załóżmy 3 kandydatów w bazie

export default function () {
    const userId = Math.floor(Math.random() * 1000000) + 1;
    const votingId = 1; // ID przykładowego głosowania z seeda
    const candidateIndex = Math.floor(Math.random() * numCandidates);

    // Tworzenie wektora głosu
    const voteVector = Array(numCandidates).fill(0);
    voteVector[candidateIndex] = 1;

    const serverShares = [[], [], []];

    voteVector.forEach(voteValue => {
        const share1 = Math.floor(Math.random() * P);
        const share2 = Math.floor(Math.random() * P);
        let share3 = (voteValue - share1 - share2) % P;
        if (share3 < 0) share3 += P;

        serverShares[0].push(share1);
        serverShares[1].push(share2);
        serverShares[2].push(share3);
    });

    // Przygotowanie 3 zapytań jednocześnie (asynchronicznie)
    const req1 = {
        method: 'POST',
        url: 'http://localhost:8000/vote',
        body: JSON.stringify({ votingId, userId, shares: serverShares[0] }),
        params: { headers: { 'Content-Type': 'application/json' } },
    };
    const req2 = {
        method: 'POST',
        url: 'http://localhost:8001/vote',
        body: JSON.stringify({ votingId, userId, shares: serverShares[1] }),
        params: { headers: { 'Content-Type': 'application/json' } },
    };
    const req3 = {
        method: 'POST',
        url: 'http://localhost:8002/vote',
        body: JSON.stringify({ votingId, userId, shares: serverShares[2] }),
        params: { headers: { 'Content-Type': 'application/json' } },
    };

    // Wysłanie 3 żądań w tym samym momencie
    const responses = http.batch([req1, req2, req3]);

    // Sprawdzenie, czy serwery odpowiedziały statusem 200
    check(responses[0], { 'status serwera 1 to 200': (r) => r.status === 200 });
    check(responses[1], { 'status serwera 2 to 200': (r) => r.status === 200 });
    check(responses[2], { 'status serwera 3 to 200': (r) => r.status === 200 });

    sleep(1); // Odczekaj sekundę przed kolejnym głosem
}