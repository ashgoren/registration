import { useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { Button, Typography, Box } from '@mui/material';
import { DocusealForm } from '@docuseal/react'
import { createWaiverSubmission } from 'src/firebase';
import { Loading, Header, NavButtons, Error } from 'components/layouts';
import { StyledPaper, StyledLink } from 'components/layouts/SharedStyles';
import { useOrderData } from 'contexts/OrderDataContext';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { usePageNavigation } from 'hooks/usePageNavigation';
import { config } from 'config';
import { logDebug } from 'src/logger';
import type { Person } from 'types/order';

export const WaiverWrapper = () => {
  const { order, updateOrder } = useOrderData();
  const { error, setError } = useOrderFlow();
  const { goNext, goBack } = usePageNavigation();

  const [selectedPersonIndex, setSelectedPersonIndex] = useState<number | undefined>(undefined);
  const [isCreatingWaiver, setIsCreatingWaiver] = useState(false);
  const [waiverSlug, setWaiverSlug] = useState<string | null>(null);
  
  const people = order.people || [];
  const isShowingWaiver = selectedPersonIndex !== undefined;
  // Only the registrant signs here; additional attendees are emailed a waiver after registration
  const registrantWaiverComplete = !!people[0]?.waiver;

  useBlocker(isShowingWaiver);

  const handleCreateWaiver = async (idx: number) => {
    const person = people[idx];
    setSelectedPersonIndex(idx);
    setIsCreatingWaiver(true);
    setError(null);

    logDebug('Creating waiver submission for:', person);
    try {
      const response = await createWaiverSubmission({
        name: `${person.first} ${person.last}`,
        phone: person.phone,
        email: person.email
      });
      logDebug('Waiver submission created:', response);
      setWaiverSlug(response.slug);
    } catch (error) {
       console.error('Error creating waiver submission:', error);
      setError(`There was an error preparing your waiver: ${(error as Error).message}. Please email ${config.contacts.tech} for assistance.`);
      setSelectedPersonIndex(undefined);
    } finally {
      setIsCreatingWaiver(false);
    }
  };

  const handleWaiverComplete = (data: { submission: { url: string } }) => {
    logDebug('Waiver completed:', data);
    const updatedPeople = people.map((person, idx) => 
      idx === selectedPersonIndex
        ? { ...person, waiver: data.submission.url }
        : person
    );
    updateOrder({ people: updatedPeople });
    setSelectedPersonIndex(undefined);
    setWaiverSlug(null);
  };

  return (
    <>
      <Header titleText={config.event.title}>
        <Typography variant='h6' align='center'>Waiver</Typography>
      </Header>

      {error && <Box sx={{ mb: 4 }}><Error /></Box>}

      {isShowingWaiver ? (
        <>
          <Waiver
            person={people[selectedPersonIndex]}
            slug={waiverSlug}
            onComplete={handleWaiverComplete}
            isCreatingWaiver={isCreatingWaiver}
          />
          <NavButtons back={{ text: 'Cancel', onClick: () => setSelectedPersonIndex(undefined) }} />
        </>
      ) : (
        <>
          <PersonList
            people={people}
            onSelect={handleCreateWaiver}
          />
          <NavButtons
            back={{ text: 'Back', onClick: () => goBack() }}
            next={{ text: 'Next', onClick: () => goNext(), disable: !registrantWaiverComplete }}
          />
        </>
      )}
    </>
  );
};

const PersonList = ({ people, onSelect }: { people: Person[]; onSelect: (idx: number) => void }) => {
  const [registrant, ...attendees] = people;

  return (
    <StyledPaper>
      {!registrant?.waiver ? (
        <>
          <Typography variant='body1' gutterBottom>
            Please read and sign your waiver below. It must be completed even if you've attended previously.
          </Typography>
          <Typography variant='body1' gutterBottom sx={{ mt: 2 }}>
            You may preview the waiver <StyledLink to="/supersonic/supersonic-waiver.pdf">here</StyledLink>, but please sign it electronically below.
          </Typography>
        </>
      ) : (
        <Typography variant='body1' gutterBottom>
          Thanks for completing your waiver. Click "Next" to continue.
        </Typography>
      )}
      {attendees.length > 0 && (
        <Typography variant='body1' gutterBottom sx={{ mt: 2 }}>
          Each attendee must sign their own waiver. After you complete registration, the other
          {attendees.length === 1 ? ' attendee' : ' attendees'} will be emailed a link to sign theirs.
          Please make sure the {attendees.length === 1 ? 'address below is' : 'addresses below are'} correct.
        </Typography>
      )}
      {registrant && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 4, alignItems: 'center' }}>
          {registrant.first} {registrant.last}
          {registrant.waiver ?
            <Typography color='secondary'>Waiver Completed</Typography>
            :
            <Button variant='contained' color='secondary' onClick={() => onSelect(0)}>
              Click to Sign Waiver
            </Button>
          }
        </Box>
      )}
      {attendees.map((person, idx) => (
        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', my: 4, alignItems: 'center', gap: 2 }}>
          {person.first} {person.last}
          <Typography color='text.secondary' sx={{ textAlign: 'right', wordBreak: 'break-word' }}>
            Waiver will be emailed to {person.email}
          </Typography>
        </Box>
      ))}
    </StyledPaper>
  );
};

const Waiver = ({ person, onComplete, isCreatingWaiver, slug }: {
  person: Person;
  onComplete: (data: { submission: { url: string } }) => void;
  isCreatingWaiver: boolean; slug: string | null
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    (isCreatingWaiver || !slug) ? (
      <StyledPaper extraStyles={{ textAlign: 'center' }}>
        <Loading text='Please wait while we prepare your waiver...' />
      </StyledPaper>
    ) : (
      <>
        {!isLoaded && (
          <StyledPaper extraStyles={{ textAlign: 'center' }}>
            <Loading text='Loading waiver form...' />
          </StyledPaper>
        )}
        <DocusealForm
          src={`https://docuseal.com/s/${slug}`}
          email={person.email}
          onLoad={() => setIsLoaded(true)}
          onComplete={onComplete}
          minimize={true}
        />
      </>
    )
  );
};
