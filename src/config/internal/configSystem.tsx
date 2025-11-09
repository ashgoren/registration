const configSystem = {
  PERSON_INPUT_LABELS: [ 'Your contact information', 'Second person', 'Third person', 'Fourth person', 'Fifth person', 'Sixth person', 'Seventh person', 'Eighth person' ],
  NUM_PAGES: 2,
  STEPS: [
    {key: 1, label: 'Info'},
    {key: 2, label: 'Payment'},
    {key: 'checkout', label: 'Checkout'}
  ]
} as const;

export default configSystem;
