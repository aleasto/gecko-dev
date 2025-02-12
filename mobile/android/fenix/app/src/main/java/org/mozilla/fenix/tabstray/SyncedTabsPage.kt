/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

package org.mozilla.fenix.tabstray

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import mozilla.components.lib.state.ext.observeAsState
import org.mozilla.fenix.tabstray.syncedtabs.SyncedTabsList
import org.mozilla.fenix.tabstray.syncedtabs.OnTabClick as OnSyncedTabClick
import org.mozilla.fenix.tabstray.syncedtabs.OnTabCloseClick as OnSyncedTabClose

/**
 * UI for displaying the Synced Tabs Page in the Tabs Tray.
 *
 * @param tabsTrayStore [TabsTrayStore] used to listen for changes to [TabsTrayState].
 * @param onTabClick Invoked when the user clicks on a tab.
 * @param onTabClose Invoked when the user clicks to close a tab.
 */
@Composable
internal fun SyncedTabsPage(
    tabsTrayStore: TabsTrayStore,
    onTabClick: OnSyncedTabClick,
    onTabClose: OnSyncedTabClose,
) {
    val syncedTabs by tabsTrayStore.observeAsState(
        initialValue = tabsTrayStore.state.syncedTabs,
    ) { state -> state.syncedTabs }

    SyncedTabsList(
        syncedTabs = syncedTabs,
        onTabClick = onTabClick,
        onTabCloseClick = onTabClose,
    )
}
