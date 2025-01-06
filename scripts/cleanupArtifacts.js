import { artifactRegistryClient, projectId } from './shared.js';

const REGIONS = [ 'us-central1', 'us-east1', 'us-west1' ];

const cleanupArtifacts = async (projectId) => {
  try {
    for (const location of REGIONS) {
      try {
        const [repositories] = await artifactRegistryClient.listRepositories({
          parent: `projects/${projectId}/locations/${location}`
        });

        for (const repo of repositories) {
          if (repo.name.includes('gcf-artifacts')) {
            console.log(`Attempting to delete repository: ${repo.name}`);
            artifactRegistryClient.deleteRepository({
              name: repo.name,
              force: true
            });
          }
        }
      } catch (error) {
        console.error(`Error in ${location}:`, error);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

console.log(`\nCleaning up artifacts for ${projectId}...\n`);
cleanupArtifacts(projectId);
