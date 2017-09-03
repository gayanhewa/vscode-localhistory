'use strict';

import {
        commands as Commands,
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
    const StorageIntervalInSeconds = 600;
    const NumberOfStorageItems = 10;

    let storage: Memento;
    storage = context.globalState;

    let localHistoryProvider: LocalHistoryProvider = new LocalHistoryProvider(storage);

    const registration = Disposable.from (
        workspace.registerTextDocumentContentProvider ('localhistory-preview', localHistoryProvider)
    );

    let disposableShowLocalHistory = Commands.registerCommand('extension.showLocalHistory', () => {
        let key = 'local.history' + Window.activeTextEditor.document.fileName;
        let fileHistory: Array<HistoricalItem> = storage.get(key);
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

        Window.showQuickPick(items)
            .then(selection => {
                let diffUri = Uri.parse('localhistory-preview://'+selection.key+'#'+selection.createdAt.toString());
                Commands.executeCommand('vscode.diff', Window.activeTextEditor.document.uri, diffUri, 'Local History Diff');

            });

    });

    workspace.onDidChangeTextDocument((e) => {
        let changedDatetime = new Date();
        let key = 'local.history' + e.document.fileName;

        if (e.document.fileName.startsWith('Untitled')) {
            console.log(e.document.fileName, 'Unsupported document');
        } else {
            let fileHistory: Array<HistoricalItem> = storage.get(key) || [];
            // First item
            if (fileHistory.length < 1) {
                fileHistory.push({ content: e.document.getText(), createdAt: changedDatetime })
            } else {
                let lastItemCreatedAt = moment(fileHistory[0].createdAt);
                // cache at every 15min interval
                if (moment().diff(lastItemCreatedAt, 'seconds') > StorageIntervalInSeconds) {
                    fileHistory.unshift({ content: e.document.getText(), createdAt: changedDatetime });
                    // Every single file have only the five last revisions.
                    if (fileHistory.length > NumberOfStorageItems) {
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
