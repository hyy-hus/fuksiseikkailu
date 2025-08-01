import "./Checkpoint.css";

import FavoriteIcon from "../../assets/icons/FavoritePlain";
import CompleteIcon from "../../assets/icons/CompletedPlain";
import AccessibilityIcon from "../../assets/icons/AccessibilityPlain";
import StarsRating from "../../assets/icons/StarsRating.tsx";

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


interface CheckpointData {
    number: number,
    name: string,
    description: string,
    location: [number, number],
    address: string,
    area: string,
    accessible: boolean,
    host_description: string,
    rating: number,
    favourite: boolean,
    completed: boolean,
}

interface CheckpointProps {
    data: CheckpointData
}

function Checkpoint(props: CheckpointProps) {
    function navigate_to_checkpoint(event: React.MouseEvent<HTMLAnchorElement>) {
        event.preventDefault();
        console.log(props.data);
    }

    return (
        <div className="Checkpoint">
            <div className="circle number">
                <span>{props.data.number}</span>
            </div>
            <h3 className="name">
                {props.data.name}
            </h3>
            <div className="rating">
                <Rating data={props.data} />
            </div>
            <div className="circles">
                <AccessibilityIcon className={`icon accessibility ${props.data.accessible ? "enabled" : ""}`} />
                <FavoriteIcon className={`icon favorite ${props.data.favourite ? "enabled" : ""}`} />
                <CompleteIcon className={`icon completed ${props.data.completed ? "enabled" : ""}`} />
            </div>
            <div className="description">
                {props.data.description}
            </div>
            <div className="address">
                {props.data.address}
            </div>
            <div className="nav">
                <a className="nav button" href="" onClick={navigate_to_checkpoint} >Löydä rastille!</a>
            </div>
            <div className="host">
                {props.data.host_description}
            </div>
            <div className="links">
                <a className="more button" href="">Lue lisää!</a>
            </div>

        </div>
    )
}

export default Checkpoint;
