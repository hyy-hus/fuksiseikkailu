import { useState, useMemo, useEffect, useCallback } from 'react';
import Fuse from "fuse.js";

import "./CheckpointList.css";

import FavoriteIcon from "../assets/icons/FavoritePlain";
import CompleteIcon from "../assets/icons/CompletedPlain";
import AccessibilityIcon from "../assets/icons/AccessibilityPlain";
import StarsRating from "../assets/icons/StarsRating.tsx";

interface CheckpointData {
    number: number,
    name: string,
    description: string,
    location: number,
    address: string,
    area: string,
    accessible: boolean,
    host_description: string,
    rating: number,
    favourite: boolean,
    completed: boolean,
}

interface RatingProps {
    data: CheckpointData
}

function Rating(props: RatingProps) {
    return (
        <div className="Rating">
            <StarsRating value={props.data.rating} id={props.data.number.toString()} />
            <span>{props.data.rating} / 5</span>
        </div>
    );
}

interface CheckpointProps {
    data: CheckpointData,
}

function Checkpoint(props: CheckpointProps) {
    return (
        <div className="Checkpoint">
            <div className="number"><span>{props.data.number}</span></div>
            <span className="name">{props.data.name}</span>
            <Rating data={props.data} />
            <div className="circles">
                <span className="accessible">
                    <AccessibilityIcon
                        className={`icon ${props.data.accessible ? "enabled" : ""}`}
                    />
                </span>
                <span className="favourite">
                    <FavoriteIcon
                        className={`icon ${props.data.favourite ? "enabled" : ""}`}
                    />
                </span>
                <span className="completed">
                    <CompleteIcon
                        className={`icon ${props.data.completed ? "enabled" : ""}`}
                    />
                </span>
            </div>
        </div >
    );
}

interface CheckpointListProps {
    checkpoints: CheckpointData[]
}

function CheckpointList(props: CheckpointListProps) {
    const [filtered, setFiltered] = useState<CheckpointData[]>(props.checkpoints);
    const [searchKey, setSearchKey] = useState<string>("");

    const [accessibleOnly, setAccessibleOnly] = useState<boolean>(false);
    const [favoriteOnly, setFavoriteOnly] = useState<boolean>(false);

    const fuse = useMemo(() => {
        const fuse_options = {
            keys: [
                "name",
                "description",
                { name: "number", getFn: (item: CheckpointData) => item.number.toString() }
            ],
            threshold: 0.3,
        };

        return new Fuse(props.checkpoints, fuse_options);
    }, [props.checkpoints]);

    const handleSearch = useCallback((value: string) => {
        setSearchKey(value);

        let results = (value != "") ? fuse.search(value).map(result => result.item) : props.checkpoints;

        if (accessibleOnly) {
            results = results.filter(item => item.accessible);
        }

        if (favoriteOnly) {
            results = results.filter(item => item.favourite);
        }

        setFiltered(results);
    }, [accessibleOnly, favoriteOnly, fuse, props.checkpoints]);

    const handleClear = useCallback(() => {
        setSearchKey("");
        handleSearch("");
    }, [handleSearch])

    function handleAccessibilityToggle() {
        setAccessibleOnly(!accessibleOnly);
    }

    function handleFavoriteToggle() {
        setFavoriteOnly(!favoriteOnly);
    }

    useEffect(() => {
        handleSearch(searchKey);
    }, [accessibleOnly, favoriteOnly, handleSearch, searchKey]);

    return (
        <div className="CheckpointList">
            <div className="Search">
                <div className="search">
                    <input type="text" placeholder="Search" value={searchKey} onChange={(e) => handleSearch(e.target.value)} />
                    <input type="button" value="x" onClick={() => handleClear()} />
                </div>
                <div className="toggles">
                    <span className="toggle accessibility" onClick={() => handleAccessibilityToggle()}>
                        <AccessibilityIcon
                            className={`icon ${accessibleOnly ? "enabled" : ""}`}
                        />
                    </span>
                    <span className="toggle favorites" onClick={() => handleFavoriteToggle()}>
                        <FavoriteIcon
                            className={`icon ${favoriteOnly ? "enabled" : ""}`}
                        />
                    </span>
                </div>
            </div>
            {
                filtered.length > 0 ? filtered.map(checkpoint => <Checkpoint data={checkpoint} key={checkpoint.number} />) : (
                    <div className="no-results">
                        Ei tuloksia
                    </div>
                )
            }
        </div>
    );
}

export default CheckpointList;
