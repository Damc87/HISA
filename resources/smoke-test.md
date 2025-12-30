# Osnovni smoke test za projektni cikel

1. Zaženi aplikacijo v načinu Electron: `npm run electron`.
2. Na začetnem zaslonu klikni »Ustvari prvi projekt« in vpiši samo ime (npr. »Testni projekt«). Potrdi ustvarjanje in preveri, da se odpre Dashboard brez napak.
3. Po ustvarjenem projektu morajo biti podatki o fazah in šifrantih dostopni (tudi če so prazni) brez rdečih napak v konzoli (Electron + browser).
4. Preklopi na zavihke »Stroški«, »Faze« in »Izvajalci« – če ni podatkov, se prikaže stanje »Izberi ali ustvari projekt« z gumbom za akcijo, brez poskusov fetchanja.
5. Preveri gumb »Napolni z vzorčnimi podatki«; po kliku se mora izbrati vzorčni projekt in preusmeriti tok na dashboard ali omogočiti delo z fazami in šifranti.
