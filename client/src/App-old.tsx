// import { useState } from 'react'
import "./reset.css";
import './App.css'

// import L from "leaflet";

// import Map from "./Map/Map";
//
// import CheckpointList from "./Checkpoint/CheckpointList";
// import Checkpoint from "./Checkpoint/Checkpoint";
//

// interface CheckpointData {
//     number: number,
//     name: string,
//     description: string,
//     location: [number, number],
//     address: string,
//     area: string,
//     accessible: boolean,
//     host_description: string,
//     rating: number,
//     favourite: boolean,
//     completed: boolean,
// }

function App() {
    // const checkpoints: CheckpointData[] = [
    //     {
    //         number: 112,
    //         name: "Testirasti",
    //         description: "Rastillamme pelataan mölkkyä",
    //         location: [60.206731, 24.827003],
    //         address: "Uusi ylioppilastalo, Mannerheimintie 5A",
    //         area: "Uusi ylioppilastalo",
    //         accessible: false,
    //         host_description: "Järjestöämme ei oikeasti ole",
    //         rating: 2.5,
    //         favourite: true,
    //         completed: false,
    //     },
    //     {
    //         number: 113,
    //         name: "Kultarasti",
    //         description: "Aloituskohta kulttureitille ja hauskaan ulkoiluun",
    //         location: [60.16954075518176, 24.940080607961587],
    //         address: "Kultaportti 4, Helsinki",
    //         area: "Keskusta",
    //         accessible: true,
    //         host_description: "Suosittu reitti kaikille ulkoilijoille",
    //         rating: 4.0,
    //         favourite: false,
    //         completed: false,
    //     },
    //     {
    //         number: 114,
    //         name: "Mustarasti",
    //         description: "Haasteellinen osa metsäreittiä",
    //         location: [60.218377, 25.009476],
    //         address: "Metsäaukio 7, Tampere",
    //         area: "Tampereen ydinkeskusta",
    //         accessible: false,
    //         host_description: "Luonnonläheinen ja hieman vaativa",
    //         rating: 3.8,
    //         favourite: false,
    //         completed: true,
    //     },
    //     {
    //         number: 115,
    //         name: "Peurarasti",
    //         description: "Nopeat ja ketterät reitit luonnossa",
    //         location: [60.237062, 24.844343],
    //         address: "Eläintie 3, Espoo",
    //         area: "Espoon laitamet",
    //         accessible: true,
    //         host_description: "Sopii perheille ja luontoretkeilijöille",
    //         rating: 4.5,
    //         favourite: true,
    //         completed: true,
    //     },
    //     {
    //         number: 116,
    //         name: "Jättirasti",
    //         description: "Pitkä ja vaativa reitti suurella juoksuosuudella",
    //         location: [60.180631, 24.828343],
    //         address: "Räjäytystie 2, Vantaa",
    //         area: "Vantaan teollisuusalue",
    //         accessible: false,
    //         host_description: "Vaatii hyvää kuntoa ja reippautta",
    //         rating: 3.2,
    //         favourite: false,
    //         completed: false,
    //     },
    //     {
    //         number: 117,
    //         name: "Kotirasti",
    //         description: "Helppo ja ystävällinen reitti kotioloihin",
    //         location: [60.156237, 24.961499],
    //         address: "Kotikatu 12, Oulu",
    //         area: "Oulun keskustan laidat",
    //         accessible: true,
    //         host_description: "Täydellinen aloittelijoille",
    //         rating: 4.0,
    //         favourite: false,
    //         completed: false,
    //     },
    //     {
    //         number: 118,
    //         name: "Vesirasti",
    //         description: "Luonnon kosketus ja tiheä vehreys",
    //         location: [60.133184, 24.875675],
    //         address: "Vesitie 5, Jyväskylä",
    //         area: "Jyväskylän rannikko",
    //         accessible: true,
    //         host_description: "Kesäinen reitti lähellä vettä",
    //         rating: 4.3,
    //         favourite: true,
    //         completed: false,
    //     },
    //     {
    //         number: 119,
    //         name: "Lumirasti",
    //         description: "Talvinen versio, jossa viileä tunnelma on taattu",
    //         location: [60.207986, 24.972584],
    //         address: "Lumitie 8, Rovaniemi",
    //         area: "Revontulikylä",
    //         accessible: false,
    //         host_description: "Tarvitset lämpimät varusteet",
    //         rating: 3.9,
    //         favourite: false,
    //         completed: true,
    //     },
    //     {
    //         number: 120,
    //         name: "Kalliorasti",
    //         description: "Kivikko reitti, jossa vuoriston henki henkii",
    //         location: [60.156453, 24.984994],
    //         address: "Kalliontie 14, Kuopio",
    //         area: "Kuopion laidunta",
    //         accessible: false,
    //         host_description: "Vaatii varovaisuutta ja kokemusta",
    //         rating: 3.0,
    //         favourite: true,
    //         completed: false,
    //     },
    //     {
    //         number: 121,
    //         name: "Silta Rasti",
    //         description: "Kävelyreitti yli kauniin sillan",
    //         location: [60.227132, 24.821820],
    //         address: "Siltakatu 1, Lahti",
    //         area: "Lahti",
    //         accessible: true,
    //         host_description: "Helppo ja nopea reitti, kaikille sopiva",
    //         rating: 4.7,
    //         favourite: true,
    //         completed: true,
    //     },
    //     {
    //         number: 122,
    //         name: "Luonnonrasti",
    //         description: "Reitti halki vehreiden peltojen ja metsien",
    //         location: [60.226698, 25.015479],
    //         address: "Luontotie 16, Seinäjoki",
    //         area: "Seinäjoen maaseutu",
    //         accessible: true,
    //         host_description: "Nautinnollinen luonnonrauha odottaa",
    //         rating: 4.1,
    //         favourite: false,
    //         completed: false,
    //     },
    //     {
    //         number: 123,
    //         name: "Historia Rasti",
    //         description: "Reitti, joka johdattaa menneisyyden jännittäviin tarinoihin",
    //         location: [60.170830, 24.863534],
    //         address: "Historiankuja 3, Porvoo",
    //         area: "Vanha Porvoo",
    //         accessible: true,
    //         host_description: "Kävelyretki aikojen saatossa",
    //         rating: 3.6,
    //         favourite: false,
    //         completed: true,
    //     },
    //     {
    //         number: 124,
    //         name: "Taide Rasti",
    //         description: "Käyntikortti paikallisiin gallerioihin ja taidemuseoihin",
    //         location: [60.244866, 24.914246],
    //         address: "Taidekatu 8, Turku",
    //         area: "Turun kulttuurikeskus",
    //         accessible: true,
    //         host_description: "Inspiroiva reitti kulttuurin ystäville",
    //         rating: 4.5,
    //         favourite: true,
    //         completed: false,
    //     },
    //     {
    //         number: 125,
    //         name: "Rantirasti",
    //         description: "Reitti merenrannalla kauniin maiseman äärellä",
    //         location: [60.141130, 24.847081],
    //         address: "Rantatie 20, Hanko",
    //         area: "Hankon ranta",
    //         accessible: true,
    //         host_description: "Merellinen maisema ja rento tunnelma",
    //         rating: 3.7,
    //         favourite: false,
    //         completed: false,
    //     },
    //     {
    //         number: 126,
    //         name: "Kuusirasti",
    //         description: "Kävely reitin varrella, jonka varjossa kuuset kohoavat",
    //         location: [60.231699, 24.989043],
    //         address: "Kuusikatu 15, Kuopio",
    //         area: "Kuopion metsäalue",
    //         accessible: false,
    //         host_description: "Luonnon rauhaa ja hiljaisuutta",
    //         rating: 3.3,
    //         favourite: true,
    //         completed: false,
    //     },
    //     {
    //         number: 127,
    //         name: "Kevätrasti",
    //         description: "Reitti, joka juhlii kevään kukkaloistoa",
    //         location: [60.226855, 25.024325],
    //         address: "Kukkatie 9, Joensuu",
    //         area: "Joensuun puistot",
    //         accessible: true,
    //         host_description: "Virkistävä ja värikäs reitti",
    //         rating: 4.8,
    //         favourite: true,
    //         completed: true,
    //     },
    //     {
    //         number: 128,
    //         name: "Syyrirasti",
    //         description: "Reitti, jossa syksyn värit ovat huipussaan",
    //         location: [60.194347, 25.092472],
    //         address: "Syystie 4, Lappeenranta",
    //         area: "Lappeenrannan luonnonkauneus",
    //         accessible: false,
    //         host_description: "Tunnelmallinen reitti syksyn lumossa",
    //         rating: 3.9,
    //         favourite: false,
    //         completed: false,
    //     },
    //     {
    //         number: 129,
    //         name: "Yö Rasti",
    //         description: "Rasti, jossa yövalaistus tuo mystiikkaa reittiin",
    //         location: [60.175424, 24.974571],
    //         address: "Yötie 12, Oulu",
    //         area: "Oulun yötunnelma",
    //         accessible: false,
    //         host_description: "Jännittävä ja salaperäinen kävely",
    //         rating: 4.0,
    //         favourite: true,
    //         completed: false,
    //     },
    //     {
    //         number: 130,
    //         name: "Marja Rasti",
    //         description: "Reitti, jossa luonnon marjat ovat parhaimmillaan",
    //         location: [60.229529, 24.993186],
    //         address: "Marjakatu 7, Kokkola",
    //         area: "Kokkola",
    //         accessible: true,
    //         host_description: "Herkullinen reitti luonnon antimista",
    //         rating: 4.2,
    //         favourite: false,
    //         completed: false,
    //     },
    //     {
    //         number: 131,
    //         name: "Seikkailu Rasti",
    //         description: "Loppurasti seikkailun ystäville täydellisenä huipentumana",
    //         location: [60.233405, 24.981659],
    //         address: "Seikkailukatu 1, Rovaniemi",
    //         area: "Rovaniemen seikkailualue",
    //         accessible: true,
    //         host_description: "Huikea lopetus reissussa, jännittävä ja palkitseva",
    //         rating: 4.9,
    //         favourite: true,
    //         completed: true,
    //     }
    // ];

    // function handleClick(event: L.LeafletMouseEvent, map: L.Map) {
    //     console.log(event.latlng, map);
    // }

    // const [selected, setSelected] = useState<CheckpointData | undefined>();

    // function handleSelect(checkpoint: CheckpointData) {
    //     const filtered = checkpoints.filter(item => item.name === checkpoint.name)
    //     if (filtered) {
    //         setSelected(filtered[0]);
    //     }
    // }

    return (
        <div className="App">
            <h1>Fuksiseikkailu</h1>
            {/* <UserList /> */}
            {/* <CheckpointList checkpoints={checkpoints} handleSelect={handleSelect} /> */}
            {/* { */}
            {/*     (selected) ? ( */}
            {/*         <Checkpoint data={selected} /> */}
            {/*     ) : <div /> */}
            {/* } */}
            {/* <Map clickCallback={handleSelect} checkpoints={checkpoints} selected={selected} /> */}
        </div>
    )
}

export default App
