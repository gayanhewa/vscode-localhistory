'use strict';

import {
        commands,
        Disposable,
        ExtensionContext,
        Memento,
        QuickPickItem,
        TextDocumentContentProvider,
        TextEditor,
        window as Window,
        workspace,
        Uri
    } from 'vscode';
import * as moment from 'moment';

interface HistoricalItem
{
    content?:string,
    createdAt: Date
}

interface HistoryQuickPickItem extends QuickPickItem {
    content: string,
    key: string,
    createdAt: Date
}


export default class LocalHistoryProvider implements TextDocumentContentProvider {

    private storage: Memento;

    constructor(storage:Memento)
    {
        this.storage = storage;
    }

    /**
     *
     * @param {vscode.Uri} uri - a fake uri
     * @returns {string} - settings read from the JSON file
     **/
  public provideTextDocumentContent (uri : Uri) : string {
    let fileHistory: Array<HistoricalItem> = this.storage.get('local.history' + uri.fsPath, []);
    let content:string = '';

    fileHistory.filter(item => {
        return item.createdAt.toString() === uri.fragment;
    }).forEach(item => {
        content = item.content;
    });

    return content;
  }
}

export function activate(context: ExtensionContext) {
    const StorageIntervalInSeconds = workspace.getConfiguration().get<number>('localhistory.backupInterval');
    const NumberOfStorageItems =  workspace.getConfiguration().get<number>('localhistory.numberOfLocalHistoryItems');;

    let storage: Memento;
    storage = context.globalState;

    let localHistoryProvider: LocalHistoryProvider = new LocalHistoryProvider(storage);

    const registration = Disposable.from (
        workspace.registerTextDocumentContentProvider ('localhistory-preview', localHistoryProvider)
    );

    let disposableShowLocalHistory = commands.registerCommand('extension.showLocalHistory', () => {
      let key = 'local.history' + Window.activeTextEditor.document.fileName;
        let fileHistory: Array<HistoricalItem> = storage.get(key, []);
        let items:Array<HistoryQuickPickItem> = fileHistory.map((file) => {
            let fname = Window.activeTextEditor.document.fileName.split('/').pop();
            return {
                key: key,
                label: fname,
                description: fname + ' ' + file.createdAt.toString(),
                content: file.content,
                createdAt: file.createdAt
            }
        });

        if (items.length > 0) {
          Window.showQuickPick(items)
            .then(selection => {
                if (selection !== undefined) {
                  let diffUri = Uri.parse('localhistory-preview://'+selection.key+'#'+selection.createdAt.toString());
                  commands.executeCommand('vscode.diff', diffUri, Window.activeTextEditor.document.uri, 'Local History Diff');
                }
            });
        } else {
          Window.showInformationMessage('Local history not available for the selected file.');
        }
    });

    workspace.onDidChangeTextDocument((e) => {
        let changedDatetime = new Date();
        let key = 'local.history' + e.document.fileName;

        if (e.document.fileName.startsWith('Untitled')) {
            Window.setStatusBarMessage(e.document.fileName  + ' is not supported for local history backups.');
        } else {
            let fileHistory: Array<HistoricalItem> = storage.get(key) || [];
            // First item
            if (fileHistory.length < 1) {
                fileHistory.push({ content: e.document.getText(), createdAt: changedDatetime })
            } else {
                let lastItemCreatedAt = moment(fileHistory[0].createdAt);
                if (moment().diff(lastItemCreatedAt, 'seconds') > StorageIntervalInSeconds) {
                  Window.setStatusBarMessage('Saving file to Local History.')
                    fileHistory.unshift({ content: e.document.getText(), createdAt: changedDatetime });
                    // Every single file have only the five last revisions.
                    if (fileHistory.length > NumberOfStorageItems) {
                        // remove the last item.
                        fileHistory.pop();
                    }
                }
            }

            storage.update(key, fileHistory);
        }
    })

    context.subscriptions.push(disposableShowLocalHistory);
    context.subscriptions.push (registration);
}

export function deactivate() {
}
