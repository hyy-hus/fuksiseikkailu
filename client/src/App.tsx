// import { useState } from 'react'
import './App.css'

import L from "leaflet";

import Map from "./Map";

import CheckpointList from "./CheckpointList";

function App() {
    const checkpoints = [
        {
            number: 112,
            name: "Testirasti",
            description: "Rastillamme pelataan mölkkyä",
            location: 0,
            address: "Uusi ylioppilastalo, Mannerheimintie 5A",
            area: "Uusi ylioppilastalo",
            accessible: true,
            host_description: "Järjestöämme ei oikeasti ole",
            rating: 2.5,
            favourite: false,
            completed: false,
        },
        {
            number: 13,
            name: "Akateeminen tuubaseura",
            description: "Tällä rastilla saat soittaa tuubaa niin että suuhun sattuu",
            location: 0,
            address: "Hesperian puisto",
            area: "Hesperian puisto",
            accessible: true,
            host_description: "Akateeminen tuubaseura on maailman vanhin orkesteri.",
            rating: 5,
            favourite: false,
            completed: false,
        }
    ];
    function handleClick(event: L.LeafletMouseEvent, map: L.Map) {
        console.log(event.latlng, map);
    }

    return (
        <div className="App">
            <h1>Fuksiseikkailu</h1>
            <CheckpointList checkpoints={checkpoints} />
            <Map clickCallback={handleClick} />
        </div>
    )
}

export default App
