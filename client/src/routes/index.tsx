import { createFileRoute } from '@tanstack/react-router'

import { CheckpointMap, type Checkpoint } from '@/components/CheckpointMap';
import { Flag, PartyPopper } from 'lucide-react';
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/')({
    component: RouteComponent,
})

function RouteComponent() {
    const { t } = useTranslation()
    const sampleCheckpoints: Checkpoint[] = [
        {
            id: '1',
            number: 1,
            name: t('prakennusMainBuilding', 'Päärakennus (Main Building)'),
            description: t('welcomeOrientationAndCheckinStation', 'Welcome orientation and check-in station.'),
            latitude: 60.1699,
            longitude: 24.9484,
            category: 'academic',
        },
        {
            id: '2',
            number: 2,
            name: t('kumpulaCampus', 'Kumpula Campus'),
            description: t('scienceStudentChallenges', 'Science student challenges.'),
            latitude: 60.2045,
            longitude: 24.962,
            category: 'sports',
        },
        {
            id: '3',
            number: 3,
            name: t('checkpointA', 'Checkpoint A'),
            description: t('aDescriptionForCheckpointA', 'A description for checkpoint A'),
            latitude: 60.1772,
            longitude: 24.9317,
            category: 'academic',
        },
        {
            id: '3',
            number: 3,
            name: t('checkpointB', 'Checkpoint B'),
            description: t('aDescriptionForCheckpointB', 'A description for checkpoint B'),
            latitude: 60.1771,
            longitude: 24.9319,
            category: 'academic',
        },
        {
            id: 'start-area',
            name: t('startingAreaSenaatintori', 'Starting Area (Senaatintori)'),
            description: t('registrationKickoffBriefingAt1600', 'Registration & Kickoff briefing at 16:00.'),
            latitude: 60.1695,
            longitude: 24.9525,
            icon: <Flag />,
            category: 'start',
        },
        {
            id: 'cp-1',
            number: 4,
            name: t('checkpoint1Kaisaniemi', 'Checkpoint 1: Kaisaniemi'),
            description: t('triviaStation', 'Trivia station.'),
            latitude: 60.174,
            longitude: 24.946,
            category: 'academic',
        },
        {
            id: 'afterparty-venue',
            name: t('officialAfterpartyTavastia', 'Official Afterparty (Tavastia)'),
            description: t('doorsOpenAt2100', 'Doors open at 21:00.'),
            latitude: 60.169,
            longitude: 24.933,
            icon: <PartyPopper />,
            category: 'afterparty',
        },
    ]

    return (
        <div className="h-[calc(100vh-4rem)] w-full p-1">
            <CheckpointMap checkpoints={sampleCheckpoints} />
        </div>
    )
}

