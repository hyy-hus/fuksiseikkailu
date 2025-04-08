import { } from 'react';

import "./CheckpointList.css";

import FavoriteIcon from "./assets/icons/FavoritePlain";
import CompleteIcon from "./assets/icons/CompletedPlain";
import AccessibilityIcon from "./assets/icons/AccessibilityPlain";
import StarsRating from "./assets/icons/StarsRating.tsx";

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
    return (
        <div className="CheckpointList">
            {
                props.checkpoints.map(checkpoint => <Checkpoint data={checkpoint} key={checkpoint.number} />)
            }
        </div>
    );
}

export default CheckpointList;
