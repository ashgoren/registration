import { useEffect, useState } from 'react';
import { useFormikContext } from 'formik';
import { Button, Typography, Box } from '@mui/material';
import { DocusealForm } from '@docuseal/react'
import { createWaiverSubmission } from 'src/firebase';
import { Loading } from 'components/layouts';
import { StyledPaper, StyledLink } from 'components/layouts/SharedStyles';
import { useOrderData } from 'contexts/OrderDataContext';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { config } from 'config';
import { logDebug } from 'src/logger';
// import { NavButtons } from 'components/layouts';
import type { Order, Person } from 'types/order';

const { TECH_CONTACT } = config;

export const WaiverWrapper = ({ setDisableNext }: { setDisableNext: (disable: boolean) => void }) => {
  const { updateOrder } = useOrderData();
  const { setError } = useOrderFlow();

  const { values, setFieldValue } = useFormikContext<Order>();
  const [selectedPersonIndex, setSelectedPersonIndex] = useState<number | undefined>(undefined);
  const [isCreatingWaiver, setIsCreatingWaiver] = useState(false);
  const [waiverSlug, setWaiverSlug] = useState<string | null>(null);
  
  const people = values?.people || [];
  const isShowingWaiver = selectedPersonIndex !== undefined;
  const allWaiversComplete = people.every(person => person.waiver);

  useEffect(() => {
    setDisableNext(!allWaiversComplete);
  }, [allWaiversComplete, setDisableNext]);

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
      setError(`There was an error preparing your waiver: ${(error as Error).message}. Please email ${TECH_CONTACT} for assistance.`);
      setSelectedPersonIndex(undefined);
    } finally {
      setIsCreatingWaiver(false);
    }
  };

  const handleWaiverComplete = (data: { submission: { url: string } }) => {
    logDebug('Waiver completed:', data);
    const updatedPeople = values.people.map((person, idx) => 
      idx === selectedPersonIndex
        ? { ...person, waiver: data.submission.url }
        : person
    );
    setFieldValue('people', updatedPeople);
    updateOrder({ people: updatedPeople });
    setSelectedPersonIndex(undefined);
    setWaiverSlug(null);
  };

  // const handleBack = () => {
  //   setError(null);
  //   if (isShowingWaiver) {
  //     setSelectedPersonIndex(undefined);
  //   } else {
  //     setCurrentPage(currentPage - 1);
  //   }
  // };

  return (
    <>
      {isShowingWaiver ? (
        <>
          <Waiver
            person={people[selectedPersonIndex]}
            slug={waiverSlug}
            onComplete={handleWaiverComplete}
            isCreatingWaiver={isCreatingWaiver}
          />
          {/* <NavButtons back={{ text: 'Cancel', onClick: () => setSelectedPersonIndex(undefined) }} /> */}
        </>
      ) : (
        <PersonList
          people={people}
          onSelect={handleCreateWaiver}
        />
      )}
    </>
  );
};

const PersonList = ({ people, onSelect }: { people: Person[]; onSelect: (idx: number) => void }) => {
  return (
    <StyledPaper>
      {people.some(person => !person.waiver) ? (
        <>
          <Typography variant='body1' gutterBottom>
            {people.length === 1 ? (<>
              Please read and sign the waiver below. It must be completed even if you've attended previously.
            </>) : (<>
              Please read and sign your waiver below. It must be completed even if you've attended previously.
              <strong> Each waiver must be read and signed by the individual attending the event.</strong>
            </>)}
          </Typography>
          <Typography variant='body1' gutterBottom sx={{ mt: 2 }}>
            You may preview the waiver <StyledLink to="/supersonic/supersonic-waiver.pdf">here</StyledLink>, but please sign it electronically below.
          </Typography>
        </>
      ) : (
        <Typography variant='body1' gutterBottom>
          Thanks for completing the {people.length === 1 ? 'waiver' : 'waivers'}. Click "Next" to continue.
        </Typography>
      )}
      {people.map((person, idx) => (
        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', my: 4, alignItems: 'center' }}>
          {person.first} {person.last}
          {person.waiver ?
            <Typography color='secondary'>Waiver Completed</Typography>
            :
            <Button variant='contained' color='secondary' onClick={() => onSelect(idx)}>
              Click to Sign Waiver
            </Button>
          }
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
