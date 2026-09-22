import dotenv from 'dotenv';
import { experimental_evaluate as evaluate } from 'ai';

dotenv.config({ path: '.env.local', quiet: true });

try {
  const result = await evaluate({
    model: 'typesafe-ai/jev',
    state: 'A community wants to invent a new annual holiday. It should encourage neighbors to connect, be easy for families to celebrate, and include traditions that people can adapt to their own cultures.',
    questions: {
      holidayName: {
        type: 'choice',
        instructions: 'Which of these original holiday names best fits the idea?',
        criteria: {
          neighborlightDay: 'Neighborlight Day',
          sharedTableFestival: 'Shared Table Festival',
          smallKindnessWeek: 'Small Kindness Week',
          openDoorHoliday: 'The Open Door Holiday',
        },
      },
      familyFriendly: {
        type: 'boolean',
        instructions: 'Would the described holiday concept be suitable for families with children?',
      },
      traditionPotential: {
        type: 'score',
        instructions: 'How much potential does this holiday have for adaptable community traditions?',
        criteria: ['Low', 'Moderate', 'High', 'Very high'],
      },
    },
  });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown request failure';
  console.error(`Jev example failed: ${message}`);
  process.exitCode = 1;
}
