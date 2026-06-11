import http from 'k6/http';
import { check } from 'k6';

export const options = {
    vus: 1,         // Tylko 1 wirtualny użytkownik (np. członek komisji)
    iterations: 1,  // Tylko 1 powtórzenie (odpytujemy raz)
};

export default function () {
    // Odpytujemy serwer główny o ostateczny wynik wyborów o ID 1
    const res = http.get('http://localhost:8005/results/1');

    // Sprawdzamy, czy serwer poprawnie zrekonstruował dane
    check(res, {
        'Status rekonstrukcji to 200': (r) => r.status === 200,
    });

    // Wyświetlamy sformatowany wynik w konsoli
    if (res.status === 200) {
        console.log(`\n======================================`);
        console.log(` OSTATECZNE WYNIKI ZREKONSTRUOWANE!`);
        console.log(` Czas trwania: ${res.timings.duration.toFixed(2)} ms`);
        console.log(` Odpowiedź serwera: ${res.body}`);
        console.log(`======================================\n`);
    } else {
        console.log(`Błąd rekonstrukcji! Status: ${res.status}`);
    }
}