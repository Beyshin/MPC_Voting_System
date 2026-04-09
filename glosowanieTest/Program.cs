using System;
using System.Numerics;

namespace TajneGlosowanie
{
    class Program
    {
        static void Main(string[] args)
        {
            // KROK 1: Definiujemy liczby pierwsze przypisane do konkretnych kandydatów.
            BigInteger liczbaPierwszaKandydataA = 11; 
            BigInteger liczbaPierwszaKandydataB = 13; 
            BigInteger liczbaPierwszaKandydataC = 17; 

            BigInteger[] liczbyPierwsze = new BigInteger[] 
            { 
                liczbaPierwszaKandydataA, 
                liczbaPierwszaKandydataB, 
                liczbaPierwszaKandydataC 
            };

            SystemGlosowania system = new SystemGlosowania(liczbyPierwsze);

            Console.WriteLine("Rozpoczynamy głosowanie...");

            // KROK 2/3: Wyborcy oddają głosy.
            // Indeks 0 to Kandydat A, 1 to Kandydat B, 2 to Kandydat C.
            system.OddajGlos(0); // Głos na A
            system.OddajGlos(0); // Głos na A
            
            system.OddajGlos(1); // Głos na B
            system.OddajGlos(1); // Głos na B
            system.OddajGlos(1); // Głos na B
            system.OddajGlos(1);
            system.OddajGlos(1);
            system.OddajGlos(1);
            
            system.OddajGlos(2); // Głos na C

            // KROK 4: Obliczanie ostatecznych wyników
            Console.WriteLine("\nPodliczanie głosów...");
            system.PodliczGlosyIWypiszWyniki();
        }
    }

    class SystemGlosowania
    {
        // Przechowuje liczby pierwsze przypisane każdemu kandydatowi (p1, p2, p3...)
        private BigInteger[] _liczbyPierwszeKandydatow;
        
        // Zmienna 'M', czyli iloczyn wszystkich liczb pierwszych (p1 * p2 * p3)
        // Jest to górna granica naszego "matematycznego świata" w tym algorytmie.
        private BigInteger _iloczynWszystkichLiczbPierwszychM;

        // Symulacja "Serwerów" - każdy z nich trzyma tylko bezsensowny z pozoru kawałek sumy.
        private BigInteger _sumaKawaleczkowNaSerwerze1 = 0;
        private BigInteger _sumaKawaleczkowNaSerwerze2 = 0;
        private BigInteger _sumaKawaleczkowNaSerwerze3 = 0;

        private Random _generatorLosowy = new Random();

        public SystemGlosowania(BigInteger[] liczbyPierwsze)
        {
            _liczbyPierwszeKandydatow = liczbyPierwsze;
            _iloczynWszystkichLiczbPierwszychM = 1;
            
            // Mnożymy wszystkie liczby pierwsze przez siebie, żeby uzyskać 'M'
            foreach (var liczba in liczbyPierwsze)
            {
                _iloczynWszystkichLiczbPierwszychM *= liczba;
            }
        }

        public void OddajGlos(int wybranyKandydatIndeks)
        {

            BigInteger[] wartosciGlosuDlaKandydatow = new BigInteger[_liczbyPierwszeKandydatow.Length];
            for (int i = 0; i < wartosciGlosuDlaKandydatow.Length; i++)
            {
                wartosciGlosuDlaKandydatow[i] = (i == wybranyKandydatIndeks) ? 1 : 0;
            }


            BigInteger zakodowanyGlosX = ChinskieTwierdzenieOResztach(_liczbyPierwszeKandydatow, wartosciGlosuDlaKandydatow);

            // 3. Rozbicie zaszyfrowanego głosu X na 3 kawałki
            // Kawałek 1 i 2 to całkowicie losowe liczby z zakresu od 0 do M.
            BigInteger fragmentGlosuDlaSerwera1 = LosujDuzaLiczbe(_iloczynWszystkichLiczbPierwszychM);
            BigInteger fragmentGlosuDlaSerwera2 = LosujDuzaLiczbe(_iloczynWszystkichLiczbPierwszychM);
            
            // Kawałek 3 jest wyliczany tak, aby po dodaniu do siebie wszystkich trzech fragmentów
            // i wyciągnięciu modulo M, wynik wynosił dokładnie nasz zakodowanyGlosX.
            BigInteger fragmentGlosuDlaSerwera3 = (zakodowanyGlosX - fragmentGlosuDlaSerwera1 - fragmentGlosuDlaSerwera2) % _iloczynWszystkichLiczbPierwszychM;
            
            // Poprawka na to, jak język C# traktuje liczby ujemne przy modulo.
            if (fragmentGlosuDlaSerwera3 < 0) fragmentGlosuDlaSerwera3 += _iloczynWszystkichLiczbPierwszychM; 

            // 4. Każdy z 3 serwerów dostaje swój fragment głosu i dodaje go do swojej puli.
            // Żaden z serwerów nie wie, co przechowują pozostałe dwa!
            _sumaKawaleczkowNaSerwerze1 += fragmentGlosuDlaSerwera1;
            _sumaKawaleczkowNaSerwerze2 += fragmentGlosuDlaSerwera2;
            _sumaKawaleczkowNaSerwerze3 += fragmentGlosuDlaSerwera3;

            Console.WriteLine($"Oddano głos na kandydata nr {wybranyKandydatIndeks + 1}. Głos rozbito na fragmenty i wysłano do serwerów.");
        }

        public void PodliczGlosyIWypiszWyniki()
        {
            // Główny Serwer (czwarty) prosi trzy pozostałe serwery o ich sumy cząstkowe.
            // Dodaje je do siebie i wyciąga modulo M. W ten sposób z magicznych, losowych liczb
            // wyłania się ostateczna suma wszystkich oddanych głosów (X_total).
            BigInteger wielkaSumaWszystkichZdekodowanychGlosow = (_sumaKawaleczkowNaSerwerze1 + _sumaKawaleczkowNaSerwerze2 + _sumaKawaleczkowNaSerwerze3) % _iloczynWszystkichLiczbPierwszychM;
            
            if (wielkaSumaWszystkichZdekodowanychGlosow < 0) wielkaSumaWszystkichZdekodowanychGlosow += _iloczynWszystkichLiczbPierwszychM;

            Console.WriteLine($"\nOdtworzona wielka suma wszystkich głosów to: {wielkaSumaWszystkichZdekodowanychGlosow}");
            Console.WriteLine("Oto wyniki poszczególnych kandydatów:");

            // Żeby dowiedzieć się, ile punktów zdobył dany kandydat, bierzemy naszą
            // wielką sumę i dzielimy z resztą (modulo) przez liczbę pierwszą tego kandydata.
            for (int i = 0; i < _liczbyPierwszeKandydatow.Length; i++)
            {
                BigInteger liczbaZdobytychGlosow = wielkaSumaWszystkichZdekodowanychGlosow % _liczbyPierwszeKandydatow[i];
                Console.WriteLine($"Kandydat {i + 1} (Liczba pierwsza {_liczbyPierwszeKandydatow[i]}): {liczbaZdobytychGlosow} głosów");
            }
        }

        // --- FUNKCJE POMOCNICZE ---

        private BigInteger LosujDuzaLiczbe(BigInteger wartoscMaksymalna)
        {
            byte[] bajty = wartoscMaksymalna.ToByteArray();
            BigInteger wylosowanaLiczba;
            do
            {
                _generatorLosowy.NextBytes(bajty);
                bajty[bajty.Length - 1] &= 0x7F; // Zapobiega wylosowaniu liczby ujemnej
                wylosowanaLiczba = new BigInteger(bajty);
            } while (wylosowanaLiczba >= wartoscMaksymalna);
            return wylosowanaLiczba;
        }

        private BigInteger ChinskieTwierdzenieOResztach(BigInteger[] liczbyPierwsze, BigInteger[] reszty)
        {
            BigInteger iloczynWszystkich = 1;
            foreach (var liczba in liczbyPierwsze) iloczynWszystkich *= liczba;

            BigInteger ostatecznyWynikX = 0;
            for (int i = 0; i < liczbyPierwsze.Length; i++)
            {
                BigInteger czesciowyIloczyn = iloczynWszystkich / liczbyPierwsze[i];
                ostatecznyWynikX += reszty[i] * ZnajdzOdwrotnoscModularna(czesciowyIloczyn, liczbyPierwsze[i]) * czesciowyIloczyn;
            }
            return ostatecznyWynikX % iloczynWszystkich;
        }

        private BigInteger ZnajdzOdwrotnoscModularna(BigInteger wartoscA, BigInteger modulM)
        {
            BigInteger pierwotneM = modulM, t, q;
            BigInteger x0 = 0, x1 = 1;

            if (modulM == 1) return 0;

            while (wartoscA > 1)
            {
                q = wartoscA / modulM;
                t = modulM;
                modulM = wartoscA % modulM;
                wartoscA = t;
                t = x0;
                x0 = x1 - q * x0;
                x1 = t;
            }

            if (x1 < 0) x1 += pierwotneM;
            return x1;
        }
    }
}