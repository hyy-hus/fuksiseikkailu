import { createFileRoute } from '@tanstack/react-router'

import { CheckpointMap, type Checkpoint } from '@/components/CheckpointMap';

export const Route = createFileRoute('/')({
    component: RouteComponent,
})

function RouteComponent() {
    const sampleCheckpoints: Checkpoint[] = [
        {
            id: '1',
            number: 1,
            name: 'Päärakennus (Main Building)',
            description: 'Welcome orientation and check-in station.',
            latitude: 60.1699,
            longitude: 24.9484,
            category: 'academic',
        },
        {
            id: '2',
            number: 2,
            name: 'Kumpula Campus',
            description: 'Science student challenges.',
            latitude: 60.2045,
            longitude: 24.962,
            category: 'sports',
        },
        {
            id: '3',
            number: 3,
            name: 'Checkpoint A',
            description: 'A description for checkpoint A',
            latitude: 60.1772,
            longitude: 24.9317,
            category: 'academic',
        },
        {
            id: '3',
            number: 3,
            name: 'Checkpoint B',
            description: 'A description for checkpoint B',
            latitude: 60.1771,
            longitude: 24.9319,
            category: 'academic',
        }
    ]

    return (
        <div className="h-[calc(100vh-4rem)] w-full p-1">
            <CheckpointMap checkpoints={sampleCheckpoints} />
        </div>
    )
}

