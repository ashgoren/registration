import { logger } from 'firebase-functions/v2';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
const client = new SecretManagerServiceClient();

export const onSecretVersionHandler = async (req, res) => {
  const auditLog = req.body;  
  try {
    if (auditLog.protoPayload?.methodName === 'google.cloud.secretmanager.v1.SecretManagerService.AddSecretVersion') {
      const resourceName = auditLog.protoPayload.resourceName;
      const secretName = resourceName.split('/secrets/')[1].split('/versions/')[0];
      const parent = resourceName.split('/versions/')[0];
      const versionNumber = resourceName.split('/versions/')[1];
      const projectId = auditLog.resource.labels.project_id;
      logger.info(`${projectId}: Secret "${secretName}" version ${versionNumber} added`);

      const [versions] = await client.listSecretVersions({
        parent,
        filter: "state:ENABLED OR state:DISABLED",
      });

      if (versions.length <= 1) {
        logger.info("No old versions to destroy.");
        res.status(200).send('OK');
        return;
      }

      versions.sort((a, b) => {
        const timeA = Number(a.createTime.seconds);
        const timeB = Number(b.createTime.seconds);
        return timeB - timeA;
      });

      const oldVersions = versions.slice(1);

      logger.log(`  - Found ${oldVersions.length} old versions to destroy.`);

      const destroyPromises = oldVersions.map(version => {
        logger.log(`    - Scheduling destroy for ${version.name}`);
        return client.destroySecretVersion({ name: version.name });
      });

      await Promise.all(destroyPromises);
      logger.info(`✅ Successfully destroyed ${oldVersions.length} old versions.`);
    }
  } catch (error) {
    logger.error(`Error processing secret version addition: ${error}`);
  }
  res.status(200).send('OK');
};
