/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ts=8 sts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "DirectoryLockImpl.h"

#include "mozilla/ReverseIterator.h"
#include "mozilla/dom/quota/Client.h"
#include "mozilla/dom/quota/QuotaManager.h"

namespace mozilla::dom::quota {

DirectoryLockImpl::DirectoryLockImpl(
    MovingNotNull<RefPtr<QuotaManager>> aQuotaManager,
    const Nullable<PersistenceType>& aPersistenceType,
    const nsACString& aSuffix, const nsACString& aGroup,
    const OriginScope& aOriginScope, const nsACString& aStorageOrigin,
    bool aIsPrivate, const Nullable<Client::Type>& aClientType,
    const bool aExclusive, const bool aInternal,
    const ShouldUpdateLockIdTableFlag aShouldUpdateLockIdTableFlag,
    const DirectoryLockCategory aCategory)
    : mQuotaManager(std::move(aQuotaManager)),
      mPersistenceType(aPersistenceType),
      mSuffix(aSuffix),
      mGroup(aGroup),
      mOriginScope(aOriginScope),
      mStorageOrigin(aStorageOrigin),
      mClientType(aClientType),
      mId(mQuotaManager->GenerateDirectoryLockId()),
      mIsPrivate(aIsPrivate),
      mExclusive(aExclusive),
      mInternal(aInternal),
      mShouldUpdateLockIdTable(aShouldUpdateLockIdTableFlag ==
                               ShouldUpdateLockIdTableFlag::Yes),
      mCategory(aCategory),
      mRegistered(false) {
  AssertIsOnOwningThread();
  MOZ_ASSERT_IF(aOriginScope.IsOrigin(), !aOriginScope.GetOrigin().IsEmpty());
  MOZ_ASSERT_IF(!aInternal, !aPersistenceType.IsNull());
  MOZ_ASSERT_IF(!aInternal,
                aPersistenceType.Value() != PERSISTENCE_TYPE_INVALID);
  MOZ_ASSERT_IF(!aInternal, !aGroup.IsEmpty());
  MOZ_ASSERT_IF(!aInternal, aOriginScope.IsOrigin());
  MOZ_ASSERT_IF(!aInternal, !aStorageOrigin.IsEmpty());
  MOZ_ASSERT_IF(!aInternal && !aIsPrivate,
                aOriginScope.GetOrigin() == aStorageOrigin);
  MOZ_ASSERT_IF(!aInternal && aIsPrivate,
                aOriginScope.GetOrigin() != aStorageOrigin);
  MOZ_ASSERT_IF(!aInternal, !aClientType.IsNull());
  MOZ_ASSERT_IF(!aInternal, aClientType.Value() < Client::TypeMax());
}

DirectoryLockImpl::~DirectoryLockImpl() {
  AssertIsOnOwningThread();
  MOZ_DIAGNOSTIC_ASSERT(!mRegistered);
}

#ifdef DEBUG

void DirectoryLockImpl::AssertIsOnOwningThread() const {
  mQuotaManager->AssertIsOnOwningThread();
}

#endif  // DEBUG

bool DirectoryLockImpl::Overlaps(const DirectoryLockImpl& aLock) const {
  AssertIsOnOwningThread();

  // If the persistence types don't overlap, the op can proceed.
  if (!aLock.mPersistenceType.IsNull() && !mPersistenceType.IsNull() &&
      aLock.mPersistenceType.Value() != mPersistenceType.Value()) {
    return false;
  }

  // If the origin scopes don't overlap, the op can proceed.
  bool match = aLock.mOriginScope.Matches(mOriginScope);
  if (!match) {
    return false;
  }

  // If the client types don't overlap, the op can proceed.
  if (!aLock.mClientType.IsNull() && !mClientType.IsNull() &&
      aLock.mClientType.Value() != mClientType.Value()) {
    return false;
  }

  // Otherwise, when all attributes overlap (persistence type, origin scope and
  // client type) the op must wait.
  return true;
}

bool DirectoryLockImpl::MustWaitFor(const DirectoryLockImpl& aLock) const {
  AssertIsOnOwningThread();

  // Waiting is never required if the ops in comparison represent shared locks.
  if (!aLock.mExclusive && !mExclusive) {
    return false;
  }

  // Wait if the ops overlap.
  return Overlaps(aLock);
}

void DirectoryLockImpl::NotifyOpenListener() {
  AssertIsOnOwningThread();

  if (mInvalidated) {
    mAcquirePromiseHolder.Reject(NS_ERROR_FAILURE, __func__);
  } else {
    mAcquired.Flip();

    mAcquirePromiseHolder.Resolve(true, __func__);
  }

  MOZ_ASSERT(mAcquirePromiseHolder.IsEmpty());

  mQuotaManager->RemovePendingDirectoryLock(*this);

  mPending.Flip();

  if (mInvalidated) {
    mDropped.Flip();

    Unregister();
  }
}

void DirectoryLockImpl::Invalidate() {
  AssertIsOnOwningThread();

  mInvalidated.EnsureFlipped();

  if (mInvalidateCallback) {
    MOZ_ALWAYS_SUCCEEDS(GetCurrentSerialEventTarget()->Dispatch(
        NS_NewRunnableFunction("DirectoryLockImpl::Invalidate",
                               [invalidateCallback = mInvalidateCallback]() {
                                 invalidateCallback();
                               }),
        NS_DISPATCH_NORMAL));
  }
}

void DirectoryLockImpl::Unregister() {
  AssertIsOnOwningThread();
  MOZ_ASSERT(mRegistered);

  // We must call UnregisterDirectoryLock before unblocking other locks because
  // UnregisterDirectoryLock also updates the origin last access time and the
  // access flag (if the last lock for given origin is unregistered). One of the
  // blocked locks could be requested by the clear/reset operation which stores
  // cached information about origins in storage.sqlite. So if the access flag
  // is not updated before unblocking the lock for reset/clear, we might store
  // invalid information which can lead to omitting origin initialization during
  // next temporary storage initialization.
  mQuotaManager->UnregisterDirectoryLock(*this);

  MOZ_ASSERT(!mRegistered);

  for (NotNull<RefPtr<DirectoryLockImpl>> blockingLock : mBlocking) {
    blockingLock->MaybeUnblock(*this);
  }

  mBlocking.Clear();
}

bool DirectoryLockImpl::MustWait() const {
  AssertIsOnOwningThread();
  MOZ_ASSERT(!mRegistered);

  for (const DirectoryLockImpl* const existingLock :
       mQuotaManager->mDirectoryLocks) {
    if (MustWaitFor(*existingLock)) {
      return true;
    }
  }

  return false;
}

nsTArray<RefPtr<DirectoryLock>> DirectoryLockImpl::LocksMustWaitFor() const {
  AssertIsOnOwningThread();
  MOZ_ASSERT(!mRegistered);

  nsTArray<RefPtr<DirectoryLock>> locks;

  for (DirectoryLockImpl* const existingLock : mQuotaManager->mDirectoryLocks) {
    if (MustWaitFor(*existingLock)) {
      locks.AppendElement(static_cast<UniversalDirectoryLock*>(existingLock));
    }
  }

  return locks;
}

RefPtr<BoolPromise> DirectoryLockImpl::Acquire() {
  AssertIsOnOwningThread();

  RefPtr<BoolPromise> result = mAcquirePromiseHolder.Ensure(__func__);

  AcquireInternal();

  return result;
}

void DirectoryLockImpl::AcquireInternal() {
  AssertIsOnOwningThread();

  mQuotaManager->AddPendingDirectoryLock(*this);

  // See if this lock needs to wait.
  bool blocked = false;

  // XXX It is probably unnecessary to iterate this in reverse order.
  for (DirectoryLockImpl* const existingLock :
       Reversed(mQuotaManager->mDirectoryLocks)) {
    if (MustWaitFor(*existingLock)) {
      existingLock->AddBlockingLock(*this);
      AddBlockedOnLock(*existingLock);
      blocked = true;
    }
  }

  mQuotaManager->RegisterDirectoryLock(*this);

  // Otherwise, notify the open listener immediately.
  if (!blocked) {
    NotifyOpenListener();
    return;
  }

  if (!mExclusive || !mInternal) {
    return;
  }

  // All the locks that block this new exclusive internal lock need to be
  // invalidated. We also need to notify clients to abort operations for them.
  QuotaManager::DirectoryLockIdTableArray lockIds;
  lockIds.SetLength(Client::TypeMax());

  const auto& blockedOnLocks = GetBlockedOnLocks();
  MOZ_ASSERT(!blockedOnLocks.IsEmpty());

  for (DirectoryLockImpl* blockedOnLock : blockedOnLocks) {
    if (!blockedOnLock->IsInternal()) {
      blockedOnLock->Invalidate();

      // Clients don't have to handle pending locks. Invalidation is sufficient
      // in that case (once a lock is ready and the listener needs to be
      // notified, we will call DirectoryLockFailed instead of
      // DirectoryLockAcquired which should release any remaining references to
      // the lock).
      if (!blockedOnLock->IsPending()) {
        lockIds[blockedOnLock->ClientType()].Put(blockedOnLock->Id());
      }
    }
  }

  mQuotaManager->AbortOperationsForLocks(lockIds);
}

void DirectoryLockImpl::AcquireImmediately() {
  AssertIsOnOwningThread();
  MOZ_ASSERT(!MustWait());

  mQuotaManager->RegisterDirectoryLock(*this);

  mAcquired.Flip();
}

#ifdef DEBUG
void DirectoryLockImpl::AssertIsAcquiredExclusively() {
  AssertIsOnOwningThread();
  MOZ_ASSERT(mBlockedOn.IsEmpty());
  MOZ_ASSERT(mExclusive);
  MOZ_ASSERT(mInternal);
  MOZ_ASSERT(mRegistered);
  MOZ_ASSERT(!mInvalidated);
  MOZ_ASSERT(mAcquired);

  bool found = false;

  for (const DirectoryLockImpl* const existingLock :
       mQuotaManager->mDirectoryLocks) {
    if (existingLock == this) {
      MOZ_ASSERT(!found);
      found = true;
    } else if (existingLock->mAcquired) {
      MOZ_ASSERT(false);
    }
  }

  MOZ_ASSERT(found);
}
#endif

void DirectoryLockImpl::Drop() {
  AssertIsOnOwningThread();
  MOZ_ASSERT_IF(!mRegistered, mBlocking.IsEmpty());

  mDropped.Flip();

  if (mRegistered) {
    Unregister();
  }
}

void DirectoryLockImpl::OnInvalidate(std::function<void()>&& aCallback) {
  mInvalidateCallback = std::move(aCallback);
}

RefPtr<ClientDirectoryLock> DirectoryLockImpl::SpecializeForClient(
    PersistenceType aPersistenceType,
    const quota::OriginMetadata& aOriginMetadata,
    Client::Type aClientType) const {
  AssertIsOnOwningThread();
  MOZ_ASSERT(aPersistenceType != PERSISTENCE_TYPE_INVALID);
  MOZ_ASSERT(!aOriginMetadata.mGroup.IsEmpty());
  MOZ_ASSERT(!aOriginMetadata.mOrigin.IsEmpty());
  MOZ_ASSERT(aClientType < Client::TypeMax());
  MOZ_ASSERT(mAcquirePromiseHolder.IsEmpty());
  MOZ_ASSERT(mBlockedOn.IsEmpty());

  if (NS_WARN_IF(mExclusive)) {
    return nullptr;
  }

  RefPtr<DirectoryLockImpl> lock =
      Create(mQuotaManager, Nullable<PersistenceType>(aPersistenceType),
             aOriginMetadata.mSuffix, aOriginMetadata.mGroup,
             OriginScope::FromOrigin(aOriginMetadata.mOrigin),
             aOriginMetadata.mStorageOrigin, aOriginMetadata.mIsPrivate,
             Nullable<Client::Type>(aClientType),
             /* aExclusive */ false, mInternal,
             ShouldUpdateLockIdTableFlag::Yes, mCategory);
  if (NS_WARN_IF(!Overlaps(*lock))) {
    return nullptr;
  }

#ifdef DEBUG
  for (DirectoryLockImpl* const existingLock :
       Reversed(mQuotaManager->mDirectoryLocks)) {
    if (existingLock != this && !existingLock->MustWaitFor(*this)) {
      MOZ_ASSERT(!existingLock->MustWaitFor(*lock));
    }
  }
#endif

  for (const auto& blockedLock : mBlocking) {
    if (blockedLock->MustWaitFor(*lock)) {
      lock->AddBlockingLock(*blockedLock);
      blockedLock->AddBlockedOnLock(*lock);
    }
  }

  mQuotaManager->RegisterDirectoryLock(*lock);

  if (mInvalidated) {
    lock->Invalidate();
  }

  return lock;
}

void DirectoryLockImpl::Log() const {
  AssertIsOnOwningThread();

  if (!QM_LOG_TEST()) {
    return;
  }

  QM_LOG(("DirectoryLockImpl [%p]", this));

  nsCString persistenceType;
  if (mPersistenceType.IsNull()) {
    persistenceType.AssignLiteral("null");
  } else {
    persistenceType.Assign(PersistenceTypeToString(mPersistenceType.Value()));
  }
  QM_LOG(("  mPersistenceType: %s", persistenceType.get()));

  QM_LOG(("  mGroup: %s", mGroup.get()));

  nsCString originScope;
  if (mOriginScope.IsOrigin()) {
    originScope.AssignLiteral("origin:");
    originScope.Append(mOriginScope.GetOrigin());
  } else if (mOriginScope.IsPrefix()) {
    originScope.AssignLiteral("prefix:");
    originScope.Append(mOriginScope.GetOriginNoSuffix());
  } else if (mOriginScope.IsPattern()) {
    originScope.AssignLiteral("pattern:");
    // Can't call GetJSONPattern since it only works on the main thread.
  } else {
    MOZ_ASSERT(mOriginScope.IsNull());
    originScope.AssignLiteral("null");
  }
  QM_LOG(("  mOriginScope: %s", originScope.get()));

  const auto clientType = mClientType.IsNull()
                              ? nsAutoCString{"null"_ns}
                              : Client::TypeToText(mClientType.Value());
  QM_LOG(("  mClientType: %s", clientType.get()));

  nsCString blockedOnString;
  for (auto blockedOn : mBlockedOn) {
    blockedOnString.Append(
        nsPrintfCString(" [%p]", static_cast<void*>(blockedOn)));
  }
  QM_LOG(("  mBlockedOn:%s", blockedOnString.get()));

  QM_LOG(("  mExclusive: %d", mExclusive));

  QM_LOG(("  mInternal: %d", mInternal));

  QM_LOG(("  mInvalidated: %d", static_cast<bool>(mInvalidated)));

  for (auto blockedOn : mBlockedOn) {
    blockedOn->Log();
  }
}

}  // namespace mozilla::dom::quota
