import webPush from "web-push";

const keys = webPush.generateVAPIDKeys();

console.log("Add these values to .env and your production host:");
console.log("");
console.log(`NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY="${keys.publicKey}"`);
console.log(`WEB_PUSH_PUBLIC_KEY="${keys.publicKey}"`);
console.log(`WEB_PUSH_PRIVATE_KEY="${keys.privateKey}"`);
console.log('WEB_PUSH_SUBJECT="mailto:support@estatedesk.co.ke"');
console.log("");
console.log("Then sync to Vercel with:");
console.log("  ./scripts/sync-web-push-env.sh .env production");