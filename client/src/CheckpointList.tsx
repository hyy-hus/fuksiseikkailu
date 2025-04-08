import { } from 'react';

import "./CheckpointList.css";

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
    value: number
}

function Rating(props: RatingProps) {
    return (
        <div className="Rating">
            {props.value}
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
            <Rating value={props.data.rating} />
            <div className="circles">
                <span className="accessible">A</span>
                <span className="favourite">F</span>
                <span className="completed">C</span>
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
                props.checkpoints.map(checkpoint => <Checkpoint data={checkpoint} />)
            }
        </div>
    );
}

export default CheckpointList;
