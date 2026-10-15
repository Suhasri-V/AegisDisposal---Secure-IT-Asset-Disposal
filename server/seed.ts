import { db } from './db/store';

console.log('Seeding AegisDisposal database...');
db.resetToDemoData();
console.log('Database successfully seeded with:');
console.log(`- ${db.getUsers().length} Users`);
console.log(`- ${db.getAssets().length} IT Assets`);
console.log(`- ${db.getDisposalRequests().length} Disposal Requests`);
console.log(`- ${db.getWipingRecords().length} Wiping Records`);
console.log(`- ${db.getVerifications().length} Verification Records`);
console.log(`- ${db.getCertificates().length} Certificates`);
console.log(`- ${db.getComplianceRules().length} Compliance Rules`);
console.log(`- ${db.getAuditLogs().length} Audit Logs`);
console.log(`- ${db.getNotifications().length} Notifications`);
console.log('\nSeed completed successfully.');
