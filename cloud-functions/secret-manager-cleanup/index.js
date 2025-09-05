import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
const client = new SecretManagerServiceClient();

// onMessagePublished to secret_created topic
export const onSecretVersionHandler = async (message, context) => {
  const auditLog = JSON.parse(Buffer.from(message.data, 'base64').toString());
  console.log(`Message received for topic secret_created: ${JSON.stringify(auditLog)}`);
  try {
    const resourceName = auditLog.protoPayload.resourceName;
    const secretName = resourceName.split('/secrets/')[1].split('/versions/')[0];
    const parent = resourceName.split('/versions/')[0];
    const versionNumber = resourceName.split('/versions/')[1];
    const projectId = auditLog.resource.labels.project_id;
    console.log(`${projectId}: Secret "${secretName}" version ${versionNumber} added`);

    const [versions] = await client.listSecretVersions({
      parent,
      filter: "state:ENABLED OR state:DISABLED",
    });

    if (versions.length <= 1) {
      console.log("No old versions to destroy.");
      return;
    }

    versions.sort((a, b) => {
      const timeA = Number(a.createTime.seconds);
      const timeB = Number(b.createTime.seconds);
      return timeB - timeA;
    });

    const oldVersions = versions.slice(1);

    console.log(`  - Found ${oldVersions.length} old versions to destroy.`);

    const destroyPromises = oldVersions.map(version => {
      console.log(`    - Scheduling destroy for ${version.name}`);
      return client.destroySecretVersion({ name: version.name });
    });

    await Promise.all(destroyPromises);
    console.log(`✅ Successfully destroyed ${oldVersions.length} old versions.`);
  } catch (error) {
    console.error(`Error processing secret version addition: ${error}`);
  }
};
