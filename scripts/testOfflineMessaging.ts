import { saveLocalDraft, getLocalDrafts, getAllPendingSyncRecords, updateLocalSyncState } from '../src/utils/indexedDB';
import { DirectMessage } from '../src/types';

console.log('================================================================');
console.log('JANMASAATHI - OFFLINE MESSAGING & SYNC VERIFICATION');
console.log('================================================================');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] Test ${totalTests}: ${testName}`);
  } else {
    console.error(`[FAIL] Test ${totalTests}: ${testName}`);
    if (details) console.error(`       Details: ${details}`);
  }
}

async function runOfflineMessagingTests() {
  try {
    // -------------------------------------------------------------
    // TEST 1: Save local message draft in IndexedDB when offline
    // -------------------------------------------------------------
    const offlineMsgId = `MSG-TEST-${Date.now()}`;
    const testMotherId = 'MCP-2026-0894';
    const testWorkerId = 'HW-44120';

    const localMsgDraft: DirectMessage = {
      id: offlineMsgId,
      senderId: testMotherId,
      senderName: 'Priya Sharma',
      senderRole: 'mother',
      motherId: testMotherId,
      text: 'I am feeling mild dizziness after taking my morning iron tablet.',
      timestamp: '10:15 AM',
      delivered: false,
      read: false,
      syncStatus: 'pending_sync',
      retryCount: 0,
      lastAttemptAt: new Date().toISOString(),
    };

    const savedRecord = await saveLocalDraft('messageDrafts', {
      ...localMsgDraft,
      owningUid: testMotherId,
      relatedMotherId: testMotherId,
      syncState: 'pending_sync',
    });

    assert(
      savedRecord.id === offlineMsgId && savedRecord.syncState === 'pending_sync',
      'Test 1: Save outgoing message locally to IndexedDB messageDrafts store before network transmission',
      `Record ID: ${savedRecord.id}, Sync State: ${savedRecord.syncState}`
    );

    // -------------------------------------------------------------
    // TEST 2: Retrieve local message drafts from IndexedDB
    // -------------------------------------------------------------
    const allDrafts = await getLocalDrafts<DirectMessage>('messageDrafts');
    const retrieved = allDrafts.find((d) => d.id === offlineMsgId);

    assert(
      retrieved !== undefined && retrieved.text === localMsgDraft.text,
      'Test 2: Retrieve stored offline message draft from local store across sessions',
      `Text match: ${retrieved?.text}`
    );

    // -------------------------------------------------------------
    // TEST 3: Health Worker reply offline draft
    // -------------------------------------------------------------
    const workerMsgId = `MSG-WORKER-${Date.now()}`;
    const workerMsgDraft: DirectMessage = {
      id: workerMsgId,
      senderId: testWorkerId,
      senderName: 'Sunita Devi',
      senderRole: 'worker',
      motherId: testMotherId,
      text: 'Please drink plenty of water and rest on your left side. I will check on you.',
      timestamp: '10:20 AM',
      delivered: false,
      read: false,
      syncStatus: 'pending_sync',
    };

    const savedWorkerRecord = await saveLocalDraft('messageDrafts', {
      ...workerMsgDraft,
      owningUid: testWorkerId,
      relatedMotherId: testMotherId,
      syncState: 'pending_sync',
    });

    assert(
      savedWorkerRecord.id === workerMsgId && savedWorkerRecord.motherId === testMotherId,
      'Test 3: Save Health Worker reply draft to IndexedDB associated with target mother',
      `Mother ID: ${savedWorkerRecord.motherId}`
    );

    // -------------------------------------------------------------
    // TEST 4: Get pending sync records queue
    // -------------------------------------------------------------
    const pendingRecords = await getAllPendingSyncRecords();
    const pendingMessages = pendingRecords.filter((r) => r.storeName === 'messageDrafts');

    assert(
      pendingMessages.length >= 2,
      'Test 4: Pending sync queue includes both Mother and Health Worker pending messages',
      `Pending count: ${pendingMessages.length}`
    );

    // -------------------------------------------------------------
    // TEST 5: Update sync state from pending_sync to synced
    // -------------------------------------------------------------
    await updateLocalSyncState('messageDrafts', offlineMsgId, 'synced');
    const updatedDrafts = await getLocalDrafts<DirectMessage>('messageDrafts');
    const updatedOfflineMsg = updatedDrafts.find((d) => d.id === offlineMsgId);

    assert(
      (updatedOfflineMsg as any)?.syncState === 'synced',
      'Test 5: Update message sync state in IndexedDB upon server acknowledgment',
      `New Sync State: ${(updatedOfflineMsg as any)?.syncState}`
    );

    console.log('================================================================');
    console.log(`SUMMARY: ${passedTests}/${totalTests} tests passed successfully.`);
    console.log('================================================================');

    if (passedTests !== totalTests) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Offline Messaging Test Error:', err);
    process.exit(1);
  }
}

runOfflineMessagingTests();
