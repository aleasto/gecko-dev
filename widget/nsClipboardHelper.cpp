/* -*- Mode: C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "nsClipboardHelper.h"

// basics
#include "nsComponentManagerUtils.h"
#include "nsCOMPtr.h"
#include "nsXPCOM.h"
#include "nsISupportsPrimitives.h"
#include "nsServiceManagerUtils.h"

// helpers
#include "nsIClipboard.h"
#include "mozilla/dom/Document.h"
#include "nsITransferable.h"
#include "nsReadableUtils.h"

NS_IMPL_ISUPPORTS(nsClipboardHelper, nsIClipboardHelper)

/*****************************************************************************
 * nsClipboardHelper ctor / dtor
 *****************************************************************************/

nsClipboardHelper::nsClipboardHelper() = default;

nsClipboardHelper::~nsClipboardHelper() {
  // no members, nothing to destroy
}

/*****************************************************************************
 * nsIClipboardHelper methods
 *****************************************************************************/

NS_IMETHODIMP
nsClipboardHelper::CopyStringToClipboard(
    const nsAString& aString, int32_t aClipboardID,
    mozilla::dom::WindowContext* aSettingWindowContext,
    SensitiveData aSensitive) {
  nsresult rv;

  // get the clipboard
  nsCOMPtr<nsIClipboard> clipboard(
      do_GetService("@mozilla.org/widget/clipboard;1", &rv));
  NS_ENSURE_SUCCESS(rv, rv);
  NS_ENSURE_TRUE(clipboard, NS_ERROR_FAILURE);

  // don't go any further if they're asking for the selection
  // clipboard on a platform which doesn't support it (i.e., unix)
  if (nsIClipboard::kSelectionClipboard == aClipboardID &&
      !clipboard->IsClipboardTypeSupported(nsIClipboard::kSelectionClipboard)) {
    return NS_ERROR_FAILURE;
  }

  // don't go any further if they're asking for the find clipboard on a platform
  // which doesn't support it (i.e., non-osx)
  if (nsIClipboard::kFindClipboard == aClipboardID &&
      !clipboard->IsClipboardTypeSupported(nsIClipboard::kFindClipboard)) {
    return NS_ERROR_FAILURE;
  }

  // create a transferable for putting data on the clipboard
  nsCOMPtr<nsITransferable> trans(
      do_CreateInstance("@mozilla.org/widget/transferable;1", &rv));
  NS_ENSURE_SUCCESS(rv, rv);
  NS_ENSURE_TRUE(trans, NS_ERROR_FAILURE);

  trans->Init(nullptr);
  if (aSensitive == SensitiveData::Sensitive) {
    trans->SetIsPrivateData(true);
  }

  // Add the text data flavor to the transferable
  rv = trans->AddDataFlavor(kTextMime);
  NS_ENSURE_SUCCESS(rv, rv);

  // get wStrings to hold clip data
  nsCOMPtr<nsISupportsString> data(
      do_CreateInstance("@mozilla.org/supports-string;1", &rv));
  NS_ENSURE_SUCCESS(rv, rv);
  NS_ENSURE_TRUE(data, NS_ERROR_FAILURE);

  // populate the string
  rv = data->SetData(aString);
  NS_ENSURE_SUCCESS(rv, rv);

  // Pass the data object as |nsISupports| so that when the transferable holds
  // onto it, it will addref the correct interface.
  rv = trans->SetTransferData(kTextMime, ToSupports(data));
  NS_ENSURE_SUCCESS(rv, rv);

  // put the transferable on the clipboard
  rv = clipboard->SetData(trans, nullptr, aClipboardID, aSettingWindowContext);
  NS_ENSURE_SUCCESS(rv, rv);

  return NS_OK;
}

NS_IMETHODIMP
nsClipboardHelper::CopyString(
    const nsAString& aString,
    mozilla::dom::WindowContext* aSettingWindowContext,
    SensitiveData aSensitive) {
  nsresult rv;

  // copy to the global clipboard. it's bad if this fails in any way.
  rv = CopyStringToClipboard(aString, nsIClipboard::kGlobalClipboard,
                             aSettingWindowContext, aSensitive);
  NS_ENSURE_SUCCESS(rv, rv);

  // unix also needs us to copy to the selection clipboard. this will
  // fail in CopyStringToClipboard if we're not on a platform that
  // supports the selection clipboard. (this could have been #ifdef
  // XP_UNIX, but using the IsClipboardTypeSupported call is the more correct
  // thing to do.
  //
  // if this fails in any way other than "not being unix", we'll get
  // the assertion we need in CopyStringToClipboard, and we needn't
  // assert again here.
  CopyStringToClipboard(aString, nsIClipboard::kSelectionClipboard,
                        aSettingWindowContext, aSensitive);

  return NS_OK;
}
